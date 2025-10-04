from rest_framework import serializers
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD  # use email for authentication

    def validate(self, attrs):
        # map email -> username internally
        attrs["username"] = attrs.get("email")
        return super().validate(attrs)
# -------------------------------
# User Registration Serializer
# -------------------------------
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password"]  
        extra_kwargs = {
            "email": {"required": True},
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        email = validated_data["email"].lower()
        password = validated_data["password"]

        # use email as username
        user = User.objects.create_user(
            username=email,  
            email=email,
            password=password
        )
        return user
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()


# -------------------------------
# Evidence Serializer
# -------------------------------
class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = '__all__'

    def create(self, validated_data):
        # Handle file or additional logic if needed
        return Evidence.objects.create(**validated_data)


# -------------------------------
# Witness Serializer
# -------------------------------
class WitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Witness
        fields = '__all__'


# -------------------------------
# Criminal Record Serializer
# -------------------------------
class CriminalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalRecord
        fields = '__all__'


# -------------------------------
# Suspect Prediction Serializer
# -------------------------------
class SuspectPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuspectPrediction
        fields = '__all__'


# -------------------------------
# Nested Case Serializer (Optional)
# -------------------------------
class CaseSerializer(serializers.ModelSerializer):
    evidences = EvidenceSerializer(many=True, read_only=True)
    witnesses = WitnessSerializer(many=True, read_only=True)
    criminal_records = CriminalRecordSerializer(many=True, read_only=True)
    predictions = SuspectPredictionSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = '__all__'
