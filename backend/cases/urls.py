from django.urls import path, include
from rest_framework import routers
from .views import (
    CaseViewSet,
    EvidenceViewSet,
    WitnessViewSet,
    CriminalRecordViewSet,
    PredictView,
    PublicEndpoint,
    PredictMultipleSuspectsView,
    CasePredictionView,
    HealthCheckView

)
from django.urls import path
from . import views



# DRF router
router = routers.DefaultRouter()
router.register(r'cases', CaseViewSet, basename='cases')
router.register(r'evidences', EvidenceViewSet, basename='evidences')
router.register(r'witnesses', WitnessViewSet, basename='witnesses')
router.register(r'criminal-records', CriminalRecordViewSet, basename='criminal-records')

urlpatterns = [
    # API routes
    path('', include(router.urls)),
    
    # Prediction endpoints
    path('predict/', views.PredictView.as_view(), name='predict'),
    path('predict/multiple/', views.PredictMultipleSuspectsView.as_view(), name='predict-multiple'),
    path('cases/<int:case_id>/generate_prediction/', views.CasePredictionView.as_view(), name='case-prediction'),
    
    # Health and public endpoints
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    path('public/', views.PublicEndpoint.as_view(), name='public-api'),
    
    # Auth endpoints (if needed)
    path('auth/', include('rest_framework.urls')),
]