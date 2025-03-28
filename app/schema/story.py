from django.db import models
from .base_model import Base
from tinymce.models import HTMLField
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from hitcount.models import HitCountMixin, HitCount
from hitcount.utils import get_hitcount_model
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils.text import slugify
from cloudinary.models import CloudinaryField
import cloudinary.uploader


STATUS_CHOICES = {
    "d": "Draft",
    "p": "Published",
    "w": "Withdrawn",
    "r": "Review"
}

class Story(Base):
    """ Represents a story
    """
    
    title = models.CharField(max_length=200, null=False)
    #text = RichTextUploadingField()
    #text = models.TextField(max_length=5000, null=False)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    text = HTMLField()
    writer = models.ForeignKey(to='Profile', on_delete=models.CASCADE, null=False, related_name='stories')
    topics = models.ManyToManyField(to='Topic', blank=True, related_name='stories')

    contributors = models.ManyToManyField(to='Profile', blank=True, related_name='stories_contributed_to')

    likes = models.ManyToManyField(to='Profile', blank=True, related_name='stories_liked')

    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default="d")
    unique_views = models.ManyToManyField(to='Profile', blank=True, related_name='viewers')
    #hit_count_generic = GenericRelation(HitCount)

    class Meta:
        verbose_name = 'Story'
        verbose_name_plural = 'Stories'

    def save(self, *args, **kwargs):
        if not self.slug:  # Generate slug only if it doesn't exist
            base_slug = slugify(self.title)
            unique_suffix = str(self.id)[:8]  # Use the first 8 characters of the UUID
            self.slug = f"{base_slug}-{unique_suffix}"

        super().save(*args, **kwargs)

    @property
    def love_count(self):
        return self.likes.count()

    def get_related_stories(self, max_results=10):
        """Retrieve related stories with unique writers."""

        # Stories sharing topics
        topic_related = Story.objects.filter(
            topics__in=self.topics.all(),
            status='p'
        ).exclude(id=self.id)

        # Stories with shared contributors
        contributor_related = Story.objects.filter(
            contributors__in=self.contributors.all(),
            status='p'
        ).exclude(id=self.id)

        # Combine the results
        combined_stories = topic_related.union(contributor_related)

        # Filter unique writers
        unique_stories = {}
        for story in combined_stories[:max_results]:
            if story.writer_id not in unique_stories:
                unique_stories[story.writer_id] = story

        # Return the unique stories limited by max_results
        return list(unique_stories.values())[:max_results]

    def get_other_stories_by_writer(self, max_results=10):
        """Retrieve other stories written by the same writer, excluding the current story."""
        return Story.objects.filter(
            writer=self.writer,
            status='p'
        ).exclude(id=self.id).order_by('-id')[:max_results]
    
    def get_similar_writers(self, max_results=10):
        """Retrieve similar writers based on shared topics or contributors."""
        # Writers sharing topics
        from . import Topic, Profile
        topic_ids = Topic.objects.filter(
            stories__writer=self.writer,
            stories__status='p'
        ).values_list('id', flat=True)

        similar_writers_by_topics = Profile.objects.filter(
            stories__topics__id__in=topic_ids
        ).exclude(id=self.writer.id).distinct()

        # Writers sharing contributors
        contributor_ids = Profile.objects.filter(
            stories_contributed_to__writer=self.writer
        ).values_list('id', flat=True)

        similar_writers_by_contributors = Profile.objects.filter(
            stories_contributed_to__id__in=contributor_ids
        ).exclude(id=self.writer.id).distinct()

        # Combine and ensure uniqueness
        similar_writers = (
            similar_writers_by_topics | similar_writers_by_contributors
        ).distinct()[:max_results]

        return similar_writers
    
    @property
    def plain_text(self):
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(self.text, 'html.parser')
        return soup.get_text()

    @property
    def read_time(self):
        """Returns the estimated read time of the story in minutes."""
        num_of_words = len(self.plain_text.split())
        # Average reading speed is 225 words per minute
        read_time_in_minutes = int(num_of_words / 225 + 0.5)

        return read_time_in_minutes

    @classmethod
    def paginate_queryset(cls, queryset, page_number, page_size=10):
        paginator = Paginator(queryset, page_size)
        try:
            page = paginator.page(page_number)
        except PageNotAnInteger:
            page = paginator.page(1)
        except EmptyPage:
            page = paginator.page(paginator.num_pages)
        return page
    
    @classmethod
    def increment_generic_hit_count(cls, request, instance):
        hit_count = get_hitcount_model().objects.get_for_object(instance)
        print("hit count", hit_count)
        HitCountMixin.hit_count(request, hit_count)

        return

    def __str__(self):
        return self.title


class StoryImage(models.Model):
    """ Represents an image for a story """
    story = models.ForeignKey(
        Story, on_delete=models.CASCADE, related_name='images'
    )
    image = CloudinaryField('image')
    alt = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        """Override save to upload image to Cloudinary and store its URL."""
        if self.image and not self.pk:  # If the object is new and has an image
            upload_result = cloudinary.uploader.upload(self.image)
            self.image = upload_result['secure_url']  # Store the Cloudinary URL

        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        if self.image:
            cloudinary.uploader.destroy(self.image.public_id)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.story.title}"