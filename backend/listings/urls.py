from django.urls import path

from . import views

urlpatterns = [
    path("listings/nearby/", views.nearby, name="nearby-listings"),
]
