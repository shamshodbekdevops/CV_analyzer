from rest_framework import serializers

from apps.analysis.models import AnalyzeJob


class AnalyzeCreateSerializer(serializers.Serializer):
    file = serializers.FileField()
    job_description = serializers.CharField(required=False, allow_blank=True)


class AnalyzeJobStatusSerializer(serializers.ModelSerializer):
    result = serializers.JSONField(required=False)

    class Meta:
        model = AnalyzeJob
        fields = ("id", "status", "error_message", "created_at", "updated_at", "result")
