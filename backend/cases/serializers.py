from rest_framework import serializers
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()




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

    def validate_district(self, value):
        if not (1 <= value <= 14):
            raise serializers.ValidationError("District must be between 1 and 14.")
        return value