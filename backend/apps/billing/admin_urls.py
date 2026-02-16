from django.urls import path

from apps.billing.views import AdminMetricsView

urlpatterns = [
    path("metrics", AdminMetricsView.as_view(), name="admin-metrics"),
]
