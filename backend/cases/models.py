from django.db import models
from django.conf import settings
from django.utils import timezone

class Case(models.Model):
    crime_id = models.CharField(max_length=100, unique=True)
    case_number = models.CharField(max_length=200)
    type_of_crime = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    location = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(
        max_length=50,
        choices=[
            ('Open', 'Open'),
            ('In Progress', 'In Progress'),
            ('Pending', 'Pending'),
            ('Closed', 'Closed'),
            ('Reopened', 'Reopened'),
        ],
        default='Open'
    )
    investigator = models.CharField(max_length=200, blank=True)
    owner = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    related_name='cases',
    on_delete=models.CASCADE,
    null=True, blank=True  # Temporarily allow nulls
)

    def __str__(self):
        return f"{self.crime_id} - {self.title} ({self.status})"

class Evidence(models.Model):
    case = models.ForeignKey(Case, related_name='evidences', on_delete=models.CASCADE)
    type_of_evidence = models.CharField(max_length=100)
    details = models.TextField()
    file = models.FileField(upload_to='evidences/', blank=True, null=True)

    def __str__(self):
        return f"{self.type_of_evidence} for Case {self.case.crime_id}"

class Witness(models.Model):
    case = models.ForeignKey(Case, related_name='witnesses', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    statement = models.TextField()

    def __str__(self):
        return f"Witness: {self.name} (Case: {self.case.crime_id})"

class CriminalRecord(models.Model):
    case = models.ForeignKey(Case, related_name='criminal_records', on_delete=models.CASCADE)
    person_name = models.CharField(max_length=200)
    offenses = models.TextField()
    photo = models.ImageField(
        upload_to='criminal_photos/',
        blank=True,
        null=True,
        help_text='Upload an image of the criminal'
    )

    def __str__(self):
        return f"{self.person_name} — Case {self.case.crime_id}"
