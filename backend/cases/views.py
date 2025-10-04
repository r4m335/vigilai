from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction
from .serializers import (
    CaseSerializer,
    EvidenceSerializer,
    WitnessSerializer,
    CriminalRecordSerializer,
    SuspectPredictionSerializer,
    UserRegisterSerializer
)
from .permissions import IsOwnerOrReadOnly
from django.http import JsonResponse
from .ml_utils import predict_suspects
import json

def predict_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        predictions = predict_suspects(data)
        return JsonResponse(predictions, safe=False)
    else:
        return JsonResponse({"error": "POST request required."}, status=400)



User = get_user_model()




class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


# -------------------------------
# User Registration
# -------------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


# -------------------------------
# Case ViewSet
# -------------------------------
class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    queryset = Case.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = Case.objects.all()
        worked_by_me = self.request.query_params.get('worked_by_me')
        if worked_by_me == 'true':
            queryset = queryset.filter(investigator=self.request.user)
        return queryset


# -------------------------------
# Evidence ViewSet
# -------------------------------
class EvidenceViewSet(viewsets.ModelViewSet):
    serializer_class = EvidenceSerializer
    queryset = Evidence.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        evidence = Evidence.objects.filter(case_id=case_id)
        serializer = self.get_serializer(evidence, many=True)
        return Response(serializer.data)


# -------------------------------
# Witness ViewSet
# -------------------------------
class WitnessViewSet(viewsets.ModelViewSet):
    serializer_class = WitnessSerializer
    queryset = Witness.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        witnesses = Witness.objects.filter(case_id=case_id)
        serializer = self.get_serializer(witnesses, many=True)
        return Response(serializer.data)


# -------------------------------
# Criminal Record ViewSet
# -------------------------------
class CriminalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalRecordSerializer
    queryset = CriminalRecord.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    @action(detail=False, methods=['get'])
    def by_case(self, request):
        case_id = request.query_params.get('case')
        if not case_id:
            raise ValidationError({"case": "This query parameter is required"})
        records = CriminalRecord.objects.filter(case_id=case_id)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)


# -------------------------------
# Suspect Prediction ViewSet (ML Predictions)
# -------------------------------
class SuspectPredictionViewSet(viewsets.ModelViewSet):
    serializer_class = SuspectPredictionSerializer
    queryset = SuspectPrediction.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset


# -------------------------------
# Public Test Endpoint
# -------------------------------
class PublicEndpoint(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "This is a public endpoint"})
