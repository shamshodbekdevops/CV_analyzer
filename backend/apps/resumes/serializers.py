from rest_framework import serializers

from apps.resumes.models import Resume, ResumeVersion


class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = ("id", "content", "analysis_snapshot", "created_at")


class ResumeSerializer(serializers.ModelSerializer):
    versions = ResumeVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Resume
        fields = (
            "id",
            "title",
            "content",
            "latest_analysis",
            "created_at",
            "updated_at",
            "versions",
        )
