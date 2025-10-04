from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from accounts.forms import CustomUserChangeForm
from accounts.models import CustomUser 

User = get_user_model()


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    ordering = ('email',)
    search_fields = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    form = CustomUserChangeForm
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff']
    list_editable = ['first_name', 'last_name', 'email']


class CaseAdmin(admin.ModelAdmin):
    list_display = ('crime_id', 'status', 'date')


    

admin.site.register(Case, CaseAdmin)
admin.site.register(Evidence)
admin.site.register(Witness)
admin.site.register(CriminalRecord)
admin.site.unregister(User)
