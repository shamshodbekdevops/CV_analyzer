from pathlib import Path


def extract_text_from_file(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix in {".txt", ".md", ".csv"}:
        return path.read_text(encoding="utf-8", errors="ignore")

    # MVP fallback: binary files are decoded best-effort.
    return path.read_bytes().decode("utf-8", errors="ignore")[:12000]
