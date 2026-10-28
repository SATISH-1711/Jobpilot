from rest_framework import serializers

from applications.models import Application

from .models import Analysis, Resume


class ResumeSerializer(serializers.ModelSerializer):
    char_count = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ("id", "filename", "char_count", "uploaded_at")
        read_only_fields = fields

    def get_char_count(self, obj):
        return len(obj.extracted_text)


class AnalysisSerializer(serializers.ModelSerializer):
    resume_filename = serializers.CharField(source="resume.filename", read_only=True)

    class Meta:
        model = Analysis
        fields = (
            "id",
            "resume",
            "resume_filename",
            "application",
            "match_score",
            "similarity_score",
            "skill_score",
            "matched_skills",
            "missing_skills",
            "created_at",
        )
        read_only_fields = fields


class AnalyzeRequestSerializer(serializers.Serializer):
    resume = serializers.IntegerField()
    application = serializers.IntegerField(required=False)
    job_description = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        user = self.context["request"].user

        try:
            resume = Resume.objects.get(pk=attrs["resume"], user=user)
        except Resume.DoesNotExist:
            raise serializers.ValidationError({"resume": "Resume not found."})

        application = None
        if attrs.get("application") is not None:
            try:
                application = Application.objects.get(pk=attrs["application"], user=user)
            except Application.DoesNotExist:
                raise serializers.ValidationError({"application": "Application not found."})

        job_description = (attrs.get("job_description") or "").strip()
        if not job_description and application:
            job_description = application.job_description.strip()
        if len(job_description) < 30:
            raise serializers.ValidationError(
                {
                    "job_description": "Provide a job description of at least 30 characters, "
                    "either in the request or saved on the application."
                }
            )

        return {"resume": resume, "application": application, "job_description": job_description}