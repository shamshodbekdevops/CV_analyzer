from django.contrib import admin

from apps.billing.models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "owner",
        "plan",
        "monthly_analysis_used",
        "period_start",
        "can_run_analysis_now",
    )
    list_filter = ("plan", "period_start")
    search_fields = ("owner__username", "owner__email")
    readonly_fields = ("can_run_analysis_now",)
    autocomplete_fields = ("owner",)
    ordering = ("-period_start",)

    @admin.display(boolean=True, description="Can Run Analysis")
    def can_run_analysis_now(self, obj):
        return obj.can_run_analysis()
