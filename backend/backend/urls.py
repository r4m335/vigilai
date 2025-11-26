from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # Accounts API (handles login, register, profile, tokens)
    path('api/', include('accounts.urls')),

    # Cases API (handles case, evidence, witnesses, etc.)
    path('api/', include('cases.urls')),

    # Admin dashboard (custom, not Django admin)
    path('api/', include('dashboard.urls')),

    path('api/', include('chat.urls')),

    # API Docs (Swagger / OpenAPI)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name="schema"), name='swagger-ui'),

    
]

# Static/media during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
