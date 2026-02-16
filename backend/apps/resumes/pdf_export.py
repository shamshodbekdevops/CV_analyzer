import io
from typing import Iterable

from django.utils.text import slugify
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer


def build_resume_pdf_bytes(resume) -> bytes:
    content = resume.content or {}
    analysis = resume.latest_analysis or {}

    full_name = _pick_first(
        content.get("full_name"),
        content.get("name"),
        resume.owner.get_full_name(),
        resume.owner.username,
    )
    headline = _pick_first(content.get("headline"), content.get("target_role"), "")

    contact_line = _build_contact_line(content.get("contact"))
    summary = _stringify_block(content.get("summary"))
    skills = _as_list(content.get("skills"))
    experience_items = _normalize_items(content.get("experience"))
    education_items = _normalize_items(content.get("education"))
    projects_items = _normalize_items(content.get("projects"))
    improved_bullets = _as_list(analysis.get("improved_bullets"))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=30,
        bottomMargin=30,
        title=resume.title,
    )

    base_styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ResumeTitle",
        parent=base_styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "ResumeSubtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4B5563"),
    )
    section_style = ParagraphStyle(
        "ResumeSection",
        parent=base_styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "ResumeBody",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#111827"),
    )
    bullet_style = ParagraphStyle(
        "ResumeBullet",
        parent=body_style,
        leftIndent=12,
        bulletIndent=2,
        spaceAfter=4,
    )

    story = []
    story.append(Paragraph(_escape(full_name), title_style))
    if headline:
        story.append(Paragraph(_escape(headline), subtitle_style))
    if contact_line:
        story.append(Paragraph(_escape(contact_line), subtitle_style))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#D1D5DB")))

    if summary:
        _append_section(story, "Professional Summary", summary, section_style, body_style)

    if skills:
        _append_section(
            story,
            "Core Skills",
            ", ".join(_escape(item) for item in skills),
            section_style,
            body_style,
        )

    if experience_items:
        story.append(Paragraph("Experience", section_style))
        for item in experience_items:
            story.append(Paragraph(_escape(item), bullet_style, bulletText="-"))

    if projects_items:
        story.append(Paragraph("Projects", section_style))
        for item in projects_items:
            story.append(Paragraph(_escape(item), bullet_style, bulletText="-"))

    if education_items:
        story.append(Paragraph("Education", section_style))
        for item in education_items:
            story.append(Paragraph(_escape(item), bullet_style, bulletText="-"))

    if improved_bullets:
        story.append(Paragraph("AI Suggested Impact Bullets", section_style))
        for item in improved_bullets[:6]:
            story.append(Paragraph(_escape(item), bullet_style, bulletText="-"))

    doc.build(story)
    return buffer.getvalue()


def build_export_filename(title: str) -> str:
    safe = slugify(title or "resume")
    if not safe:
        safe = "resume"
    return f"{safe}.pdf"


def _append_section(story, title: str, content: str, section_style, body_style):
    story.append(Paragraph(title, section_style))
    story.append(Paragraph(_escape(content), body_style))


def _pick_first(*values):
    for value in values:
        text = str(value or "").strip()
        if text:
            return text
    return ""


def _escape(value: str) -> str:
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>")
    )


def _as_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    return []


def _stringify_block(value) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return "\n".join(str(item) for item in value if str(item).strip())
    if isinstance(value, dict):
        return "\n".join(f"{k}: {v}" for k, v in value.items() if str(v).strip())
    return ""


def _normalize_items(value) -> Iterable[str]:
    if isinstance(value, list):
        normalized = []
        for item in value:
            if isinstance(item, dict):
                title = _pick_first(item.get("title"), item.get("role"), item.get("company"), "")
                details = _pick_first(item.get("description"), item.get("details"), item.get("impact"), "")
                merged = " - ".join(part for part in [title, details] if part)
                if merged:
                    normalized.append(merged)
            else:
                text = str(item).strip()
                if text:
                    normalized.append(text)
        return normalized
    if isinstance(value, str):
        return [line.strip("- ").strip() for line in value.splitlines() if line.strip()]
    return []
