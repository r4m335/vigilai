from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord

class CaseAdmin(admin.ModelAdmin):
    list_display = ('case_id', 'status', 'date_time')
    

admin.site.register(Case, CaseAdmin)
admin.site.register(Evidence)
admin.site.register(Witness)
admin.site.register(CriminalRecord)