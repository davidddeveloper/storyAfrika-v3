from django.db import models
from uuid import uuid4
from tinymce.models import HTMLField
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


class EmailList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, null=False)
    email = models.EmailField(unique=True, max_length=255)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Email Lists'

    def __str__(self):
        return self.email

    
class NewsLetter(models.Model):
    writer = models.ForeignKey(to='Profile', on_delete=models.CASCADE, null=False, related_name='newsletters')
    subject = models.CharField(max_length=255)
    message = HTMLField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'NewsLetters'

    def send_email(self, recipients : list=None):
        subject = self.subject
        html_content = self.message
        from_email = self.writer.user.email
        recipient_list = recipients

        msg = EmailMultiAlternatives(subject, '', from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")

        msg.send(fail_silently=False)

        return True

    def __str__(self):
        return f'{self.writer} - {self.subject}'
