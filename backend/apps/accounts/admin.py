from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db.models import Count

from apps.billing.models import Subscription


class SubscriptionInline(admin.StackedInline):
    model = Subscription
    fk_name = "owner"
    extra = 0
    can_delete = False


class UserAdmin(BaseUserAdmin):
    inlines = (SubscriptionInline,)
    list_display = (
        "username",
        "email",
        "is_staff",
        "is_superuser",
        "is_active",
        "analysis_jobs_count",
        "resumes_count",
        "date_joined",
    )
    ordering = ("-date_joined",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(
            _analysis_jobs_count=Count("analyze_jobs", distinct=True),
            _resumes_count=Count("resumes", distinct=True),
        )

    @admin.display(ordering="_analysis_jobs_count", description="Analysis Jobs")
    def analysis_jobs_count(self, obj):
        return getattr(obj, "_analysis_jobs_count", 0)

    @admin.display(ordering="_resumes_count", description="Resumes")
    def resumes_count(self, obj):
        return getattr(obj, "_resumes_count", 0)


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

admin.site.register(User, UserAdmin)
