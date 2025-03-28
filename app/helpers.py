from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

import os
from werkzeug.utils import secure_filename
from cloudinary import config
from cloudinary import uploader

def extract_username(email):
    """
        This function extract the username from the email
    """
    return email.split("@")[0]


def send_welcome_email(user):
    subject = 'Welcome to StoryAfrika'
    text_content = f'Hi {user.username},\n\nThank you for joining us on StoryAfrika. \n\n Here is your account details: \n\nUsername: {user.username} \nEmail: {user.email}, sign in at https://story-afrika.com if you haven not done so. \n\n Here is what to expect from us: \n\n1. We will send you a story every week. \n2. We will send you a story every month. \n3. We will send you a story every quarter. \n\n We are glad to have you here with us {user.username},\n\n Best,\nDavid'
    from_email = 'david@storyafrika.live'
    recipient_list = [user.email]
    html_content = render_to_string('emails/new_welcome_email.html', context={"user": user})

    msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    msg.attach_alternative(html_content, "text/html")

    msg.send(fail_silently=False)

def send_review_email(user, story):
    subject = 'Your Story is Being Reviewed'
    text_content = f''
    from_email = 'david@storyafrika.live'
    recipient_list = [user.email]
    html_content = render_to_string('emails/review_story_email.html', context={"user": user, "story": story})

    msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    msg.attach_alternative(html_content, "text/html")

    msg.send(fail_silently=False)

def send_review_pass_email(user, story):
    subject = 'Your Story has been Publish'
    text_content = f''
    from_email = 'david@storyafrika.live'
    recipient_list = [user.email]
    html_content = render_to_string('emails/review_story_email.html', context={"user": user, "story": story})

    msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    msg.attach_alternative(html_content, "text/html")

    msg.send(fail_silently=False)

def serialize_url(text: str) -> str:
        # remove username
        idx = 0
        for l in text:
            idx += 1
            if l == "-":
                break

        writer = text[:idx-1]
        title_with_dashes = text[idx:]
        title = title_with_dashes.replace("-"," ")

        return [title, writer]


"""
    cloudinary_image_upload.py: base class to upload images to cloudinary
"""


# Cloudinary image upload

class ImageUpload:
    """Represent ImageUpload"""

    UPLOAD_EXTENSIONS = ['.jpg', '.png', '.jpeg', '.gif', '.svg', '.webp', '.heic', '.heif', '.jfif']

    def __init__(self, cloud_name, api_key, api_secret):
        config(
            cloud_name = cloud_name,
            api_key = api_key,
            api_secret = api_secret
        )

    def upload(self, file, user_id):
        """ Upload to cloudinary """
        # self.validate(file)
        result = uploader.upload(file, folder=user_id)
        return {"image_url": result['secure_url']}

    def validate(file):
        """ Validate file extension and performs other security checks """
        if not file:
            raise ValueError("No file passed")

        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1]
        if file_ext not in ImageUpload.UPLOAD_EXTENSIONS:
            raise TypeError("File not accepted")
