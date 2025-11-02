from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser



@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser

    # Display fields in list view
    list_display = (
        'email', 'first_name', 'last_name', 
        'staff_id', 'rank', 'is_verified', 
        'is_active', 'is_staff', 'is_superuser'
    )
    list_filter = ('is_verified', 'is_active', 'rank', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'staff_id')
    ordering = ('email',)

    # Group fields into sections
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {
            'fields': (
                'first_name', 'last_name', 'phone_number', 
                'jurisdiction', 'staff_id', 'rank','bio', 'profile_photo',
            )
        }),
        ('Permissions', {
            'fields': (
                'is_verified', 'is_active', 'is_staff', 
                'is_superuser', 'groups', 'user_permissions'
            )
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'phone_number',
                'jurisdiction', 'staff_id', 'rank',
                'is_verified', 'is_staff', 'is_active','bio', 'profile_photo',
            ),
        }),
    )

    # ✅ restore full permissions (superuser can edit again)
    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} users were successfully verified.')
    verify_users.short_description = "Verify selected users"

    def unverify_users(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} users were successfully unverified.')
    unverify_users.short_description = "Unverify selected users"