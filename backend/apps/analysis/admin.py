from django.contrib import admin

from apps.analysis.models import AnalyzeJob, AnalyzeUsage


@admin.register(AnalyzeJob)
class AnalyzeJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "owner",
        "source_type",
        "status",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "source_type", "created_at", "updated_at")
    search_fields = ("id", "owner__username", "owner__email", "source_input", "error_message")
    readonly_fields = ("id", "created_at", "updated_at")
    autocomplete_fields = ("owner",)
    ordering = ("-created_at",)
    fieldsets = (
        ("Ownership", {"fields": ("owner",)}),
        ("Source", {"fields": ("source_type", "source_input", "source_file_key")}),
        ("Execution", {"fields": ("status", "error_message")}),
        ("Audit", {"fields": ("id", "created_at", "updated_at")}),
    )


@admin.register(AnalyzeUsage)
class AnalyzeUsageAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "created_at")
    list_filter = ("created_at",)
    search_fields = ("owner__username", "owner__email")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("owner",)
    ordering = ("-created_at",)
