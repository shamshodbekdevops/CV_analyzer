from pathlib import Path

MAX_ANALYSIS_TEXT_CHARS = 12000


def _decode_content(raw_bytes: bytes) -> str:
    return raw_bytes.decode("utf-8", errors="ignore")[:MAX_ANALYSIS_TEXT_CHARS]


def extract_text_from_upload(upload_file) -> str:
    suffix = Path(getattr(upload_file, "name", "")).suffix.lower()
    raw_bytes = upload_file.read()
    upload_file.seek(0)

    if suffix in {".txt", ".md", ".csv"}:
        return raw_bytes.decode("utf-8", errors="ignore")[:MAX_ANALYSIS_TEXT_CHARS]

    # MVP fallback: binary files are decoded best-effort.
    return _decode_content(raw_bytes)


def extract_text_from_file(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in {".txt", ".md", ".csv"}:
        return path.read_text(encoding="utf-8", errors="ignore")[:MAX_ANALYSIS_TEXT_CHARS]

    # MVP fallback: binary files are decoded best-effort.
    return _decode_content(path.read_bytes())
