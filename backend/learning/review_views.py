"""Educator publishing: text-only patches, optimistic concurrency and durable audit."""
import copy
import hashlib
import json
from pathlib import Path
from functools import wraps
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET, require_http_methods
from .models import Chapter, Lesson, LessonBlock, ExamQuestion, ContentRevision, EducatorFeedback, FeedbackReply

MODELS = {'block': LessonBlock, 'exam': ExamQuestion, 'lesson': Lesson, 'chapter': Chapter}
FIELDS = {
    'block': ['title_en','title_ta','body_en','body_ta','options_en','options_ta','explanation_en','explanation_ta'],
    'exam': ['title_en','title_ta','prompt_en','prompt_ta','options_en','options_ta','solution_en','solution_ta'],
    'lesson': ['title_en','title_ta'], 'chapter': ['title_en','title_ta'],
}

BUILTIN_CAPTIONS = json.loads((Path(__file__).resolve().parent.parent/'seed'/'explainer_captions.json').read_text(encoding='utf-8'))
def caption_steps(obj):
    return obj.video_steps or (BUILTIN_CAPTIONS.get(obj.explainer,[]) if not obj.video_url else [])

def allowed(user):
    return user.is_authenticated and user.has_perm('learning.publish_wording')

def reviewer(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not allowed(request.user):
            return JsonResponse({'error': 'Educator publishing permission required.'}, status=403)
        response = view(request, *args, **kwargs)
        response['Cache-Control'] = 'private, no-store'
        return response
    return wrapped

def target_object(target, lock=False):
    if not isinstance(target,str) or len(target)>160: raise ValidationError('Invalid content target.')
    kind, _, pk = target.partition(':')
    if kind not in MODELS or not pk:
        raise ValidationError('Unknown content target.')
    qs = MODELS[kind].objects.all()
    if lock: qs = qs.select_for_update()
    return kind, get_object_or_404(qs, pk=pk)

def snapshot(kind, obj):
    result = {f: getattr(obj, f) for f in FIELDS[kind]}
    if kind == 'block':
        for i, step in enumerate(caption_steps(obj)):
            for lang in ['en','ta']: result[f'video_steps.{i}.{lang}'] = step[lang]
    if kind == 'exam':
        for i, part in enumerate(obj.structured_parts):
            for key in ['prompt','answer','image_alt']:
                for lang in ['en','ta']:
                    if lang in part.get(key, {}): result[f'structured_parts.{i}.{key}.{lang}'] = part[key][lang]
    return result

def version(kind, obj):
    # Include non-text fields too: changes made in the admin must also cause conflicts.
    values = {f.name: str(getattr(obj, f.attname)) for f in obj._meta.fields}
    return hashlib.sha256(json.dumps(values, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

def apply_text(kind, obj, values):
    obj.video_steps = copy.deepcopy(caption_steps(obj) if kind == 'block' else [])
    obj.structured_parts = copy.deepcopy(getattr(obj, 'structured_parts', []))
    for path, value in values.items():
        bits = path.split('.')
        if len(bits) == 1: setattr(obj, path, value)
        else:
            parent = getattr(obj, bits[0])
            for bit in bits[1:-1]: parent = parent[int(bit)] if isinstance(parent, list) else parent[bit]
            parent[bits[-1]] = value
    obj.full_clean()
    obj.save()

def read_body(request):
    value = json.loads(request.body)
    if not isinstance(value, dict): raise ValueError('Invalid request.')
    return value

@require_GET
def revision_clock(request):
    response = JsonResponse({'revision': ContentRevision.objects.values_list('id', flat=True).first() or 0})
    response['Cache-Control'] = 'no-store'
    return response

@require_http_methods(['GET','POST'])
@reviewer
def content(request):
    try:
        data = read_body(request) if request.method == 'POST' else request.GET
        target = data.get('target', '')
        with transaction.atomic():
            kind, obj = target_object(target, request.method == 'POST')
            current = snapshot(kind, obj)
            if request.method == 'POST':
                if data.get('version') != version(kind, obj):
                    return JsonResponse({'error':'Someone changed this content. Close and reopen the editor before saving.'}, status=409)
                changes = data.get('fields')
                reason = data.get('reason', '')
                if not isinstance(changes, dict) or not changes or any(k not in current or not isinstance(v,str) or len(v)>20000 for k,v in changes.items()):
                    raise ValidationError('Only the listed wording fields may be edited (maximum 20,000 characters each).')
                if not isinstance(reason,str) or not 1 <= len(reason.strip()) <= 500:
                    raise ValidationError('Add a short reason for the correction (1–500 characters).')
                after = {**current, **changes}
                if after != current:
                    apply_text(kind, obj, changes)
                    ContentRevision.objects.create(target=target, author=request.user, before=current, after=after, reason=reason.strip())
            history = list(ContentRevision.objects.filter(target=target).values('id','reason','created_at','author__username','before','after')[:50])
            return JsonResponse({'fields':snapshot(kind,obj),'version':version(kind,obj),'history':history})
    except (ValueError, TypeError, ValidationError) as exc:
        return JsonResponse({'error': '; '.join(exc.messages) if isinstance(exc,ValidationError) else 'Invalid request.'}, status=400)

@require_http_methods(['POST'])
@reviewer
def rollback(request, pk):
    if not request.user.is_superuser:
        return JsonResponse({'error':'Only the super admin can restore earlier wording.'}, status=403)
    try:
        data = read_body(request)
        old = get_object_or_404(ContentRevision, pk=pk)
        with transaction.atomic():
            kind,obj = target_object(old.target, True)
            if data.get('version') != version(kind,obj):
                return JsonResponse({'error':'Content changed. Reopen the editor first.'},status=409)
            before = snapshot(kind,obj)
            if set(before) != set(old.before): raise ValidationError('Content structure changed; restore wording manually.')
            apply_text(kind,obj,old.before)
            ContentRevision.objects.create(target=old.target,author=request.user,before=before,after=old.before,reason=f'Restored before revision {old.pk}')
        return JsonResponse({'ok':True})
    except (ValueError,TypeError,ValidationError):
        return JsonResponse({'error':'Cannot restore this version; review the current content structure.'},status=400)

def feedback_row(row):
    context = {'label': row.target, 'url': ''}
    kind, _, pk = row.target.partition(':')
    obj = MODELS.get(kind).objects.filter(pk=pk).first() if kind in MODELS else None
    if obj:
        context['label'] = obj.title_en
        if kind == 'block': context['url'] = '#/chapter/' + obj.lesson_id + ('/' + obj.instrument if obj.instrument else '')
        elif kind == 'lesson': context['url'] = '#/chapter/' + obj.pk
        elif kind == 'chapter': context['url'] = '#/chapter/' + obj.pk
        elif kind == 'exam': context['url'] = f'#/practice/{obj.chapter_id}/{obj.kind}' + ('/' + obj.section.slug if obj.section_id else '')
    return {'id':row.pk,'target':row.target,'category':row.category,'message':row.message,'timestamp':row.timestamp,'status':row.status,
            **context,
            'author':row.author.get_username() if row.author else 'Deleted account','created_at':row.created_at,
            'replies':[{'author':r.author.get_username() if r.author else 'Deleted account','message':r.message,'created_at':r.created_at} for r in row.replies.all()]}

@require_http_methods(['GET','POST'])
@reviewer
def feedback(request):
    try:
        if request.method == 'POST':
            data = read_body(request)
            target_object(data.get('target',''))
            message = data.get('message','')
            if not isinstance(message,str) or not 1 <= len(message.strip()) <= 5000: raise ValueError()
            if data.get('category') not in dict(EducatorFeedback._meta.get_field('category').choices): raise ValueError()
            stamp = data.get('timestamp')
            if stamp is not None and (type(stamp) is not int or not 0 <= stamp < 86400): raise ValueError()
            row = EducatorFeedback.objects.create(target=data['target'],author=request.user,category=data['category'],message=message.strip(),timestamp=stamp)
            return JsonResponse(feedback_row(row),status=201)
        rows = EducatorFeedback.objects.select_related('author').prefetch_related('replies__author')
        if request.GET.get('target'): rows = rows.filter(target=request.GET['target'])
        if request.GET.get('status'): rows = rows.filter(status=request.GET['status'])
        page = Paginator(rows,50).get_page(request.GET.get('page',1))
        return JsonResponse({'items':[feedback_row(r) for r in page.object_list], 'page':page.number, 'pages':page.paginator.num_pages, 'total':page.paginator.count})
    except (ValueError,TypeError,ValidationError):
        return JsonResponse({'error':'Supply a valid target, category, comment (up to 5,000 characters) and optional timestamp in seconds.'},status=400)

@require_http_methods(['POST'])
@reviewer
def reply(request, pk):
    try:
        data = read_body(request)
        with transaction.atomic():
            row = get_object_or_404(EducatorFeedback.objects.select_for_update(),pk=pk)
            status = data.get('status')
            if status is not None:
                if not request.user.has_perm('learning.manage_feedback'): return JsonResponse({'error':'Admin permission required to change status.'},status=403)
                if status not in dict(EducatorFeedback._meta.get_field('status').choices): raise ValueError()
                row.status = status
                row.save(update_fields=['status'])
            message = data.get('message','')
            if not isinstance(message,str) or len(message)>5000 or (not message.strip() and status is None): raise ValueError()
            if message.strip(): FeedbackReply.objects.create(feedback=row,author=request.user,message=message.strip())
        return JsonResponse(feedback_row(row))
    except (ValueError,TypeError):
        return JsonResponse({'error':'Enter a reply or a valid status.'},status=400)
