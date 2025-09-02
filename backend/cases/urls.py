from django.urls import path, include
from rest_framework import routers
from .views import CaseViewSet, EvidenceViewSet, WitnessViewSet, CriminalRecordViewSet

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet)
router.register(r'evidences', EvidenceViewSet)
router.register(r'witnesses', WitnessViewSet)
router.register(r'criminal-records', CriminalRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
