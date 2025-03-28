from django.db import models
from tinymce.models import HTMLField
from cloudinary.models import CloudinaryField
import cloudinary.uploader
from .story import Story

STATUS = (
    ('a', 'Active'),
    ('i', 'Inactive')
)
class FeaturingStory(models.Model):
    caption = models.CharField(null=False, max_length=50)
    #banner = models.ImageField(upload_to="media/", null=False, default='something')
    banner = CloudinaryField('image')
    story = models.ForeignKey(to=Story, null=False, related_name='has_featured', on_delete=models.CASCADE)
    intro_to_story = HTMLField()
    status = models.CharField(max_length=1, choices=STATUS, default="a")

    class Meta:
        verbose_name = 'Featuring Story'
        verbose_name_plural = 'Featuring Stories'
    
    def save(self, *args, **kwargs):
        """ Overrride save to upload image to Cloudinary"""
        if self.banner and not self.pk:  # If the object is new and has an image
            upload_result = cloudinary.uploader.upload(self.banner)
            self.banner = upload_result['secure_url']  # Store the Cloudinary URL

        super().save(*args, **kwargs)

    def __str__(self):
        return self.caption
