# cases/management/commands/create_roles.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from cases.models import Case, Evidence

class Command(BaseCommand):
    help = 'Creates default roles and assigns permissions'

    def handle(self, *args, **options):
        roles = {
            'Investigator': ['add_case', 'change_case', 'delete_case', 'view_case', 'view_evidence', 'add_evidence', 'change_evidence', 'delete_evidence'],
            'Prosecutor': ['view_case'],
            'Citizen': [],
            'Clerk': ['view_evidence', 'add_evidence', 'change_evidence'],
            'Chief': ['view_case', 'view_evidence'],
        }

        for role_name, perm_codenames in roles.items():
            group, created = Group.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(f'Created group {role_name}')
            for codename in perm_codenames:
                target_model = Case if 'case' in codename else Evidence
                perm = Permission.objects.filter(
                    codename=codename, content_type=ContentType.objects.get_for_model(target_model)
                ).first()
                if perm:
                    group.permissions.add(perm)
                    self.stdout.write(f'Added {codename} to {role_name}')
        self.stdout.write(self.style.SUCCESS("Roles and permissions created."))
