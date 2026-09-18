from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.http import require_GET
from django.core.paginator import Paginator
from django.db.models import Count
from .models import ExamQuestion

@require_GET
def catalog(request):
    rows = ExamQuestion.objects.filter(published=True)
    return JsonResponse({'counts': list(rows.values('chapter_id','kind').annotate(total=Count('id'))),
                         'admin_url': '/admin/learning/examquestion/' if request.user.has_perm('learning.change_examquestion') else None})

@require_GET
def questions(request):
    rows = ExamQuestion.objects.filter(published=True, chapter_id=request.GET.get('chapter'), kind=request.GET.get('kind'))
    sections = list(rows.filter(section__isnull=False).values('section__slug','section__title_en','section__title_ta').annotate(total=Count('id')).order_by('section_id'))
    section = request.GET.get('section')
    if section:
        rows = rows.filter(section__slug=section)
    years = list(rows.order_by('-year').values_list('year', flat=True).distinct())
    year = request.GET.get('year')
    if year:
        if not year.isdigit():
            return JsonResponse({'error':'Invalid year'}, status=400)
        rows = rows.filter(year=int(year))
    rows = rows.order_by('-year', 'position', 'paper', 'number', 'id')
    page = Paginator(rows, 12).get_page(request.GET.get('page', 1))
    def serialize(q):
        return {'id':q.pk,'year':q.year,'number':q.number,'kind':q.kind,
                'title':{'en':q.title_en,'ta':q.title_ta}, 'prompt':{'en':q.prompt_en or q.prompt_ta,'ta':q.prompt_ta or q.prompt_en},

                'marks':q.marks,'minutes':q.minutes,'source':q.source_url,
                'pdf':f'/api/exam/files/{q.pk}/question/' if q.question_pdf else None,
                'options':{'en':(q.options_en or q.options_ta).splitlines(),'ta':(q.options_ta or q.options_en).splitlines()}}
    return JsonResponse({'sections':[{'slug':s['section__slug'],'title':{'en':s['section__title_en'],'ta':s['section__title_ta']},'total':s['total']} for s in sections], 'questions':[serialize(q) for q in page], 'years':years, 'total':page.paginator.count, 'pages':page.paginator.num_pages,'page':page.number})

@require_GET
def solution(request, pk):
    try:
        q = ExamQuestion.objects.get(pk=pk, published=True)
    except ExamQuestion.DoesNotExist:
        raise Http404
    return JsonResponse({'accepted_options':q.accepted_options or ([q.correct_option] if q.correct_option else []), 'correct_option':q.correct_option if q.kind == 'mcq' else None,
                         'solution':{'en':q.solution_en,'ta':q.solution_ta},
                         'pdf': f'/api/exam/files/{q.pk}/marking/' if q.marking_pdf else None})

@require_GET
def document(request, pk, kind):
    try:
        q = ExamQuestion.objects.get(pk=pk)
    except ExamQuestion.DoesNotExist:
        raise Http404
    if (kind == 'image' or not q.published) and not request.user.has_perm('learning.change_examquestion'):
        raise Http404
    f = q.question_pdf if kind == 'question' else q.marking_pdf if kind == 'marking' else q.question_image if kind == 'image' else None
    if not f:
        raise Http404
    try:
        is_image = kind == 'image'
        extension = f.name.rsplit('.',1)[-1].lower() if is_image else 'pdf'
        mime = ('image/png' if extension == 'png' else 'image/jpeg') if is_image else 'application/pdf'
        response = FileResponse(f.open('rb'), as_attachment=not is_image, filename=f'{q.year}-Q{q.number}-{kind}.{extension}', content_type=mime)
    except FileNotFoundError:
        raise Http404
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'private, no-store'
    return response

@require_GET
def stored_document(request, name):
    # Admin file widgets use storage URLs; apply the same publication checks.
    q = ExamQuestion.objects.filter(question_pdf=name).first()
    if q:
        return document(request, q.pk, 'question')
    q = ExamQuestion.objects.filter(question_image=name).first()
    if q:
        return document(request, q.pk, 'image')
    q = ExamQuestion.objects.filter(marking_pdf=name).first()
    if q:
        return document(request, q.pk, 'marking')
    raise Http404
