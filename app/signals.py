from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .schema.user import Profile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Creates a Profile for the User if it doesn't already exist.
    """
    if created:
        # Only create the profile if it doesn't already exist
        newsletter_opt_in = getattr(instance, 'newsletter_opt_in', False)
        Profile.objects.get_or_create(user=instance, defaults={'newsletter_opt_in': newsletter_opt_in})
        instance.profile.newsletter_opt_in = newsletter_opt_in
        instance.profile.set_default_profile()
    else:
        # If the user is updated, ensure the profile is updated too
        instance.profile.save()

