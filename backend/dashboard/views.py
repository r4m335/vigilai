from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.models import CustomUser
from cases.models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction
from accounts.serializers import RegisterSerializer, UserSerializer
from cases.serializers import CaseSerializer, EvidenceSerializer, WitnessSerializer, CriminalRecordSerializer, SuspectPredictionSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_admin_access(request):
    return Response({
        'message': 'Admin dashboard access working',
        'user': request.user.username,
        'is_superuser': request.user.is_superuser
    })


class AdminOnlyPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser  # only allow admin access


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = RegisterSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]

    @action(detail=True, methods=['patch'], permission_classes=[AdminOnlyPermission])
    def verify(self, request, pk=None):
        """
        Verify a single user.
        PATCH /api/admin-dashboard/users/{id}/verify/
        """
        user = self.get_object()
        user.is_verified = True
        user.save()
        serializer = self.get_serializer(user)
        return Response({
            'status': 'user verified',
            'user': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[AdminOnlyPermission])
    def unverify(self, request, pk=None):
        """
        Unverify a single user.
        PATCH /api/admin-dashboard/users/{id}/unverify/
        """
        user = self.get_object()
        user.is_verified = False
        user.save()
        serializer = self.get_serializer(user)
        return Response({
            'status': 'user unverified',
            'user': serializer.data
        }, status=status.HTTP_200_OK)

class AdminProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CustomUser.objects.all().order_by('-date_joined')  # Fixed: Use Profile model instead of Case
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]


class AdminCaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Case.objects.all().order_by('-created_at')
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, AdminOnlyPermission])
    def assign_investigator(self, request, pk=None):
        case = self.get_object()
        
        investigator_id = request.data.get('investigator_id')
        if investigator_id == "null" or investigator_id is None:
            case.investigator = None
            case.save()
            return Response({"message": "Investigator cleared", "case": CaseSerializer(case).data})

        if not investigator_id:
            return Response({"error": "investigator_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            investigator = CustomUser.objects.get(id=investigator_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Invalid investigator_id"}, status=status.HTTP_404_NOT_FOUND)

        case.investigator = investigator
        case.save()

        return Response({
            "message": "Investigator assigned successfully",
            "case": CaseSerializer(case).data
        }, status=status.HTTP_200_OK)



class AdminEvidenceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]


class AdminWitnessViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Witness.objects.all()
    serializer_class = WitnessSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]


class AdminCriminalRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CriminalRecord.objects.all()
    serializer_class = CriminalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]


class AdminPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SuspectPrediction.objects.all()
    serializer_class = SuspectPredictionSerializer
    permission_classes = [permissions.IsAuthenticated, AdminOnlyPermission]