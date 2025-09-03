# cases/permissions.py
from rest_framework import permissions

class IsInvestigator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Investigator').exists()

class IsProsecutorReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.method in permissions.SAFE_METHODS and 
                request.user.groups.filter(name='Prosecutor').exists())

class IsClerkForEvidenceOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.groups.filter(name='Clerk').exists():
            return False
        # further restrict to evidence module if needed
        return view.basename == 'evidence'

class IsCitizenRestricted(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Citizen').exists() and request.method in permissions.SAFE_METHODS

class IsChiefReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.groups.filter(name='Chief').exists() and request.method in permissions.SAFE_METHODS


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Read access is permitted to anyone.
    """

    def has_object_permission(self, request, view, obj):
        # Allow read-only actions for anyone
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only the owner can modify
        return obj.owner == request.user
