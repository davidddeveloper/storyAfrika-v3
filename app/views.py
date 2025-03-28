from django.shortcuts import render, HttpResponse, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import Http404, JsonResponse
from django.urls import reverse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.views import PasswordResetView
from django.db.models import Q
import bleach
from .schema import EmailList, Comment
from .forms import LoginForm, RegistrationForm
from .helpers import extract_username, send_review_email, send_welcome_email, serialize_url
from .schema import Story, StoryImage, Profile, FeaturingStory, Topic
import json, os
from django.conf import settings
from PIL import Image


# Create your views here.
def first_home_page(request):
    stories = Story.objects.filter(status='p').order_by('-created_at')

    return render(request, 'home/first_home.html', context={
        'stories': stories,

    })

def story(request):
    return render(request, 'story/story.html')

def sign_in(request):
    form = LoginForm()
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            username = extract_username(email)
            password = form.cleaned_data['password']

            user = None
            try:
                user = User.objects.get(email=email)
            except Exception:
                pass

            if user and user.check_password(password):
                login(request, user)
                messages.success(request, f'Welcome back {user.username}')
                return redirect('/')

            messages.error(request, 'Email or Password is incorrect!')

    return render(request, 'user/login.html', context={
        'form': form
    })

def join_us(request):
    form = RegistrationForm()
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)

            username = extract_username(user.email)
            if username and User.objects.filter(username=username).exists():
                form.add_error('email', 'A user with this email already exists: {}'.format(user.email))
                return render(request, 'user/registration.html', context={
                    'form': form
                })
            
            user.username = username
            user.newsletter_opt_in = form.cleaned_data['newsletter_opt_in']
            user.save()

            messages.success(request, f'Account created for {user.username}')

            # send email
            # check if the user click on the checkbox to accept us sending weekly emails
            if request.POST.get('newsletter_opt_in'):
                send_welcome_email(user)

            return redirect('/sign_in')
    
    return render(request, 'user/registration.html', context={
        'form': form
    })


def sign_out(request):
    logout(request)
    messages.info(request, 'Please Login')
    return redirect('/sign_in')


def old_story_view(request, story_id):
    story = get_object_or_404(Story, id=story_id)

    # count unique views
    if request.user.is_authenticated:
        story.unique_views.add(request.user.profile)
    
    # count generic views
    # Story.increment_generic_hit_count(request, story)

    related_stories = story.get_related_stories(3)
    other_stories_by_writer = story.get_other_stories_by_writer(3)
    similar_writers = story.get_similar_writers(max_results=5)

    # comments and comments count
    comments = story.comments.all().order_by('-created_at')

    return render(request, 'story/story.html', context={
        'story': story,
        'related_stories': related_stories,
        'other_stories_by_writer': other_stories_by_writer,
        'similar_writers': similar_writers,
        'comments': comments
    })

def story_view(request, story_title, story_uuid=None):
    
    if not story_uuid:
        raise ValueError('story_uuid is required')

    story = Story.objects.filter(title__contains=story_title, uuid__endswith=story_uuid).first()
    if not story:
        raise ValueError('story not found')

    return HttpResponse(f'<h1> {story.title}</h1>')


def build_story_detail(request, slug=None, story_id=None):

    story = get_object_or_404(Story, id=story_id, slug=slug)

    return redirect(reverse('app:story_detail', kwargs={'username': story.writer.user.username, 'slug': story.slug}))

def story_detail(request, username=None, slug=None):
    # Fetch the story based on slug
    story = get_object_or_404(Story, slug=slug, writer__user__username=username)

    # count unique views
    if request.user.is_authenticated:
        story.unique_views.add(request.user.profile)

    # related stories, other stories by writer, etc.
    related_stories = story.get_related_stories(3)
    other_stories_by_writer = story.get_other_stories_by_writer(3)
    similar_writers = story.get_similar_writers(max_results=5)

    # comments and comments count
    comments = story.comments.all().order_by('-created_at')

    return render(request, 'story/story.html', context={
        'story': story,
        'related_stories': related_stories,
        'other_stories_by_writer': other_stories_by_writer,
        'similar_writers': similar_writers,
        'comments': comments
    })

# review page
def story_review_status(request, story_id=None):
    story = get_object_or_404(Story, id=story_id)

    if story.status != 'r':
        raise Http404("Can't access this page because the story has been reviewed.")

    return render(request, 'story/story.html', context={
        'story': story,
    })


def stories(request):
    stories = Story.objects.filter(status='p').order_by('-created_at')
    top_writers = Profile.top_writers
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 6)
    stories = Story.paginate(page_number, page_size, order_by='-created_at')

    featuring_story = FeaturingStory.objects.filter(status='a').first()

    stories_liked = None
    if request.user.is_authenticated:
        stories_liked = request.user.profile.stories_liked.all().order_by('-created_at')[:3]

    return render(request, 'home/home.html', context={
        'stories': stories,
        'top_writers': top_writers,
        'stories_liked': stories_liked,
        'featuring_story': featuring_story
    })

