from django.urls import path, reverse_lazy
from django.contrib.auth import views as auth_views
from .views import (
    first_home_page,
    sign_in,
    sign_out,
    join_us,
    old_story_view,
    like_story,
    unlike_story,
    comment,
    stories,
    story_view,
    story_review_status,
    build_story_detail,
    story_detail,
    about_us,
    our_story,
    for_readers,
    for_writers,
    subscribe,
    search,
    super_editor,
    super_editor_save,
    editor_save_images,
    editor_save_topics,
    editor_delete_story,
    CustomPasswordResetView
)

app_name = 'app'

urlpatterns = [
    path('', view=first_home_page, name='home'),
    path('sign_in', view=sign_in, name='sign_in'),
    path('sign_out', view=sign_out, name='sign_out'),

    path('join_us', view=join_us, name='join_us'),

    path('story/<str:story_id>', view=old_story_view, name='story'),
    path('story/<str:story_id>/like', view=like_story, name='like_story'),
    path('story/<str:story_id>/unlike', view=unlike_story, name='unlike_story'),
    path('stories', view=stories, name='stories'),
    path('story/<str:story_id>/review', view=story_review_status, name='story_review'),

    path('story_with_title/<str:story_title>', view=story_view,),
    path('<slug:slug>/<str:story_id>', view=build_story_detail, name='build_story_detail'),
    path('@<str:username>/<slug:slug>', view=story_detail, name='story_detail'),

    path('story/<str:story_id>/comment', view=comment, name='comment'),

    path('subscribe-to-newsletter', view=subscribe, name='subscribe'),

    path('search', view=search, name='search'),

    path('editor', view=super_editor, name='editor'),

    path('editor/<str:story_id>/save-images', view=editor_save_images, name='editor_save_images'),
    path('editor/<str:story_id>/save-topics', view=editor_save_topics, name='editor_save_topics'),

    path('editor/<str:story_id>/save', view=super_editor_save, name='super_editor_save'),
    path('editor/<str:story_id>/delete', view=editor_delete_story, name='editor_delete_story'),
    
    
    path('about-us', view=about_us, name='about-us'),
    path('our-story', view=our_story, name='our-story'),
    path('for-readers', view=for_readers, name='for-readers'),
    path('for-writers', view=for_writers, name='for-writers'),
    # Password reset URLs
    #path('password-reset/', 
    #     auth_views.PasswordResetView.as_view(template_name='user/password_reset.html'), 
    #     name='password_reset'),
    path('password-reset/', CustomPasswordResetView.as_view(template_name='user/password_reset.html'), name='password_reset'),
    path('password-reset/done/', 
         auth_views.PasswordResetDoneView.as_view(template_name='user/password_reset_done.html'), 
         name='password_reset_done'),
    path('reset/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(
                template_name='user/password_reset_confirm.html',
                success_url=reverse_lazy('app:password_reset_complete')
            ), 
            name='password_reset_confirm',
            ),
    path('reset/done/', 
         auth_views.PasswordResetCompleteView.as_view(template_name='user/password_reset_complete.html'), 
         name='password_reset_complete'),   
]