from rest_framework import serializers
from .models import Case, Evidence, Witness, CriminalRecord, Criminal
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
        read_only_fields = ['evidence_id', 'created_at']

    def create(self, validated_data):
        return Evidence.objects.create(**validated_data)


# -------------------------------
# Witness Serializer
# -------------------------------
class WitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Witness
        fields = '__all__'
        read_only_fields = ['witness_id', 'created_at']

    def validate_aadhaar_number(self, value):
        if len(value) != 12:
            raise serializers.ValidationError("Aadhaar number must be 12 digits")
        if not value.isdigit():
            raise serializers.ValidationError("Aadhaar number must contain only digits")
        return value


# -------------------------------
# Criminal Serializer
# -------------------------------
class CriminalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criminal
        fields = '__all__'
        read_only_fields = ['criminal_id', 'created_at']

    def validate_aadhaar_number(self, value):
        if len(value) != 12:
            raise serializers.ValidationError("Aadhaar number must be 12 digits")
        if not value.isdigit():
            raise serializers.ValidationError("Aadhaar number must contain only digits")
        return value

    def validate_criminal_district(self, value):
        if not (1 <= value <= 14):
            raise serializers.ValidationError("District must be between 1 and 14.")
        return value

    


# -------------------------------
# Criminal Record Serializer
# -------------------------------
class CriminalRecordSerializer(serializers.ModelSerializer):
    suspect = serializers.PrimaryKeyRelatedField(
        queryset=Criminal.objects.all(),
        required=True
    )
    
    suspect_details = CriminalSerializer(source='suspect', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)

    class Meta:
        model = CriminalRecord
        fields = [
            'record_id', 'case', 'case_number', 'suspect', 'suspect_details', 
            'offenses', 'created_at'
        ]
        read_only_fields = ['record_id', 'created_at']

    def validate(self, data):
        if not data.get('suspect'):
            raise serializers.ValidationError({
                "suspect": "Suspect (criminal ID) is required."
            })
        return data

    def create(self, validated_data):
        return CriminalRecord.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.offenses = validated_data.get('offenses', instance.offenses)
        
        if 'suspect' in validated_data:
            instance.suspect = validated_data['suspect']
        
        instance.save()
        return instance


# -------------------------------
# Criminal Record Create Serializer
# -------------------------------
class CriminalRecordCreateSerializer(serializers.ModelSerializer):
    criminal_name = serializers.CharField(write_only=True, required=True)
    criminal_gender = serializers.CharField(write_only=True, required=False, allow_null=True)
    date_of_birth = serializers.DateField(write_only=True, required=False, allow_null=True)
    criminal_district = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    aadhaar_number = serializers.CharField(write_only=True, required=False, allow_null=True)
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = CriminalRecord
        fields = [
            'record_id', 'case', 'offenses', 'created_at',
            'criminal_name', 'criminal_gender', 'date_of_birth',
            'criminal_district', 'aadhaar_number', 'photo'
        ]
        read_only_fields = ['record_id', 'created_at']

    def create(self, validated_data):
        criminal_data = {
            'criminal_name': validated_data.pop('criminal_name'),
            'criminal_gender': validated_data.pop('criminal_gender', None),
            'criminal_district': validated_data.pop('criminal_district', None),
            'aadhaar_number': validated_data.pop('aadhaar_number', None),
            'photo': validated_data.pop('photo', None),
        }

        criminal = Criminal.objects.create(**criminal_data)
        validated_data['suspect'] = criminal
        return CriminalRecord.objects.create(**validated_data)


# -------------------------------
# Case Serializer
# -------------------------------
class CaseSerializer(serializers.ModelSerializer):
    # For backward compatibility
    arrest_status = serializers.ChoiceField(
        choices=[('Not Arrested','Not Arrested'), ('Arrested','Arrested')],
        required=False
    )
    case_status = serializers.CharField(source='status', required=False)
    
    # Nested serializers for related objects
    evidences = EvidenceSerializer(many=True, read_only=True)
    witnesses = WitnessSerializer(many=True, read_only=True)
    criminal_records = CriminalRecordSerializer(many=True, read_only=True)
    
    # User details
    investigator_name = serializers.CharField(source='investigator.get_full_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Case
        fields = [
            'case_id', 'case_number', 'primary_type', 'description',
            'date_time', 'district', 'ward', 'arrest_status', 'local_governance',
            'governance_name', 'location_description', 'status',
            'investigator', 'investigator_name', 'owner', 'owner_name',
            'created_at', 'updated_at', 'arrested',
            # Nested fields
            'evidences', 'witnesses', 'criminal_records',
            # Backward compatibility
            'case_status'
        ]
        read_only_fields = ['case_id', 'created_at', 'updated_at']


    def validate_district(self, value):
        if not (1 <= value <= 14):
            raise serializers.ValidationError("District must be between 1 and 14.")
        return value

    def validate_ward(self, value):
        if value < 1:
            raise serializers.ValidationError("Ward must be a positive number.")
        return value

    def create(self, validated_data):
        # Handle status field if sent as case_status
        if 'status' in validated_data:
            validated_data['status'] = validated_data['status']
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle status field if sent as case_status
        if 'status' in validated_data:
            validated_data['status'] = validated_data['status']
        return super().update(instance, validated_data)


# -------------------------------
# Case List Serializer (Lightweight)
# -------------------------------
class CaseListSerializer(serializers.ModelSerializer):
    evidence_count = serializers.SerializerMethodField()
    witness_count = serializers.SerializerMethodField()
    criminal_count = serializers.SerializerMethodField()
    investigator_name = serializers.CharField(source='investigator.get_full_name', read_only=True)

    class Meta:
        model = Case
        fields = [
            'case_id', 'case_number', 'primary_type', 'status',
            'district', 'ward', 'date_time', 'investigator_name',
            'evidence_count', 'witness_count', 'criminal_count',
            'created_at'
        ]
        read_only_fields = fields

    def get_evidence_count(self, obj):
        return obj.evidences.count()

    def get_witness_count(self, obj):
        return obj.witnesses.count()

    def get_criminal_count(self, obj):
        return obj.criminal_records.count()


# -------------------------------
# Case Create/Update Serializer
# -------------------------------
class CaseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = [
            'case_number', 'primary_type', 'description', 'date_time',
            'district', 'ward', 'arrest_status', 'local_governance',
            'governance_name', 'location_description', 'status',
            'investigator', 'owner'
        ]

    def validate_district(self, value):
        if not (1 <= value <= 14):
            raise serializers.ValidationError("District must be between 1 and 14.")
        return value

    def validate_ward(self, value):
        if value < 1:
            raise serializers.ValidationError("Ward must be a positive number.")
        return value

    def validate_case_number(self, value):
        # Skip uniqueness check during update
        if self.instance and self.instance.case_number == value:
            return value
        if Case.objects.filter(case_number=value).exists():
            raise serializers.ValidationError("Case number must be unique.")
        return value


# -------------------------------
# Custom Token Serializer
# -------------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff

        return token