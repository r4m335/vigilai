from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError


class Case(models.Model):
    case_id = models.AutoField(primary_key=True)
    case_number = models.CharField(max_length=200)

    # Renamed fields
    primary_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    # New fields
    date_time = models.DateTimeField(default=timezone.now)  # includes both date and time
    district = models.PositiveSmallIntegerField()  # 1–14 (can enforce in serializer)
    ward = models.PositiveSmallIntegerField()
    arrest_status = models.CharField(max_length=20, choices=[('Not Arrested', 'Not Arrested'), ('Arrested', 'Arrested')], default='Not Arrested')

    LOCAL_GOVERNANCE_CHOICES = [
        ('Panchayat', 'Panchayat'),
        ('Municipal Corporation', 'Municipal Corporation'),
    ]
    local_governance = models.CharField(
        max_length=30,
        choices=LOCAL_GOVERNANCE_CHOICES,
        default='Panchayat')
    
    governance_name = models.CharField(
    max_length=200,
    blank=True,
    help_text="Name of the Panchayat or Corporation")

    # Renamed field
    location_description = models.CharField(max_length=255, blank=True, default='')

    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Pending', 'Pending'),
        ('Closed', 'Closed'),
        ('Reopened', 'Reopened'),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Open')

    investigator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='investigated_cases',
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='cases',
        on_delete=models.CASCADE,
        null=True, blank=True
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.case_number} - {self.primary_type} ({self.status})"
    @property
    def arrested(self):
        return self.arrest_status == 'Arrested'
    class Meta:
        indexes = [
            models.Index(fields=['case_number']),
            models.Index(fields=['status', 'district']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['case_number'], name='unique_case_number')
        ] 

class Evidence(models.Model):
    evidence_id = models.AutoField(primary_key=True)
    case = models.ForeignKey(Case, related_name='evidences', on_delete=models.CASCADE)
    type_of_evidence = models.CharField(max_length=100, default='Other')
    details = models.TextField()
    file = models.FileField(upload_to='evidences/', blank=True, null=True)

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.type_of_evidence} for Case {self.case.case_number}"
    def clean(self):
        if self.aadhaar_number and len(self.aadhaar_number) != 12:
            raise ValidationError({'aadhaar_number': 'Aadhaar number must be 12 digits'})

class Witness(models.Model):
    witness_id = models.AutoField(primary_key=True)
    case = models.ForeignKey(Case, related_name='witnesses', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    statement = models.FileField(
    upload_to='witness_statements/',
    blank=True,
    null=True,
    help_text="Audio or video recording of the witness statement")
    aadhaar_number = models.CharField(max_length=12, unique=True)
    contact_info = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Phone number or email of the witness"
    )

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Witness: {self.name} (Case: {self.case.case_number})"


class Criminal(models.Model):
    criminal_id = models.AutoField(primary_key=True)
    criminal_name = models.CharField(max_length=200)
    date_of_birth=models.DateField(null=True, blank=True)
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    criminal_gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    criminal_district = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(14)],
        help_text="District number (1–14)"
    )
    aadhaar_number = models.CharField(max_length=12, unique=True)
    photo = models.ImageField(upload_to='criminal_photos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.criminal_name} ({self.aadhaar_number})"
    def clean(self):
        if self.aadhaar_number and len(self.aadhaar_number) != 12:
            raise ValidationError({'aadhaar_number': 'Aadhaar number must be 12 digits'})
        if not self.aadhaar_number.isdigit():
            raise ValidationError({'aadhaar_number': 'Aadhaar number must contain only digits'})
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['aadhaar_number'], name='unique_criminal_aadhaar')
        ]

class CriminalRecord(models.Model):
    record_id = models.AutoField(primary_key=True)
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='criminal_records', verbose_name="Associated Case")
    suspect = models.ForeignKey('cases.Criminal', on_delete=models.CASCADE, related_name='records', verbose_name="Criminal Suspect")
    offenses = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Record: {self.suspect.criminal_name} (Case #{self.case.case_number})"

    class Meta:
        verbose_name = "Criminal Record"
        verbose_name_plural = "Criminal Records"


