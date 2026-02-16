import json
from dataclasses import dataclass

from django.conf import settings


@dataclass
class AnalysisResult:
    ats_score: int
    weaknesses: list
    missing_keywords: list
    rewritten_summary: str


class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL

    def analyze_resume(self, resume_text: str, job_description: str = "") -> dict:
        if not self.api_key:
            return self._mock_result(resume_text, job_description)

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)
            prompt = (
                "Analyze this resume for ATS. Return strict JSON with keys: "
                "ats_score (0-100), weaknesses (array), missing_keywords (array), rewritten_summary (string).\n\n"
                f"Job description:\n{job_description}\n\nResume:\n{resume_text[:12000]}"
            )
            response = model.generate_content(prompt)
            cleaned = response.text.strip().strip("`")
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            payload = json.loads(cleaned[start:end + 1])
            return {
                "ats_score": int(payload.get("ats_score", 65)),
                "weaknesses": payload.get("weaknesses", []),
                "missing_keywords": payload.get("missing_keywords", []),
                "rewritten_summary": payload.get("rewritten_summary", ""),
            }
        except Exception:
            return self._mock_result(resume_text, job_description)

    def _mock_result(self, resume_text: str, job_description: str) -> dict:
        baseline = 62
        if job_description:
            baseline += 8
        return {
            "ats_score": min(95, baseline),
            "weaknesses": [
                "Summary can be more specific and metric-driven.",
                "Experience bullets should start with stronger action verbs.",
            ],
            "missing_keywords": ["leadership", "stakeholder management", "system design"],
            "rewritten_summary": "Results-driven professional with measurable impact across delivery, quality, and collaboration.",
        }


gemini_client = GeminiClient()
