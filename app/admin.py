from django.contrib import admin
from .schema import Profile, Story, Topic, Comment, StoryImage, FeaturingStory, EmailList, NewsLetter
from django.contrib.auth.models import User
from .admin_actions import publish_stories, withdraw_stories, draft_stories, accept_story
from django.db import OperationalError
# Register your models here.

common_field = ['id', 'created_at', 'updated_at']

class StoryImageInline(admin.TabularInline):  # or admin.StackedInline for a different style
    model = StoryImage
    extra = 1  # Number of empty image upload slots displayed

@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    inlines = [StoryImageInline]
    list_display = ('title', 'writer', 'status')
    search_fields = ['title', 'writer__user__username']
    list_filter = ['status']
    exclude = common_field + [ 'likes', 'views']
    readonly_fields = ['unique_views']
    list_select_related = ['writer']
    actions = [publish_stories, withdraw_stories, draft_stories, accept_story]


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ['name']
    exclude = common_field + ['followers']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('comment', 'commenter', 'story')
    search_fields = ['comment', 'commenter__user__username', 'story__title']
    exclude = common_field + ['likes', 'unlikes']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_username', 'get_email', 'short_bio', 'registration_finish')
    search_fields = ['user__username', 'user__email']
    exclude = common_field + ['user', 'followers']

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = 'Username'  # Optional: to customize the column header

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'  # Optional: to customize the column header

@admin.register(FeaturingStory)
class FeaturingStoryAdmin(admin.ModelAdmin):
    list_display = ('caption', 'story', 'status')
    search_fields = ['caption', 'story__title', 'intro_to_story__title']

@admin.register(EmailList)
class EmailListAdmin(admin.ModelAdmin):
    list_display = ('email', 'subscribed_at')
    search_fields = ['email']


@admin.register(NewsLetter)
class NewsletterAdmin(admin.ModelAdmin):
    list_display = ('subject', 'created_at')
    search_fields = ['subject']
    
    def save_model(self, request, obj, form, change):
        """Override save to send emails when a newsletter is saved."""
        super().save_model(request, obj, form, change)

        # Only send emails if it's a new object (not editing an existing one)
        if not change:
            # Get all users who opted for newsletters
            email_list = list(EmailList.objects.values_list('email', flat=True))
            recipients = list(User.objects.filter(profile__newsletter_opt_in=True).values_list('email', flat=True))
            # test only
            print('email_list:', email_list)
            print('recipients:', recipients)
            recipients += email_list
            # Send the email
            if recipients:
                obj.send_email(recipients)
            else:
                print("No recipients found.")