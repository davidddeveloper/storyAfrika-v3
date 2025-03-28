from django.db import models
from .base_model import Base

class Topic(Base):
    """ Represent a topic


    """

    name = models.CharField(max_length=80, null=False)
    description = models.CharField(max_length=200, null=True)
    banner = models.CharField(max_length=200, null=True) # path to image
    followers = models.ManyToManyField(to='Profile', blank=True, related_name='topics_following')
    contributors = models.ManyToManyField(to='Profile', blank=True, related_name='topics_contributed_to')
    creator = models.ForeignKey(to='Profile', related_name='topics_created', on_delete=models.CASCADE, null=False)

    def __str__(self):
        return self.name
