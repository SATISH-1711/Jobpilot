
# Create your models here.
from django.conf import settings
from django.db import models


class Stage(models.TextChoices):
    WISHLIST = "wishlist", "Wishlist"
    APPLIED = "applied", "Applied"
    INTERVIEW = "interview", "Interview"
    OFFER = "offer", "Offer"
    REJECTED = "rejected", "Rejected"


class Application(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications"
    )
    company = models.CharField(max_length=120)
    role = models.CharField(max_length=120)
    job_url = models.URLField(max_length=500, blank=True)
    location = models.CharField(max_length=120, blank=True)
    salary = models.CharField(max_length=60, blank=True)
    stage = models.CharField(
        max_length=20, choices=Stage.choices, default=Stage.WISHLIST, db_index=True
    )
    job_description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    applied_date = models.DateField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "-created_at"]
        indexes = [models.Index(fields=["user", "stage"])]

    def __str__(self):
        return f"{self.role} @ {self.company}"


class StatusHistory(models.Model):
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="history"
    )
    from_stage = models.CharField(max_length=20, blank=True)
    to_stage = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at", "id"]
        verbose_name_plural = "status history"

    def __str__(self):
        return f"{self.application_id}: {self.from_stage or '-'} -> {self.to_stage}"