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
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import Http404


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    queryset = Case.objects.all()
    
    def get_queryset(self):
        queryset = Case.objects.all()
        if self.request.query_params.get('worked_by_me') == 'true':
            queryset = queryset.filter(investigator=self.request.user)
        return queryset


class EvidenceViewSet(viewsets.ModelViewSet):
    serializer_class = EvidenceSerializer
    queryset = Evidence.objects.all()

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
            return Response({"error": "case parameter is required"}, status=400)
        
        evidence = Evidence.objects.filter(case_id=case_id)
        serializer = self.get_serializer(evidence, many=True)
        return Response(serializer.data)


class WitnessViewSet(viewsets.ModelViewSet):
    serializer_class = WitnessSerializer
    queryset = Witness.objects.all()

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
            return Response({"error": "case parameter is required"}, status=400)
        
        witnesses = Witness.objects.filter(case_id=case_id)
        serializer = self.get_serializer(witnesses, many=True)
        return Response(serializer.data)


class CriminalRecordViewSet(viewsets.ModelViewSet):
    serializer_class = CriminalRecordSerializer
    queryset = CriminalRecord.objects.all()

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
            return Response({"error": "case parameter is required"}, status=400)
        
        records = CriminalRecord.objects.filter(case_id=case_id)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)


class PublicEndpoint(APIView):
    permission_classes = [AllowAny]