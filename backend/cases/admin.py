from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord, SuspectPrediction

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('case_id', 'case_number', 'primary_type', 'status', 'date_time', 'district', 'investigator', 'created_at')
    list_filter = ('status', 'primary_type', 'district')
    search_fields = ('case_id', 'case_number', 'primary_type', 'description')
    readonly_fields = [f.name for f in Case._meta.fields]  # ✅ Make all fields read-only

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        # Allow view only for superusers
        if request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ('evidence_id', 'case', 'type_of_evidence', 'created_at')
    list_filter = ('type_of_evidence',)
    search_fields = ('case__case_number', 'type_of_evidence', 'details')
    readonly_fields = [f.name for f in Evidence._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(Witness)
class WitnessAdmin(admin.ModelAdmin):
    list_display = ('witness_id', 'case', 'name', 'created_at')
    search_fields = ('case__case_number', 'name', 'statement')
    readonly_fields = [f.name for f in Witness._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(CriminalRecord)
class CriminalRecordAdmin(admin.ModelAdmin):
    list_display = ('criminal_id', 'case', 'person_name', 'age', 'gender', 'district', 'created_at')
    list_filter = ('gender', 'district')
    search_fields = ('case__case_number', 'person_name', 'offenses')
    readonly_fields = [f.name for f in CriminalRecord._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(SuspectPrediction)
class SuspectPredictionAdmin(admin.ModelAdmin):
    list_display = ('prediction_id', 'case', 'suspect_name', 'probability', 'created_at')
    search_fields = ('case__case_number', 'suspect_name')
    readonly_fields = [f.name for f in SuspectPrediction._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False