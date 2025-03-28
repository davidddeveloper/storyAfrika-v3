from django.db import models
from django.contrib.auth.models import User
from .base_model import Base
from .user import Profile

class Comment(Base):
    """ Represent a comment
    """

    
    comment = models.TextField(max_length=500, null=False)
    commenter = models.ForeignKey(to=Profile, null=False, related_name='comments', on_delete=models.CASCADE)
    story = models.ForeignKey(to='Story', null=False, related_name='comments', on_delete=models.CASCADE)
    likes = models.ManyToManyField(to=Profile, blank=True, related_name='comment_likes')
    unlikes = models.ManyToManyField(to=Profile, blank=True, related_name='comment_unlikes')

    def __str__(self):
        return f'{self.id}'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def __str__(self):
        return self.story.title