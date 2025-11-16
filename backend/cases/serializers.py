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


# -------------------------------
# Criminal Record Serializer (FIXED)
# -------------------------------
class CriminalRecordSerializer(serializers.ModelSerializer):
    # Make suspect writable with PrimaryKeyRelatedField
    suspect = serializers.PrimaryKeyRelatedField(
        queryset=Criminal.objects.all(),
        required=True  # This field is required
    )
    
    # Optional: Include criminal details for read operations
    suspect_details = CriminalSerializer(source='suspect', read_only=True)

    class Meta:
        model = CriminalRecord
        fields = [
            'record_id', 'case', 'suspect', 'offenses', 'suspect_details', 'created_at'
        ]
        read_only_fields = ['record_id', 'created_at', 'suspect_details']

    def validate(self, data):
        """
        Ensure we have either suspect ID or criminal creation data
        """
        if not data.get('suspect'):
            raise serializers.ValidationError({
                "suspect": "Suspect (criminal ID) is required."
            })
        
        return data

    def create(self, validated_data):
        """
        Create criminal record - suspect must be provided as Criminal ID
        """
        return CriminalRecord.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update criminal record
        """
        instance.offenses = validated_data.get('offenses', instance.offenses)
        
        # Only update suspect if provided
        if 'suspect' in validated_data:
            instance.suspect = validated_data['suspect']
        
        instance.save()
        return instance

# -------------------------------
# Criminal Record Create Serializer (Alternative for inline creation)
# -------------------------------
class CriminalRecordCreateSerializer(serializers.ModelSerializer):
    """
    Alternative serializer that allows creating criminal + record in one request
    """
    # Criminal creation fields
    criminal_name = serializers.CharField(write_only=True, required=True)
    criminal_age = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    criminal_gender = serializers.CharField(write_only=True, required=False, allow_null=True)
    criminal_district = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    aadhaar_number = serializers.CharField(write_only=True, required=False, allow_null=True)
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = CriminalRecord
        fields = [
            'record_id', 'case', 'offenses', 'created_at',
            'criminal_name', 'criminal_age', 'criminal_gender',
            'criminal_district', 'aadhaar_number', 'photo'
        ]
        read_only_fields = ['record_id', 'created_at']

    def create(self, validated_data):
        # Extract criminal data
        criminal_data = {
            'criminal_name': validated_data.pop('criminal_name'),
            'criminal_age': validated_data.pop('criminal_age', None),
            'criminal_gender': validated_data.pop('criminal_gender', None),
            'criminal_district': validated_data.pop('criminal_district', None),
            'aadhaar_number': validated_data.pop('aadhaar_number', None),
            'photo': validated_data.pop('photo', None),
        }

        # Create criminal first
        criminal = Criminal.objects.create(**criminal_data)
        
        # Create criminal record
        validated_data['suspect'] = criminal
        return CriminalRecord.objects.create(**validated_data)


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