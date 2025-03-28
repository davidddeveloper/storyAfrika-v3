from django.contrib import admin
from .helpers import send_review_pass_email

@admin.action(description='Publish Selected Stories')
def publish_stories(modeladmin, request, queryset):
    queryset.update(status='p')

@admin.action(description='Withdraw Selected Stories')
def withdraw_stories(modeladmin, request, queryset):
    queryset.update(status='w')

@admin.action(description='Draft Selected Stories')
def draft_stories(modeladmin, request, queryset):
    queryset.update(status='d')

@admin.action(description='Accept Story and Pass Review')
def accept_story(modeladmin, request, queryset):
    for story in queryset:
        send_review_pass_email(story.writer.user, story)
    queryset.update(status='p')