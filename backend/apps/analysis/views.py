from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analysis.models import AnalyzeJob
from apps.analysis.serializers import AnalyzeCreateSerializer, AnalyzeJobStatusSerializer
from apps.analysis.tasks import process_analyze_job
from apps.billing.models import Subscription
from core.cache_utils import build_cache_key, get_json_cache
from core.storage import storage_service


class AnalyzeCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AnalyzeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["file"]
        max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if upload.size > max_size:
            return Response({"detail": "File too large."}, status=status.HTTP_400_BAD_REQUEST)

        subscription, _ = Subscription.objects.get_or_create(owner=request.user)
        if not subscription.can_run_analysis():
            return Response({"detail": "Plan limit reached."}, status=status.HTTP_402_PAYMENT_REQUIRED)

        stored = storage_service.save_temp_upload(upload)
        job = AnalyzeJob.objects.create(owner=request.user, source_file_key=stored.key)

        process_analyze_job.delay(
            str(job.id),
            stored.path,
            serializer.validated_data.get("job_description", ""),
        )
        return Response({"job_id": str(job.id)}, status=status.HTTP_202_ACCEPTED)


class AnalyzeStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        job = AnalyzeJob.objects.filter(id=job_id, owner=request.user).first()
        if not job:
            return Response({"detail": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        data = AnalyzeJobStatusSerializer(job).data
        if job.status == AnalyzeJob.Status.COMPLETED:
            cache_key = build_cache_key("analyze_result", str(job.id))
            data["result"] = get_json_cache(cache_key)

        return Response(data)
