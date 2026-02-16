from django.db.models import Sum
from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analysis.models import AnalyzeJob
from apps.billing.models import Subscription


class AdminMetricsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.count()
        active_pro = Subscription.objects.filter(plan=Subscription.Plan.PRO).count()
        total_jobs = AnalyzeJob.objects.count()
        completed_jobs = AnalyzeJob.objects.filter(status=AnalyzeJob.Status.COMPLETED).count()

        # Revenue and AI cost are placeholders for billing provider integration.
        revenue = active_pro * 29
        ai_cost = round(completed_jobs * 0.02, 2)

        return Response(
            {
                "users": users,
                "active_pro": active_pro,
                "jobs": total_jobs,
                "completed_jobs": completed_jobs,
                "revenue_estimate_usd": revenue,
                "ai_cost_estimate_usd": ai_cost,
            }
        )
