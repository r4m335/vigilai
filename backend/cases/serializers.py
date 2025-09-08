from rest_framework import serializers
from .models import Case, Evidence, Witness, CriminalRecord
from django.contrib.auth.models import User

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # use create_user to hash the password
        user = User.objects.create_user(**validated_data)
        return user

class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = '__all__'

class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = '__all__'

        def create(self, validated_data):
        # Make sure to handle file or additional logic if needed
            return Evidence.objects.create(**validated_data)

class WitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Witness
        fields = '__all__'

class CriminalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriminalRecord
        fields = '__all__'
