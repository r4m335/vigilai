from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from accounts.forms import CustomUserChangeForm

User = get_user_model()

class CaseAdmin(admin.ModelAdmin):
    list_display = ('crime_id', 'status', 'date')


class CustomUserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff']
    list_editable = ['first_name', 'last_name', 'email']

admin.site.register(Case, CaseAdmin)
admin.site.register(Evidence)
admin.site.register(Witness)
admin.site.register(CriminalRecord)
admin.site.unregister(User)  # Remove default registration (if any)
admin.site.register(User, CustomUserAdmin)
