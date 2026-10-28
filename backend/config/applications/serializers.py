from rest_framework import serializers

from .models import Application, StatusHistory


class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistory
        fields = ("from_stage", "to_stage", "changed_at")
        read_only_fields = fields


class ApplicationSerializer(serializers.ModelSerializer):
    history = StatusHistorySerializer(many=True, read_only=True)
    stage_display = serializers.CharField(source="get_stage_display", read_only=True)

    class Meta:
        model = Application
        fields = (
            "id",
            "company",
            "role",
            "job_url",
            "location",
            "salary",
            "stage",
            "stage_display",
            "job_description",
            "notes",
            "deadline",
            "applied_date",
            "position",
            "history",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "history", "created_at", "updated_at")