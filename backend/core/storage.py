from dataclasses import dataclass
from pathlib import Path
import uuid

from django.conf import settings


@dataclass
class StoredFile:
    key: str
    path: str


class LocalStorageService:
    """MVP local storage abstraction. Can be replaced with S3/R2 service."""

    def save_temp_upload(self, upload_file) -> StoredFile:
        file_key = f"tmp/{uuid.uuid4()}_{upload_file.name}"
        file_path = Path(settings.MEDIA_ROOT) / file_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with file_path.open("wb+") as dst:
            for chunk in upload_file.chunks():
                dst.write(chunk)
        return StoredFile(key=file_key, path=str(file_path))


storage_service = LocalStorageService()
