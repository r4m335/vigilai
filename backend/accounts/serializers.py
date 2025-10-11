from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Profile, CustomUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        return token

    def validate(self, attrs):
        attrs['username'] = attrs.get('email')
        data = super().validate(attrs)

        user = self.user

        if not user.is_verified:
            raise serializers.ValidationError("Your account has not been verified by the admin yet.")

        if not user.is_active:
            raise serializers.ValidationError("Your account is inactive. Contact the administrator.")

        return data



class ProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    phone_number = serializers.CharField(source='user.phone_number', required=False)

    class Meta:
        model = Profile
        fields = ["first_name", "last_name", "email", "phone_number", "bio", "profile_photo"]

    def update(self, instance, validated_data):
        # Extract and handle user-related fields separately
        user_data = validated_data.pop('user', {})

        # ✅ Update the User model fields (this includes phone_number)
        user = instance.user
        if user_data:
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save(update_fields=user_data.keys())

        # ✅ Update the Profile fields (bio, profile_photo)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance




class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'phone_number', 'jurisdiction', 'staff_id', 'rank')
        extra_fields = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': True},
            'jurisdiction': {'required': True},
            'staff_id': {'required': True},
            'rank': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if staff_id already exists
        if CustomUser.objects.filter(staff_id=attrs.get('staff_id')).exists():
            raise serializers.ValidationError({"staff_id": "This staff ID is already registered."})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user