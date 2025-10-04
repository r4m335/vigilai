from rest_framework import permissions
from .models import Evidence

# -------------------------------
# Role-based Permissions
# -------------------------------
class IsInvestigator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Investigator').exists()


class IsProsecutorReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.method in permissions.SAFE_METHODS and
            request.user.groups.filter(name='Prosecutor').exists()
        )


class IsClerkForEvidenceOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Check user is in Clerk group
        if not request.user.groups.filter(name='Clerk').exists():
            return False
        # Restrict to Evidence model views only
        model_name = getattr(getattr(view, 'queryset', None), 'model', None)
        if model_name is None:
            return False
        return model_name == Evidence


class IsCitizenRestricted(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.groups.filter(name='Citizen').exists() and
            request.method in permissions.SAFE_METHODS
        )


class IsChiefReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.groups.filter(name='Chief').exists() and
            request.method in permissions.SAFE_METHODS
        )


# -------------------------------
# Owner-based Permission
# -------------------------------
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Read access is permitted to anyone.
    """

    def has_object_permission(self, request, view, obj):
        # Read-only actions are always allowed
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only t
