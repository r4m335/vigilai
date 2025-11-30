from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    AdminUserViewSet,
    AdminCaseViewSet,
    AdminEvidenceViewSet,
    AdminWitnessViewSet,
    AdminCriminalRecordViewSet,
    test_admin_access,
)


router = DefaultRouter()
router.register('users', AdminUserViewSet, basename='admin-users')
router.register('cases', AdminCaseViewSet, basename='admin-cases')
router.register('evidence', AdminEvidenceViewSet, basename='admin-evidence')
router.register('witnesses', AdminWitnessViewSet, basename='admin-witnesses')
router.register('criminal-records', AdminCriminalRecordViewSet, basename='admin-criminal-records')


urlpatterns = [
    # This will create URLs like: /api/admin-dashboard/users/, /api/admin-dashboard/cases/, etc.
    path('admin-dashboard/', include(router.urls)),
    path('admin-dashboard/', include(router.urls)),
    path('admin-dashboard/test/', test_admin_access),
    
    # Remove these lines as they create duplicate routes:
    # path('', include(router.urls)),  # This creates /api/users/ which conflicts
    # path('admin-dashboard/users/<int:pk>/verify/', AdminUserViewSet.as_view({'patch': 'verify'})),
    # path('admin-dashboard/users/<int:pk>/unverify/', AdminUserViewSet.as_view({'patch': 'unverify'})),
]