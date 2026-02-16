from django.db import models

from apps.resumes.models import Resume


class ShareLink(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="share_links")
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["token"])]
