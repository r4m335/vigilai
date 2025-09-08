from django.urls import path, include
from rest_framework import routers
from .views import CaseViewSet, EvidenceViewSet, WitnessViewSet, CriminalRecordViewSet
from .views import RegisterView

router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet,basename='cases')
router.register(r'evidences', EvidenceViewSet,basename='evidences')
router.register(r'witnesses', WitnessViewSet,basename='witnesses')
router.register(r'criminal-records', CriminalRecordViewSet,basename='criminal-records')

urlpatterns = [
    path('', include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
]
