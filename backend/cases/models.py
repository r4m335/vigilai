from django.db import models
from django.conf import settings
import uuid
from django.utils import timezone


class Case(models.Model):
    crime_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    case_number = models.CharField(max_length=200)
    type_of_crime = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    location = models.CharField(max_length=255, blank=True, default='')
    
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Pending', 'Pending'),
        ('Closed', 'Closed'),
        ('Reopened', 'Reopened'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Open')

    # Linking investigators directly to users
    investigator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='investigated_cases',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    # Case creator/owner
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='cases',
        on_delete=models.CASCADE,
        null=True, blank=True
    )

    # Audit fields
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.case_number} - {self.type_of_crime} ({self.status})"


class Evidence(models.Model):
    EVIDENCE_CHOICES = [
        ('DNA', 'DNA'),
        ('Fingerprint', 'Fingerprint'),
        ('Weapon', 'Weapon'),
        ('Document', 'Document'),
        ('Other', 'Other'),
    ]

    case = models.ForeignKey(Case, related_name='evidences', on_delete=models.CASCADE)
    type_of_evidence = models.CharField(max_length=100, choices=EVIDENCE_CHOICES, default='Other')
    details = models.TextField()
    file = models.FileField(upload_to='evidences/', blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.type_of_evidence} for Case {self.case.case_number}"


class Witness(models.Model):
    case = models.ForeignKey(Case, related_name='witnesses', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    statement = models.TextField()

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Witness: {self.name} (Case: {self.case.case_number})"


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

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.person_name} — Case {self.case.case_number}"


class SuspectPrediction(models.Model):
    case = models.ForeignKey(Case, related_name='predictions', on_delete=models.CASCADE)
    suspect_name = models.CharField(max_length=200)
    probability = models.FloatField()  # ML model prediction probability
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction: {self.suspect_name} ({self.probability*100:.2f}%)"
