from django.contrib import admin
from django.urls import path
from learning import views
from learning import review_views

urlpatterns = [
    path('api/review/clock/', review_views.revision_clock),
    path('api/review/content/', review_views.content),
    path('api/review/rollback/<int:pk>/', review_views.rollback),
    path('api/review/feedback/', review_views.feedback),
    path('api/review/feedback/<int:pk>/', review_views.reply),
    path("api/lessons/<path:lesson_id>/", views.lesson_content),
    path("admin/", admin.site.urls),
    path("api/health/", views.health),
    path("api/session/", views.session),
    path("api/curriculum/", views.curriculum),
    path("api/questions/", views.questions),
    path("api/attempts/", views.attempts),
    path("api/solutions/", views.solution),
]

from learning import exam_views
from learning import photo_marking
urlpatterns += [
    path('api/exam/photo-marking/', photo_marking.status),
    path('api/exam/photo-marking/<int:pk>/', photo_marking.mark),
    path('media/<path:name>', exam_views.stored_document),
    path('api/exam/catalog/', exam_views.catalog),
    path('api/exam/questions/', exam_views.questions),
    path('api/exam/solutions/<int:pk>/', exam_views.solution),
    path('api/exam/files/<int:pk>/<str:kind>/', exam_views.document),
]
