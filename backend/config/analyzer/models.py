
from django.conf import settings
from django.db import models


class Resume(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes"
    )
    filename = models.CharField(max_length=255)
    extracted_text = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at", "-id"]

    def __str__(self):
        return self.filename


class Analysis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="analyses"
    )
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="analyses")
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analyses",
    )
    job_description = models.TextField()
    match_score = models.FloatField()
    similarity_score = models.FloatField()
    skill_score = models.FloatField(null=True, blank=True)
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name_plural = "analyses"

    def __str__(self):
        return f"{self.match_score}% ({self.resume_id})"