from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # ensure TokenObtainPairSerializer uses email as username
    username_field = User.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # put anything you want into the token payload
        token['email'] = user.email
        token['is_superuser'] = user.is_superuser
        token['is_verified'] = user.is_verified
        token['rank'] = getattr(user, 'rank', '')
        return token

    def validate(self, attrs):
        # Map email to username before parent validate
        # client sends {"email": "...", "password": "..."}
        attrs['username'] = attrs.get('email') or attrs.get('username')
        data = super().validate(attrs)

        user = self.user

        # Optional: block login if not verified
        if not user.is_verified:
            raise AuthenticationFailed("Your account is not verified by admin.")

        # Add user info to response payload
        data['user'] = {
            'id': user.pk,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'is_verified': user.is_verified,
            'rank': getattr(user, 'rank', ''),
            'bio': getattr(user, 'bio', ''),
            'profile_photo': user.profile_photo.url if user.profile_photo else None,
        }
        return data




# -----------------------------------------
# 🔹 User Serializer (merged Profile fields)
# -----------------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number', 'jurisdiction',
            'staff_id', 'rank', 'is_verified', 'bio', 'profile_photo','updated_at',
        ]
        read_only_fields = ['id','updated_at', 'is_verified']

    def update(self, instance, validated_data):
        """
        Allows partial updates of user info (including bio/photo)
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'email',
            'password',
            'password2',
            'first_name',
            'last_name',
            'phone_number',
            'jurisdiction',
            'staff_id',
            'rank',
            'is_verified', 
            'date_joined', 
            'last_login'
        )

    def validate(self, attrs):
        # basic password match check
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # optional: staff_id uniqueness
        staff = attrs.get('staff_id')
        if staff and CustomUser.objects.filter(staff_id=staff).exists():
            raise serializers.ValidationError({"staff_id": "This staff ID is already registered."})
        
        # email uniqueness check
        email = attrs.get('email')
        if email and CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})
            
        return attrs

    def create(self, validated_data):
        # Debug: print validated_data to console - remove in production
        print("DEBUG RegisterSerializer.create validated_data:", validated_data)

        # Pop password fields
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None)

        # Extract email and convert to lowercase
        email = validated_data.get('email', '').lower()
        
        # Explicitly extract fields (safe even if some are missing)
        first_name = validated_data.get('first_name', '') or ''
        last_name = validated_data.get('last_name', '') or ''
        phone_number = validated_data.get('phone_number', '') or ''
        jurisdiction = validated_data.get('jurisdiction', '') or ''
        staff_id = validated_data.get('staff_id', '') or None
        rank = validated_data.get('rank', '') or ''

        # Create user using create_user method for proper password handling
        user = CustomUser.objects.create_user(
            username=email,  # Set username same as email
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            jurisdiction=jurisdiction,
            staff_id=staff_id,
            rank=rank,
            is_verified=False,   # ensure default
            is_active=True
        )

        # Debug: print saved object primary key and fields
        print("DEBUG RegisterSerializer.create saved user id:", user.pk, "email:", user.email,
              "phone_number:", user.phone_number, "staff_id:", user.staff_id)

        return user

# Alternative simplified registration serializer
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["email", "password", "password2", "first_name", "last_name", "phone_number", "staff_id", "jurisdiction", "rank"]
        extra_kwargs = {
            "email": {"required": True},
            "password": {"write_only": True},
            "password2": {"write_only": True},
        }

    def validate(self, attrs):
        # Password match check
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})

        # Email uniqueness check
        email = attrs.get('email', '').lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        # Staff ID uniqueness check
        staff_id = attrs.get('staff_id')
        if staff_id and User.objects.filter(staff_id=staff_id).exists():
            raise serializers.ValidationError({"staff_id": "This staff ID is already registered."})

        return attrs

    def create(self, validated_data):
        # Pop password fields
        password = validated_data.pop('password')
        validated_data.pop('password2')
        
        # Extract and clean email
        email = validated_data.pop('email', '').lower()
        
        # Create user using create_user method
        user = User.objects.create_user(
            username=email,  # Set username same as email
            email=email,
            password=password,
            **validated_data,
            is_verified=False,
            is_active=True
        )
        return user

    def validate_email(self, value):
        return value.lower()