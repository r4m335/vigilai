from django.shortcuts import render
from rest_framework import viewsets
from .models import Case, Evidence, Witness, CriminalRecord
from .serializers import CaseSerializer, EvidenceSerializer, WitnessSerializer, CriminalRecordSerializer

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer

class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer

class WitnessViewSet(viewsets.ModelViewSet):
    queryset = Witness.objects.all()
    serializer_class = WitnessSerializer

class CriminalRecordViewSet(viewsets.ModelViewSet):
    queryset = CriminalRecord.objects.all()
    serializer_class = CriminalRecordSerializer


# Create your views here.
