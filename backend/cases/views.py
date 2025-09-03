from django.shortcuts import render
from rest_framework import viewsets
from .models import Case, Evidence, Witness, CriminalRecord
from .serializers import CaseSerializer, EvidenceSerializer, WitnessSerializer, CriminalRecordSerializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .permissions import IsOwnerOrReadOnly
from .serializers import CaseSerializer
from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import UserRegisterSerializer
from rest_framework import permissions
from .permissions import (
    IsInvestigator,
    IsProsecutorReadOnly,
    IsClerkForEvidenceOnly,
    IsCitizenRestricted,
    IsChiefReadOnly,
)



class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly, IsInvestigator | IsChiefReadOnly | IsProsecutorReadOnly | IsCitizenRestricted
    ]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    permission_classes = [
        IsInvestigator | IsClerkForEvidenceOnly | IsChiefReadOnly
    ]

class WitnessViewSet(viewsets.ModelViewSet):
    queryset = Witness.objects.all()
    serializer_class = WitnessSerializer

class CriminalRecordViewSet(viewsets.ModelViewSet):
    queryset = CriminalRecord.objects.all()
    serializer_class = CriminalRecordSerializer

class PublicEndpoint(APIView):
    permission_classes = [AllowAny]


    



# Create your views here.
