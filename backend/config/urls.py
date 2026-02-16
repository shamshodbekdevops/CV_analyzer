from django.contrib import admin
from django.urls import include, path

from apps.analysis.views import AnalyzeCreateView, AnalyzeStatusView
from apps.billing.views import AdminMetricsView
from apps.resumes.views import ResumeDetailView, ResumeListCreateView, ResumePdfExportView, ResumeShareCreateView
from apps.sharing.views import ShareDetailView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/analyze", AnalyzeCreateView.as_view(), name="analyze-create"),
    path("api/analyze/<uuid:job_id>", AnalyzeStatusView.as_view(), name="analyze-status"),
    path("api/resumes", ResumeListCreateView.as_view(), name="resume-list-create"),
    path("api/resumes/<int:resume_id>", ResumeDetailView.as_view(), name="resume-detail"),
    path("api/resumes/<int:resume_id>/share", ResumeShareCreateView.as_view(), name="resume-share"),
    path("api/resumes/<int:resume_id>/export", ResumePdfExportView.as_view(), name="resume-pdf-export"),
    path("api/share/<str:token>", ShareDetailView.as_view(), name="share-detail"),
    path("api/admin/metrics", AdminMetricsView.as_view(), name="admin-metrics"),
]
