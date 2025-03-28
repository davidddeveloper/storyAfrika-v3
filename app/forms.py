from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from .schema import Comment
from django.contrib.auth.forms import UserCreationForm

class LoginForm(forms.Form):
    email = forms.EmailField(required=True, max_length=100, min_length=5, validators=[validate_email])
    password = forms.CharField(required=True, max_length=100, min_length=8, widget=forms.PasswordInput)


class RegistrationForm(UserCreationForm):
    newsletter_opt_in = forms.BooleanField(label='Subscribe to newsletter', required=False)
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