@csrf_exempt
@require_POST
def subscribe(request):
    data = json.loads(request.body)
    email = data.get('email').strip() if data.get('email') else ''
    if not email or '@' not in email:
        return JsonResponse({'error': 'Invalid email address'}, status=400)

    try:
        new_email = EmailList(email=email)
        new_email.save()
        return JsonResponse({'message': 'Successfully subscribed!', 'success': True}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# password Reset

class CustomPasswordResetView(PasswordResetView):
    email_template_name = 'emails/password_reset_email.html'
    subject_template_name = 'emails/password_reset_subject.txt'
    success_url = 'done'



def like_story(request, story_id=None):
    story = get_object_or_404(Story, id=story_id)
    print(story.likes.count())
    if story.status == 'r':
        return JsonResponse({"ok": False, "message": "Cannot like a story under review.", "love_count": story.love_count}, status=403)

    story.likes.add(request.user.profile)

    return JsonResponse({"ok": True, "love_count": story.love_count}, status=200)


def unlike_story(request, story_id=None):
    story = get_object_or_404(Story, id=story_id)

    if story.status == 'r':
        return JsonResponse({"ok": False, "message": "Cannot unlike a story under review.", "love_count": story.love_count}, status=403)

    story.likes.remove(request.user.profile)

    return JsonResponse({"ok": True, "love_count": story.love_count}, status=200)

def search(request):
    query = request.GET.get('q')
    category = request.GET.get('category')
    print(query)
    if category == 'stories':
        stories = Story.objects.filter(status='p').filter(Q(title__icontains=query) | Q(text__icontains=query))
        return render(request, 'home/search.html', {'stories': stories, 'query': query})
    elif category == 'topics':
        topics = Topic.objects.filter(name__icontains=query)
        return render(request, 'home/search.html', {'topics': topics, 'query': query})
    elif category == 'people':
        profiles = Profile.objects.filter(Q(user__username__icontains=query) | Q(user__first_name__icontains=query) | Q(user__last_name__icontains=query))
        return render(request, 'home/search.html', {'profiles': profiles, 'query': query})
    else:
        return render(request, 'home/search.html')

def comment(request, story_id=None):
    story = get_object_or_404(Story, id=story_id)

    if story.status == 'r':
        return JsonResponse({"ok": False, "message": "Cannot comment on a story that is under review."}, status=403)

    if request.method == 'POST':
        print(request.body.decode('utf-8'))
        data = json.loads(request.body.decode('utf-8'))
        comment_text = data.get('comment')
        if not comment_text:
            return JsonResponse({"ok": False, "message": "Please provide a comment"}, status=400)

        comment_text = bleach.clean(comment_text)

        comment = Comment(comment=comment_text, commenter=request.user.profile, story=story)
        comment.save()

        return JsonResponse({"ok": True, "message": "Comment added successfully", "comment": comment.comment}, status=200)
    return JsonResponse({"ok": False, "message": "Please provide valid data"}, status=400)


def super_editor(request):
    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to access this page.')
        return redirect('app:sign_in')
    
    example_story = None
    if request.method == 'GET':
        example_story = Story.objects.create(
        title='Your Story Title',
        text='This is an example story.',
        status='d',
        writer=request.user.profile
        )
        #example_story_image = StoryImage.objects.create(
        #    story=example_story,
        #    #image = open(os.path.join(settings.STATIC_ROOT, 'assets/images/african-load-carrying.jpg'), 'rb')
        #)
        #example_story.images.add(example_story_image)
        topics = Topic.objects.all()
        return render(request, 'story/super_editor.html', context={
            'story': example_story,
            'topics': topics
        })


def super_editor_save(request, story_id=None):
    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to access this page.')
        return redirect('app:sign_in')
    
    story = Story.objects.get(id=story_id)
    if story_id is None or story is None:
        return JsonResponse({'status': 'error', 'message': 'Story ID is required'}, status=400)
    
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        story.title = data.get('title')
        story.text = data.get('text')

        if data.get('status') == 'r':
            story.status = data.get('status')
        else:
            story.status = 'd'
        story.save()

        if data.get('status') == 'r':
            send_review_email(request.user, story)

        return JsonResponse({'status': 'success'})

def editor_save_images(request, story_id=None):
    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to access this page.')
        return redirect('sign_in')

    if story_id is None:
        return JsonResponse({'status': 'error', 'message': 'Story ID is required'}, status=400)
    
    story = Story.objects.get(id=story_id)
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        images = data.get('images')
        
        if images:
            for image in images:
                current_images = story.images.all()
                
                is_current = False
                for current_image in current_images:
                    print(current_image.image.url, image['src'])
                    if current_image.image.url == image['src']:
                        is_current = True
                        break
                if not is_current:
                    story_image = StoryImage(story_id=story_id, image=image['src'], alt=image['alt']).save()

        return JsonResponse({'status': 'success'})

def editor_save_topics(request, story_id=None):
    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to access this page.')
        return redirect('app:sign_in')
    
    if story_id is None:
        return JsonResponse({'status': 'error', 'message': 'Story ID is required'}, status=400)
    
    story = Story.objects.get(id=story_id)
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        topics = data.get('topics')
        story.topics.set(Topic.objects.filter(id__in=topics))

        return JsonResponse({'status': 'success'})

def editor_delete_story(request, story_id=None):
    if not request.user.is_authenticated:    
        messages.error(request, 'You must be logged in to access this page.')
        return redirect('app:sign_in')
    
    if story_id is None:
        return JsonResponse({'status': 'error', 'message': 'Story ID is required'}, status=400)
    
    story = Story.objects.get(id=story_id)
    if request.method == 'POST':
        story.delete()
        return JsonResponse({'status': 'success'})

def about_us(request):
    return render(request, 'about-us.html')

def our_story(request):
    return render(request, 'our-story.html')

def for_readers(request):
    return render(request, 'for-readers.html')

def for_writers(request):
    return render(request, 'for-writers.html')