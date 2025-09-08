# accounts/serializers.py

from rest_framework import serializers
from .models import Profile
from django.contrib.auth import get_user_model

User = get_user_model()

class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = Profile
        fields = ["first_name", "last_name", "email", "phone", "bio", "profile_photo"]

    def update(self, instance, validated_data):
        # Update profile data
        instance.phone = validated_data.get("phone", instance.phone)
        instance.bio = validated_data.get("bio", instance.bio)
        if validated_data.get("profile_photo") is not None:
            instance.profile_photo = validated_data["profile_photo"]
        instance.save()

        # Update the related User model
        user_data = validated_data.get('user', {})
        user = instance.user
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.email = user_data.get('email', user.email)
        user.save()

        return instance
