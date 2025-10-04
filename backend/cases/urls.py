from django.urls import path, include
from rest_framework import routers
from .views import EmailTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CaseViewSet,
    EvidenceViewSet,
    WitnessViewSet,
    CriminalRecordViewSet,
    SuspectPredictionViewSet,
    RegisterView,
    PublicEndpoint
)
from django.urls import path
from . import views



# DRF router
router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, basename='cases')
router.register(r'evidences', EvidenceViewSet, basename='evidences')
router.register(r'witnesses', WitnessViewSet, basename='witnesses')
router.register(r'criminal-records', CriminalRecordViewSet, basename='criminal-records')
router.register(r'predictions', SuspectPredictionViewSet, basename='predictions')

urlpatterns = [
    path('', include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path("public/", PublicEndpoint.as_view(), name="public-endpoint"),
    path("login/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("login/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("predict/", views.predict_view, name="predict_suspects"),
    
]
