from django.db import models

# Create your models here.
class Profile(models.Model):
    """
        Represents a user

        Attributes:
            - username: user identity on the platform
            - fullname: first name last name and any other name
            - email: user email address
            - password: password of the user
            - short_bio: who the user is
            - about: detail description of the user
    """
    user = models.ForeignKey(to=User, related_name="profile")
    short_bio = Column(String(160), nullable=True)
    about = Column(Text, nullable=True)
    full_name = models.CharField(null=True, blank=True, default=(user.first_name, user.last_name))
    stories = relationship('Story', backref='writer', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    #my_topics = relationship('Topic', backref='creator', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    comments = relationship('Comment', backref='commenter', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    likes = relationship('Like', backref='liker', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    bookmarks = relationship('Bookmark', backref='bookmarker', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    comment_likes = relationship('CommentLike', backref='liker', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    comment_unlikes = relationship('CommentUnLike', backref='unliker', lazy=True, passive_deletes=True, cascade='all, delete-orphan')
    followers:  WriteOnlyMapped['User'] = relationship(
        secondary=Follower.__table__,
        primaryjoin='followers.c.followed_id == User.id',
        secondaryjoin='followers.c.follower_id == User.id',
        back_populates='following',
        passive_deletes=True,
        lazy=True
    )
    following: WriteOnlyMapped['User'] = relationship(
        secondary=Follower.__table__,
        primaryjoin='followers.c.follower_id == User.id',
        secondaryjoin='followers.c.followed_id == User.id',
        back_populates='followers',
        passive_deletes=True,
        lazy=True
    )
    topic_following = relationship(
        'TopicFollower',
        backref='user', # I should remember to change users to user here and in my templates
        lazy=True
    )
    avatar = Column(String(200), nullable=True) # path to avatar
    banner = Column(String(200), nullable=True, default='https://fastly.picsum.photos/id/91/800/500.jpg?hmac=J_kCOn2MZlDuJIb_rU14DYnb6HMv55ynWirbSF9l8f0')
    registration_finish = Column(Boolean, nullable=False, default=False)