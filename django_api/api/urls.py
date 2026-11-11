from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health),
    path('register', views.register),
    path('login', views.login_view),
    path('me', views.me),
    path('hostels', views.hostels),
    path('announcements', views.announcements),
    path('complaints', views.complaints),
    path('maintenance', views.maintenance),
    path('outings', views.outings),
    path('students', views.students),
    path('reports', views.reports),
]
