from django.db import models

class Case(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date_reported = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=50, default="Open")

    def __str__(self):
        return f"{self.title} - {self.status}"

class Evidence(models.Model):
    case = models.ForeignKey(Case, related_name='evidences', on_delete=models.CASCADE)
    evidence_type = models.CharField(max_length=100)
    description = models.TextField()
    file = models.FileField(upload_to='evidences/', blank=True, null=True)

    def __str__(self):
        return f"{self.evidence_type} for case {self.case.id}"

class Witness(models.Model):
    case = models.ForeignKey(Case, related_name='witnesses', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    statement = models.TextField()

    def __str__(self):
        return f"Witness: {self.name} (Case {self.case.id})"

class CriminalRecord(models.Model):
    person_name = models.CharField(max_length=200)
    past_offenses = models.TextField()
    associated_cases = models.ManyToManyField(Case, blank=True)

    def __str__(self):
        return self.person_name
