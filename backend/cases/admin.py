from django.contrib import admin
from .models import Case, Evidence, Witness, CriminalRecord

class CaseAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'date_reported')

admin.site.register(Case, CaseAdmin)
admin.site.register(Evidence)
admin.site.register(Witness)
admin.site.register(CriminalRecord)
