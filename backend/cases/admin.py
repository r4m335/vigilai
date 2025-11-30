from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord, Criminal


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('case_number', 'primary_type', 'status', 'investigator', 'created_at')
    search_fields = ('case_number', 'primary_type', 'description')
    list_filter = ('status', 'primary_type', 'district')

    # ✅ restore editable admin
    readonly_fields = ('created_at', 'updated_at')  # only dates are read-only

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ('case', 'type_of_evidence', 'created_at')
    search_fields = ('case__case_number', 'details')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return True
    def has_change_permission(self, request, obj=None):
        return True
    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(Witness)
class WitnessAdmin(admin.ModelAdmin):
    list_display = ('case', 'name', 'contact_info', 'created_at')
    search_fields = ('name', 'case__case_number', 'statement')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return True
    def has_change_permission(self, request, obj=None):
        return True
    def has_delete_permission(self, request, obj=None):
        return True



@admin.register(CriminalRecord)
class CriminalRecordAdmin(admin.ModelAdmin):
    list_display = (
        'case',
        'get_criminal_name',
        'get_criminal_gender',
        'get_criminal_district',
        'created_at',
    )
    list_filter = ('suspect__criminal_gender', 'suspect__criminal_district')
    search_fields = ('suspect__criminal_name', 'offenses', 'case__case_number')
    readonly_fields = ('created_at',)

    # ✅ helper methods to access related Criminal fields
    def get_criminal_name(self, obj):
        return obj.suspect.criminal_name
    get_criminal_name.short_description = "Name"

    def get_criminal_gender(self, obj):
        return obj.suspect.criminal_gender
    get_criminal_gender.short_description = "Gender"

    def get_criminal_district(self, obj):
        return obj.suspect.criminal_district
    get_criminal_district.short_description = "District"

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(Criminal)
class CriminalAdmin(admin.ModelAdmin):
    list_display = ('criminal_name', 'aadhaar_number', 'date_of_birth', 'criminal_gender', 'criminal_district', 'created_at')
    search_fields = ('criminal_name', 'aadhaar_number')
    list_filter = ('criminal_gender', 'criminal_district')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True
 