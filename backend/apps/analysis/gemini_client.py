import json
from dataclasses import dataclass

from django.conf import settings


@dataclass
class AnalysisResult:
    ats_score: int
    overall_summary: str
    strengths: list
    weaknesses: list
    missing_keywords: list
    feature_highlights: list
    rewritten_summary: str
    improved_bullets: list
    next_actions: list


class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL

    def analyze_resume(self, resume_text: str, job_description: str = "", source_kind: str = "cv") -> dict:
        if not self.api_key:
            return self._mock_result(resume_text, job_description, source_kind)

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)

            prompt = self._build_prompt(resume_text, job_description, source_kind)
            response = model.generate_content(prompt)
            payload = self._extract_json(response.text)
            return self._normalize_payload(payload)
        except Exception:
            return self._mock_result(resume_text, job_description, source_kind)

    def _build_prompt(self, source_text: str, job_description: str, source_kind: str) -> str:
        return (
            "You are a senior technical recruiter and ATS reviewer. "
            "Analyze the candidate source and return STRICT JSON only. "
            "No markdown, no explanation.\n\n"
            "Required JSON schema:\n"
            "{\n"
            '  "ats_score": number (0-100),\n'
            '  "overall_summary": string,\n'
            '  "strengths": string[],\n'
            '  "weaknesses": string[],\n'
            '  "missing_keywords": string[],\n'
            '  "feature_highlights": string[],\n'
            '  "rewritten_summary": string,\n'
            '  "improved_bullets": string[],\n'
            '  "next_actions": string[]\n'
            "}\n\n"
            f"Source kind: {source_kind}\n"
            f"Target job description:\n{job_description or 'Not provided'}\n\n"
            "Candidate source:\n"
            f"{source_text[:12000]}\n"
        )

    def _extract_json(self, text: str) -> dict:
        cleaned = (text or "").strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Gemini response did not contain valid JSON object.")
        return json.loads(cleaned[start : end + 1])

    def _normalize_payload(self, payload: dict) -> dict:
        return {
            "ats_score": int(payload.get("ats_score", 65)),
            "overall_summary": str(payload.get("overall_summary", "")),
            "strengths": self._as_str_list(payload.get("strengths", [])),
            "weaknesses": self._as_str_list(payload.get("weaknesses", [])),
            "missing_keywords": self._as_str_list(payload.get("missing_keywords", [])),
            "feature_highlights": self._as_str_list(payload.get("feature_highlights", [])),
            "rewritten_summary": str(payload.get("rewritten_summary", "")),
            "improved_bullets": self._as_str_list(payload.get("improved_bullets", [])),
            "next_actions": self._as_str_list(payload.get("next_actions", [])),
        }

    def _as_str_list(self, value):
        if not isinstance(value, list):
            return []
        return [str(item) for item in value if item is not None][:12]

    def _mock_result(self, source_text: str, job_description: str, source_kind: str) -> dict:
        baseline = 60
        if job_description:
            baseline += 8
        if source_kind == "github":
            baseline += 4

        return {
            "ats_score": min(96, baseline),
            "overall_summary": "Candidate shows practical engineering impact but can improve keyword alignment and clarity.",
            "strengths": [
                "Clear evidence of technical delivery.",
                "Strong potential for backend and platform roles.",
            ],
            "weaknesses": [
                "Profile needs stronger role-specific terminology.",
                "Some achievements should include clearer scope and impact numbers.",
            ],
            "missing_keywords": ["system design", "stakeholder management", "production reliability"],
            "feature_highlights": [
                "Demonstrated measurable improvements in performance.",
                "Hands-on experience with APIs and async workflows.",
            ],
            "rewritten_summary": "Backend-focused engineer with proven delivery in API systems, async pipelines, and performance optimization with measurable outcomes.",
            "improved_bullets": [
                "Built and optimized backend APIs, improving response latency and throughput under production load.",
                "Implemented asynchronous processing workflows for long-running analysis jobs, reducing request timeout risks.",
                "Improved service reliability by adding structured error handling and retry/backoff patterns.",
            ],
            "next_actions": [
                "Add 3-5 role-specific keywords from target job description.",
                "Rewrite top experience bullets with clear action + metric format.",
                "Highlight architecture and system ownership examples.",
            ],
        }


gemini_client = GeminiClient()
