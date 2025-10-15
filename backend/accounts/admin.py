from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile

# Inline admin for Profile (to show it under CustomUser)
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    inlines = [ProfileInline]
    
    # Display fields in list view
    list_display = ('email', 'first_name', 'last_name', 'staff_id', 'rank', 'phone_number', 'jurisdiction', 'is_verified', 'is_staff', 'is_active')
    list_filter = ('is_verified', 'is_staff', 'is_active', 'rank')
    list_editable = ('is_verified',)
    
    # Fields when editing an existing user
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'staff_id', 'rank', 'jurisdiction')}),
        ('Permissions', {'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields when creating a new user in admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'first_name', 'last_name', 'phone_number', 'staff_id', 'rank', 'jurisdiction',
                'is_verified', 'is_staff', 'is_active'
            )}
        ),
    )
    
    search_fields = ('email', 'username', 'first_name', 'last_name', 'staff_id', 'phone_number', 'rank')
    ordering = ('email',)
    
    actions = ['verify_users', 'unverify_users']

    def get_inline_instances(self, request, obj=None):
        """Only show inline when editing an existing object"""
        if not obj:
            return []
        return super().get_inline_instances(request, obj)

    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} users were successfully verified.')
    verify_users.short_description = "Verify selected users"

    def unverify_users(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} users were successfully unverified.')
    unverify_users.short_description = "Unverify selected users"