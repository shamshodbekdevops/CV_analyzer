from django.urls import path

from apps.analysis.views import AnalyzeCreateView, AnalyzeStatusView

urlpatterns = [
    path("", AnalyzeCreateView.as_view(), name="analyze-create"),
    path("<uuid:job_id>", AnalyzeStatusView.as_view(), name="analyze-status"),
]
