"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework_simplejwt.views import TokenVerifyView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from cases.views import CaseViewSet
from accounts.views import ProfileViewSet
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import CustomTokenObtainPairView, RegisterView as AccountsRegisterView, ProfileViewSet



router = DefaultRouter()
router.register(r'cases', CaseViewSet)




urlpatterns = [
    path('', include(router.urls)),
    path('admin/', admin.site.urls),
    path('api/register/', AccountsRegisterView.as_view(), name='register'),
    path('api/', include('cases.urls')),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/', include('accounts.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path('api/', include(router.urls)),
    path('api/profile/', ProfileViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='profile'),
    path('api/', include('cases.urls')),
    path('api/', include('accounts.urls')),
    

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


