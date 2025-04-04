# Generated by Django 5.1.3 on 2024-12-10 14:31

import django.db.models.deletion
import tinymce.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0017_emaillist'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='newsletter_opt_in',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='NewsLetter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=255)),
                ('message', tinymce.models.HTMLField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('writer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='newsletters', to='app.profile')),
            ],
        ),
    ]
