from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def create_roles_and_permissions(sender, **kwargs):
    """
    Creates default user roles and assigns permissions.
    Runs after migrations via post_migrate signal.
    """
    # Import models locally to avoid circular imports
    from .models import Case, Evidence  

    # Define roles and the permissions for each role
    roles = {
        'Investigator': [
            'add_case', 'change_case', 'delete_case', 'view_case',
            'add_evidence', 'change_evidence', 'delete_evidence', 'view_evidence'
        ],
        'Prosecutor': ['view_case'],
        'Citizen': [],  # no permissions
        'Clerk': ['add_evidence', 'change_evidence', 'view_evidence'],
        'Chief': ['view_case', 'view_evidence']
    }

    for role_name, perm_codenames in roles.items():
        group, created = Group.objects.get_or_create(name=role_name)

        for codename in perm_codenames:
            # Determine the model based on codename
            model = Case if 'case' in codename else Evidence
            content_type = ContentType.objects.get_for_model(model)

            # Retrieve the permission object
            perm = Permission.objects.filter(codename=codename, content_type=content_type).first()
            if perm:
                group.permissions.add(perm)
