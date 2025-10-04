# accounts/signals.py
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.conf import settings
from .models import Profile

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a Profile for new users and ensure it is saved
    whenever the User instance is created or updated.
    """
    if created:
        # Create a new profile if this is a new user
        Profile.objects.create(user=instance)
    else:
        # Ensure a profile exists and save it
        Profile.objects.get_or_create(user=instance)
        instance.profile.save()
