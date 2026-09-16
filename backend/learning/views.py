import json
import math
from functools import wraps
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.db import connection, transaction
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from .models import Chapter, Question, Attempt


def authenticated(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Sign in required"}, status=401)
        return view(request, *args, **kwargs)
    return wrapper


@require_GET
@ensure_csrf_cookie
def health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return JsonResponse({"status": "ok", "service": "iyal-django"})


@require_http_methods(["GET", "POST", "DELETE"])
@ensure_csrf_cookie
def session(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            if not isinstance(data, dict) or not all(isinstance(data.get(k), str) for k in ["username", "password"]):
                raise ValueError()
        except (ValueError, TypeError):
            return JsonResponse({"error": "Invalid sign-in request"}, status=400)
        user = authenticate(request, username=data["username"], password=data["password"])
        if user is None:
            return JsonResponse({"error": "Incorrect username or password"}, status=401)
        login(request, user)
    elif request.method == "DELETE":
        logout(request)
    user = {"id": request.user.pk, "username": request.user.get_username()} if request.user.is_authenticated else None
    return JsonResponse({"user": user})


@require_GET
def curriculum(request):
    chapters = []
    for chapter in Chapter.objects.prefetch_related("lessons"):
        lessons = [{**lesson.metadata, "id": lesson.id, "en": lesson.title_en,
                    "ta": lesson.title_ta, "available": lesson.content_status == "published", "index": lesson.position, "content_status": lesson.content_status,
                    "edit_url": reverse("admin:learning_lesson_change",args=[quote(lesson.pk)]) if request.user.has_perm("learning.change_lesson") else None}
                   for lesson in chapter.lessons.all()]
        chapters.append({**chapter.metadata, "id": chapter.id, "en": chapter.title_en,
                         "ta": chapter.title_ta, "lessons": lessons, "edit_url": reverse("admin:learning_chapter_change",args=[quote(chapter.pk)]) if request.user.has_perm("learning.change_chapter") else None})
    return JsonResponse({"chapters": chapters, "total": sum(len(c["lessons"]) for c in chapters)})


@require_GET
def questions(request):
    rows = Question.objects.filter(active=True, lesson_id=request.GET.get("lesson", "02/projectile")).order_by("id")[:100]
    # Answers and worked explanations are never sent with an unanswered question.
    public = [{**{k: v for k, v in q.content.items() if k not in {"value", "correct", "explain", "tolerance"}},
               "key": q.id} for q in rows]
    return JsonResponse({"questions": public})


def payload(request):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict):
            raise ValueError()
        question = Question.objects.get(id=data.get("question"), active=True)
        return data, question
    except (ValueError, TypeError, Question.DoesNotExist):
        return None, None


def serialize(attempt):
    return {"id": attempt.question.style, "variant": attempt.question.variant,
            "correct": attempt.correct, "assisted": attempt.assisted, "viewed": attempt.viewed,
            "at": int(attempt.created_at.timestamp() * 1000), "prompt": attempt.prompt}


@require_http_methods(["GET", "POST", "DELETE"])
@authenticated
def attempts(request):
    if request.method == "DELETE":
        with transaction.atomic():
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            Attempt.objects.filter(user=request.user).delete()
        return JsonResponse({"attempts": []})
    if request.method == "GET":
        rows = list(Attempt.objects.filter(user=request.user).select_related("question").order_by("-created_at", "-id")[:600])
        return JsonResponse({"attempts": [serialize(a) for a in reversed(rows)]})
    data, question = payload(request)
    if question is None:
        return JsonResponse({"error": "Invalid question or JSON"}, status=400)
    answer = data.get("answer")
    try:
        if isinstance(answer, bool) or not isinstance(answer, (str, int, float)) or not str(answer).strip() or len(str(answer)) > 100:
            raise ValueError()
        number = float(answer)
        if not math.isfinite(number):
            raise ValueError()
        q = question.content
        if q["type"] == "choice":
            if not number.is_integer() or not 0 <= number < len(q["options"]):
                raise ValueError()
            correct = number == q["correct"]
        else:
            correct = abs(number - q["value"]) <= q["tolerance"]
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid answer"}, status=400)
    with transaction.atomic():
        # Serialize submissions per learner so rapid duplicate requests cannot add evidence.
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        same = Attempt.objects.filter(user=request.user, question__style=question.style,
                                      question__lesson=question.lesson, prompt=q["prompt"]["en"])
        attempt = same.filter(viewed=False).first()
        if attempt is None:
            attempt = Attempt.objects.create(user=request.user, question=question, prompt=q["prompt"]["en"],
                answer=str(answer), correct=correct, assisted=same.filter(assisted=True).exists())
    return JsonResponse({"attempt": serialize(attempt), "explain": q["explain"]})


@require_POST
@authenticated
def solution(request):
    data, question = payload(request)
    if question is None:
        return JsonResponse({"error": "Invalid question or JSON"}, status=400)
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        same = Attempt.objects.filter(user=request.user, question__style=question.style,
            question__lesson=question.lesson, prompt=question.content["prompt"]["en"])
        if not same.exists():
            Attempt.objects.create(user=request.user, question=question, prompt=question.content["prompt"]["en"],
                                   viewed=True, assisted=True)
    return JsonResponse({"explain": question.content["explain"]})
from django.contrib.admin.utils import quote
from django.urls import reverse
from django.shortcuts import get_object_or_404
from .models import Lesson

@require_GET
def lesson_content(request, lesson_id):
    lesson=get_object_or_404(Lesson,pk=lesson_id)
    blocks=[]
    if lesson.content_status == 'published':
        for block in lesson.blocks.filter(published=True):
            blocks.append({name:getattr(block,name) for name in ['id','key','instrument','position','kind','title_en','title_ta','body_en','body_ta','presentation','formula','activity','options_en','options_ta','correct_option','explanation_en','explanation_ta']})
    return JsonResponse({'id':lesson.id,'status':lesson.content_status,'blocks':blocks})

