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
