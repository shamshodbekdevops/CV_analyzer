from celery import shared_task

from apps.analysis.gemini_client import gemini_client
from apps.analysis.models import AnalyzeJob, AnalyzeUsage
from apps.analysis.parser import extract_text_from_file
from apps.billing.models import Subscription
from core.cache_utils import build_cache_key, set_json_cache
from django.conf import settings


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_analyze_job(self, job_id: str, file_path: str, job_description: str = ""):
    job = AnalyzeJob.objects.get(id=job_id)
    job.status = AnalyzeJob.Status.PROCESSING
    job.save(update_fields=["status", "updated_at"])

    try:
        text = extract_text_from_file(file_path)
        result = gemini_client.analyze_resume(text, job_description)
        cache_key = build_cache_key("analyze_result", str(job.id))
        set_json_cache(cache_key, result, settings.ANALYZE_RESULT_TTL_SECONDS)

        AnalyzeUsage.objects.create(owner=job.owner)

        subscription, _ = Subscription.objects.get_or_create(owner=job.owner)
        subscription.register_analysis()

        job.status = AnalyzeJob.Status.COMPLETED
        job.error_message = ""
        job.save(update_fields=["status", "error_message", "updated_at"])
    except Exception as exc:
        job.status = AnalyzeJob.Status.FAILED
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message", "updated_at"])
        raise
