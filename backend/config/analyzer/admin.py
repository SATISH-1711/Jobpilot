
from django.contrib import admin

from .models import Analysis, Resume


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("filename", "user", "uploaded_at")


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ("user", "resume", "application", "match_score", "created_at")