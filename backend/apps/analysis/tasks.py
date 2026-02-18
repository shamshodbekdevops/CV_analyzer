import json

from celery import shared_task
from django.conf import settings

from apps.analysis.gemini_client import gemini_client
from apps.analysis.github_scraper import GitHubScrapeError, github_scraper
from apps.analysis.models import AnalyzeJob, AnalyzeUsage
from apps.billing.models import Subscription
from core.cache_utils import build_cache_key, set_json_cache


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def process_analyze_job(self, job_id: str, source_type: str, source_payload, job_description: str = ""):
    job = AnalyzeJob.objects.get(id=job_id)
    job.status = AnalyzeJob.Status.PROCESSING
    job.save(update_fields=["status", "updated_at"])

    try:
        source_text = ""
        source_meta = {}

        if source_type == AnalyzeJob.SourceType.GITHUB:
            scraped = github_scraper.scrape(str(source_payload))
            source_text = github_scraper.to_analysis_text(scraped)
            source_meta = {
                "source": "github",
                "input": str(source_payload),
                "scraped": scraped,
            }
        else:
            source_text = str(source_payload)
            source_meta = {
                "source": "cv",
                "input": job.source_input,
            }

        ai_result = gemini_client.analyze_resume(source_text, job_description, source_kind=source_type)
        result = {
            **ai_result,
            "source_meta": source_meta,
        }

        cache_key = build_cache_key("analyze_result", str(job.id))
        set_json_cache(cache_key, result, settings.ANALYZE_RESULT_TTL_SECONDS)

        AnalyzeUsage.objects.create(owner=job.owner)

        subscription, _ = Subscription.objects.get_or_create(owner=job.owner)
        subscription.register_analysis()

        job.status = AnalyzeJob.Status.COMPLETED
        job.error_message = ""
        job.save(update_fields=["status", "error_message", "updated_at"])
    except GitHubScrapeError as exc:
        job.status = AnalyzeJob.Status.FAILED
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message", "updated_at"])
    except Exception as exc:
        job.status = AnalyzeJob.Status.FAILED
        job.error_message = str(exc)
        job.save(update_fields=["status", "error_message", "updated_at"])
        raise
