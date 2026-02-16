from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from apps.analysis.serializers import AnalyzeCreateSerializer


class AnalyzeCreateSerializerTests(SimpleTestCase):
    def test_cv_source_requires_file(self):
        serializer = AnalyzeCreateSerializer(data={"source_type": "cv"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("file", serializer.errors)

    def test_github_source_requires_url(self):
        serializer = AnalyzeCreateSerializer(data={"source_type": "github"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("github_url", serializer.errors)

    def test_cv_source_valid_with_file(self):
        upload = SimpleUploadedFile("resume.txt", b"example resume")
        serializer = AnalyzeCreateSerializer(data={"source_type": "cv", "file": upload})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_github_source_valid_with_url(self):
        serializer = AnalyzeCreateSerializer(
            data={
                "source_type": "github",
                "github_url": "https://github.com/vercel/next.js",
                "job_description": "Need Next.js engineer",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
