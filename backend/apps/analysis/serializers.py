from rest_framework import serializers

from apps.analysis.models import AnalyzeJob


class AnalyzeCreateSerializer(serializers.Serializer):
    source_type = serializers.ChoiceField(choices=AnalyzeJob.SourceType.choices, default=AnalyzeJob.SourceType.CV)
    file = serializers.FileField(required=False)
    github_url = serializers.URLField(required=False, allow_blank=True)
    job_description = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        source_type = attrs.get("source_type", AnalyzeJob.SourceType.CV)
        file_obj = attrs.get("file")
        github_url = attrs.get("github_url", "").strip()

        if source_type == AnalyzeJob.SourceType.CV:
            if not file_obj:
                raise serializers.ValidationError({"file": "File is required when source_type is 'cv'."})
        elif source_type == AnalyzeJob.SourceType.GITHUB:
            if not github_url:
                raise serializers.ValidationError({"github_url": "GitHub URL is required when source_type is 'github'."})

        return attrs


class AnalyzeJobStatusSerializer(serializers.ModelSerializer):
    result = serializers.JSONField(required=False)

    class Meta:
        model = AnalyzeJob
        fields = (
            "id",
            "source_type",
            "source_input",
            "status",
            "error_message",
            "created_at",
            "updated_at",
            "result",
        )
