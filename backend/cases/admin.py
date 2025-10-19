from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction


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
    list_display = ('case', 'person_name', 'age', 'gender', 'district', 'created_at')
    list_filter = ('gender', 'district')
    search_fields = ('person_name', 'offenses', 'case__case_number')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return True
    def has_change_permission(self, request, obj=None):
        return True
    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(SuspectPrediction)
class SuspectPredictionAdmin(admin.ModelAdmin):
    list_display = ('case', 'suspect_name', 'probability', 'created_at')
    search_fields = ('suspect_name', 'case__case_number')
    readonly_fields = ('created_at',)

    def has_add_permission(self, request):
        return True
    def has_change_permission(self, request, obj=None):
        return True
    def has_delete_permission(self, request, obj=None):
        return True
