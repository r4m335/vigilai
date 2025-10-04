from rest_framework import serializers
from .models import Profile
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed
        token['email'] = user.email
        return token

    def validate(self, attrs):
        # replace username with email
        attrs['username'] = attrs.get('email')
        return super().validate(attrs)


User = get_user_model()

class ProfileSerializer(serializers.ModelSerializer):
    # Nested user fields
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = Profile
        fields = ["first_name", "last_name", "email", "phone", "bio", "profile_photo"]

    def update(self, instance, validated_data):
        """
        Update Profile and nested User fields.
        """
        # Update Profile fields
        instance.phone = validated_data.get("phone", instance.phone)
        instance.bio = validated_data.get("bio", instance.bio)
        if validated_data.get("profile_photo") is not None:
            instance.profile_photo = validated_data["profile_photo"]
        instance.save()

        # Update nested User fields
        user_data = validated_data.get("user", {})
        user = instance.user
        user.first_name = user_data.get("first_name", user.first_name)
        user.last_name = user_data.get("last_name", user.last_name)
        user.email = user_data.get("email", user.email)
        user.save()

        return instance
