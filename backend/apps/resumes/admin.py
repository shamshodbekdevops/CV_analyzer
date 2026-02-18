from django.contrib import admin

from apps.resumes.models import Resume, ResumeVersion


class ResumeVersionInline(admin.TabularInline):
    model = ResumeVersion
    extra = 0
    fields = ("id", "created_at")
    readonly_fields = ("id", "created_at")
    can_delete = False
    show_change_link = True


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "owner",
        "versions_count",
        "share_links_count",
        "updated_at",
        "created_at",
    )
    list_filter = ("created_at", "updated_at")
    search_fields = ("title", "owner__username", "owner__email")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("owner",)
    inlines = (ResumeVersionInline,)
    ordering = ("-updated_at",)
    fieldsets = (
        ("Ownership", {"fields": ("owner", "title")}),
        ("Resume Content", {"fields": ("content",), "classes": ("collapse",)}),
        ("Latest Analysis", {"fields": ("latest_analysis",), "classes": ("collapse",)}),
        ("Audit", {"fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Versions")
    def versions_count(self, obj):
        return obj.versions.count()

    @admin.display(description="Share Links")
    def share_links_count(self, obj):
        return obj.share_links.count()


@admin.register(ResumeVersion)
class ResumeVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "resume", "resume_owner", "created_at")
    list_filter = ("created_at",)
    search_fields = ("resume__title", "resume__owner__username", "resume__owner__email")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("resume",)
    ordering = ("-created_at",)
    fieldsets = (
        ("Link", {"fields": ("resume",)}),
        ("Version Data", {"fields": ("content", "analysis_snapshot"), "classes": ("collapse",)}),
        ("Audit", {"fields": ("created_at",)}),
    )

    @admin.display(description="Owner")
    def resume_owner(self, obj):
        return obj.resume.owner
