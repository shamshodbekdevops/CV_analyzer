from django.urls import path

from apps.resumes.views import ResumeDetailView, ResumeListCreateView, ResumeShareCreateView

urlpatterns = [
    path("", ResumeListCreateView.as_view(), name="resume-list-create"),
    path("<int:resume_id>", ResumeDetailView.as_view(), name="resume-detail"),
    path("<int:resume_id>/share", ResumeShareCreateView.as_view(), name="resume-share"),
]
