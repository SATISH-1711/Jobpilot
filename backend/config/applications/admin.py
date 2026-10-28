#from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import Application, StatusHistory


class StatusHistoryInline(admin.TabularInline):
    model = StatusHistory
    extra = 0
    readonly_fields = ("from_stage", "to_stage", "changed_at")
    can_delete = False


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("company", "role", "user", "stage", "deadline", "created_at")
    list_filter = ("stage",)
    search_fields = ("company", "role", "user__username")
    inlines = [StatusHistoryInline]