
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def create_roles_and_permissions(sender, **kwargs):
    from .models import Case, Evidence  # adjust as needed

    roles = {
        'Investigator': ['add_case', 'change_case', 'delete_case', 'view_case', 'view_evidence', 'add_evidence', 'change_evidence', 'delete_evidence'],
        'Prosecutor': ['view_case'],  # specify case IDs later in logic if needed
        'Citizen': [],  # no general permissions
        'Clerk': ['view_evidence', 'add_evidence', 'change_evidence'],
        'Chief': ['view_case', 'view_evidence']
    }

    for role_name, perm_codenames in roles.items():
        group, _ = Group.objects.get_or_create(name=role_name)
        for codename in perm_codenames:
            # assume permissions are default for Case and Evidence models
            model = Case if 'case' in codename else Evidence
            perm = Permission.objects.filter(codename=codename, content_type=ContentType.objects.get_for_model(model)).first()
            if perm:
                group.permissions.add(perm)
