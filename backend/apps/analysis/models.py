from django.contrib.auth.models import User
from django.db import models
import uuid


class AnalyzeJob(models.Model):
    class SourceType(models.TextChoices):
        CV = "cv", "CV"
        GITHUB = "github", "GitHub"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="analyze_jobs")
    source_type = models.CharField(max_length=20, choices=SourceType.choices, default=SourceType.CV)
    source_input = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    source_file_key = models.CharField(max_length=500, blank=True, default="")
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["source_type", "created_at"]),
        ]


class AnalyzeUsage(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="analyze_usage")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["owner", "created_at"])]
