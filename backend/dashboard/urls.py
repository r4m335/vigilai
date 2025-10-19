# dashboard/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    AdminUserViewSet,
    AdminCaseViewSet,
    AdminEvidenceViewSet,
    AdminWitnessViewSet,
    AdminCriminalRecordViewSet,
    AdminPredictionViewSet,
)

router = DefaultRouter()
router.register('users', AdminUserViewSet, basename='admin-users')
router.register('cases', AdminCaseViewSet, basename='admin-cases')
router.register('evidence', AdminEvidenceViewSet, basename='admin-evidences')  # singular to match frontend
router.register('witnesses', AdminWitnessViewSet, basename='admin-witnesses')
router.register('criminal-records', AdminCriminalRecordViewSet, basename='admin-records')
router.register('predictions', AdminPredictionViewSet, basename='admin-predictions')

# Add the prefix here
urlpatterns = [
    path('admin-dashboard/', include(router.urls)),
    path('', include(router.urls)),
    path('admin-dashboard/users/<int:pk>/verify/', AdminUserViewSet.as_view({'patch': 'verify'})),
    path('admin-dashboard/users/<int:pk>/unverify/', AdminUserViewSet.as_view({'patch': 'unverify'})),
]
