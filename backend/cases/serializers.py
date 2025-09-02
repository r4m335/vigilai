from rest_framework import serializers
from .models import Case, Evidence, Witness, CriminalRecord

class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = '__all__'

class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = '__all__'

class WitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Witness
        fields = '__all__'

class CriminalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalRecord
        fields = '__all__'
