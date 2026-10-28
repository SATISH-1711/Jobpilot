from .models import Notification


def notify(user, message):
    return Notification.objects.create(user=user, message=message[:255])