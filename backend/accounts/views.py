from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    ProfileSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer
)
from .models import Profile, CustomUser
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser

print("🔥 REGISTER VIEW FROM:", __name__)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    users = CustomUser.objects.all().order_by('-date_joined')
    serializer = RegisterSerializer(users, many=True)
    return Response(serializer.data)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Authenticate using Django’s system
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check admin verification
        if not user.is_verified:
            return Response({'detail': 'Your account is not yet verified by admin.'}, status=status.HTTP_403_FORBIDDEN)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'is_verified': user.is_verified,
                'rank': user.rank,
            }
        }, status=status.HTTP_200_OK)


# --- Custom JWT serializer for admin verification ---

    

# --- Custom JWT view ---
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



# --- Profile API ---
class ProfileView(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    

    def get_queryset(self):
        # Filter profile for the logged-in user
        return Profile.objects.filter(user=self.request.user)

    def get_object(self):
        # Get or create a single profile for the logged-in user
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        # Override list to return a single object instead of a queryset
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

# --- Registration API ---
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "Registration successful. Awaiting admin approval.",
            "email": user.email
        }, status=status.HTTP_201_CREATED)