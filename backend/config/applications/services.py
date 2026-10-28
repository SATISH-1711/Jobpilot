from datetime import timedelta

from django.utils import timezone

from notifications.utils import notify

from .models import Application, Stage


def create_deadline_reminders(user, days=2):
    today = timezone.localdate()
    due = list(
        Application.objects.filter(
            user=user,
            reminder_sent=False,
            deadline__isnull=False,
            deadline__gte=today,
            deadline__lte=today + timedelta(days=days),
        ).exclude(stage__in=[Stage.OFFER, Stage.REJECTED])
    )
    for app in due:
        if app.deadline == today:
            when = "today"
        elif app.deadline == today + timedelta(days=1):
            when = "tomorrow"
        else:
            when = f"on {app.deadline:%d %b}"
        notify(user, f"Deadline {when}: {app.role} at {app.company}.")

    if due:
        Application.objects.filter(pk__in=[a.pk for a in due]).update(reminder_sent=True)
    return len(due)