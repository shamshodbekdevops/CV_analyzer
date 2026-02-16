from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"

    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name="subscription")
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    period_start = models.DateTimeField(default=timezone.now)
    monthly_analysis_used = models.PositiveIntegerField(default=0)

    def can_run_analysis(self) -> bool:
        if self.plan == self.Plan.PRO:
            return True
        return self.monthly_analysis_used < settings.FREE_PLAN_ANALYSIS_LIMIT

    def register_analysis(self) -> None:
        self.monthly_analysis_used += 1
        self.save(update_fields=["monthly_analysis_used"])
