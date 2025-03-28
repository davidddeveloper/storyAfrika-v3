from django.core.management.base import BaseCommand
from app.schema import Story
from django.utils.text import slugify

class Command(BaseCommand):
    help = "Populates the slug field for all stories"

    def handle(self, *args, **kwargs):
        stories = Story.objects.filter(slug__isnull=True)  # Find stories without slugs
        for story in stories:
            unique_slug = slugify(story.title)
            counter = 1
            while Story.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{slugify(story.title)}-{counter}"
                counter += 1
            story.slug = unique_slug
            story.save()
            self.stdout.write(f"Slug for Story ID {story.id} updated to: {story.slug}")
