from django.urls import path

from apps.sharing.views import ShareDetailView

urlpatterns = [
    path("share/<str:token>", ShareDetailView.as_view(), name="share-detail"),
]
