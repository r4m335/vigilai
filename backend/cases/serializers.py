from rest_framework import serializers
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction, Criminal
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


# --- Criminal Serializer ---
class CriminalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criminal
        fields = '__all__'
        read_only_fields = ['criminal_id', 'created_at']


# --- Enhanced Criminal Record Serializer ---
class CriminalRecordSerializer(serializers.ModelSerializer):
    suspect = CriminalSerializer(read_only=True)
    aadhaar_number = serializers.CharField(write_only=True)

    class Meta:
        model = CriminalRecord
        fields = [
            'record_id', 'case', 'suspect', 'aadhaar_number',
            'offenses', 'created_at'
        ]
        read_only_fields = ['record_id', 'created_at', 'suspect']

    def create(self, validated_data):
        aadhaar = validated_data.pop('aadhaar_number', None)

        suspect, created = Criminal.objects.get_or_create(
            aadhaar_number=aadhaar,
            defaults={
                'person_name': self.initial_data.get('person_name'),
                'age': self.initial_data.get('age'),
                'gender': self.initial_data.get('gender'),
                'district': self.initial_data.get('district'),
                'photo': self.initial_data.get('photo')
            }
        )

        validated_data['suspect'] = suspect
        record = CriminalRecord.objects.create(**validated_data)
        return record

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