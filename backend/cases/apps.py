from django.apps import AppConfig
from django.db.models.signals import post_migrate


class CasesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cases'

    def ready(self):
        # Import signals safely
        from .signals import create_roles_and_permissions
        post_migrate.connect(create_roles_and_permissions, sender=self)
