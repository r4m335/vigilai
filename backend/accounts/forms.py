# in accounts/forms.py

from django import forms
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomUserChangeForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password']  # include other relevant fields here
