from django.contrib.auth.models import User
from django.db import models


class Resume(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resumes")
    title = models.CharField(max_length=255)
    content = models.JSONField(default=dict)
    latest_analysis = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "created_at"]),
            models.Index(fields=["owner", "updated_at"]),
        ]


class ResumeVersion(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="versions")
    content = models.JSONField(default=dict)
    analysis_snapshot = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
