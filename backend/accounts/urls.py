from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from accounts.views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    LoginView,
)

router = DefaultRouter()
router.register(r'profile', UserProfileView, basename='user-profile')

urlpatterns = [
     # REST router for profile
    path('', include(router.urls)),

    # Register (open)
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    

    # Token endpoints (single canonical login endpoint)
    # /api/token/ -> returns access + refresh + user info (via CustomTokenObtainPairSerializer)
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]
