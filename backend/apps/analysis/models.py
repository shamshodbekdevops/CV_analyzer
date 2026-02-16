from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
import uuid


class AnalyzeJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="analyze_jobs")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    source_file_key = models.CharField(max_length=500)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]


class AnalyzeUsage(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="analyze_usage")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["owner", "created_at"])]
