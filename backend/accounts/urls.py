from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from accounts.views import (
    EmailTokenObtainPairView,
    CustomTokenObtainPairView,
    RegisterView,
    ProfileViewSet,
)

router = DefaultRouter()
router.register(r'profile', ProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', admin.site.urls),
    # Email login (custom)
    path('login/email/', EmailTokenObtainPairView.as_view(), name='email_token_obtain_pair'),
    # Default login
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Admin-verified login
    path('login/admin/', CustomTokenObtainPairView.as_view(), name='custom_token_obtain_pair'),
    # Token refresh
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Register
    path('register/', RegisterView.as_view(), name='register'),
    # Profile API
    path('api/', include(router.urls)),
]
