from django.db import models
from django.conf import settings
from django.utils import timezone
from cases.models import Case
from datetime import timedelta

class ChatRoom(models.Model):
    """
    A room represents a conversation. Either:
      - global room
      - case-specific room
      - group room (if needed)
    """
    room_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name


class Message(models.Model):
    message_id = models.AutoField(primary_key=True)
    room = models.ForeignKey(ChatRoom, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    mentioned_case = models.ForeignKey(Case, null=True, blank=True, on_delete=models.SET_NULL)
    mentioned_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                       on_delete=models.SET_NULL, related_name="mentions")

    def __str__(self):
        return f"{self.sender} → {self.text[:30]}"
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)  # TTL = 7 days
        super().save(*args, **kwargs)


class Notification(models.Model):
    TYPE_CHOICES = (
        ('mention', 'Mention'),
        ('message', 'Message'),
    )
    notification_id = models.AutoField(primary_key=True)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField(null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='message')

    # Optional links
    room = models.ForeignKey(ChatRoom, null=True, blank=True, on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                               on_delete=models.SET_NULL, related_name='sent_notifications')

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification to {self.user.email}"