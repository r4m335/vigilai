from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from chat.models import Message

@receiver(post_save, sender=Message)
def clean_old_messages(sender, **kwargs):
    Message.objects.filter(expires_at__lte=timezone.now()).delete()
