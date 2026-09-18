from django.contrib import admin
from django.urls import path
from learning import views

urlpatterns = [
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
urlpatterns += [
    path('media/<path:name>', exam_views.stored_document),
    path('api/exam/catalog/', exam_views.catalog),
    path('api/exam/questions/', exam_views.questions),
    path('api/exam/solutions/<int:pk>/', exam_views.solution),
    path('api/exam/files/<int:pk>/<str:kind>/', exam_views.document),
]
