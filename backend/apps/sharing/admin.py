from django.contrib import admin
from django.utils import timezone

from apps.sharing.models import ShareLink


@admin.register(ShareLink)
class ShareLinkAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "token",
        "resume",
        "resume_owner",
        "created_at",
        "expires_at",
        "is_expired",
    )
    list_filter = ("created_at", "expires_at")
    search_fields = ("token", "resume__title", "resume__owner__username", "resume__owner__email")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("resume",)
    ordering = ("-created_at",)

    @admin.display(description="Owner")
    def resume_owner(self, obj):
        return obj.resume.owner

    @admin.display(boolean=True, description="Expired")
    def is_expired(self, obj):
        return bool(obj.expires_at and obj.expires_at <= timezone.now())
