$(function () {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const jwtToken = getCookie('jwt_token');

    let showCommentViewBtn = $('.show-comment-view, .show-all-bookmarks, .show-who-to-follow')
    let commentView = $('.comments-view, .bookmarks-view, .who-to-follow, .edit-profile-card, .followers-and-contributors-card')
    let $current_user_id = $('body').data('current_user_id')
    let $story_id = $('.story-card').data('story_id')
    let $comment_container = $('.comments-container')
    let $share_comment_btn = $('.share-comment')

    const checkElementOverflowing = (el) => {

    }

    const commentCardSkeleton = () => {
        const html = `
            <article class="comment-card px-3 py-5 rounded-lg h-[175px] skeleton-parent skeleton-radius">
                <div class="profile container mx-auto px-5 sm:px-2 ">
                    <div class="flex items-center">
                        <div class="rounded-full h-[40px] w-[40px] object-cover skeleton">
                        </div>
                        <div class="ml-[15px]">
                            <div class="skeleton skeleton-radius">
                            </div>
                            <div class="px-20 mt-[4px] skeleton skeleton-radius">
                            </div>
                        </div>
                    </div>
                </div>
                <p class="comment-text text-sm mt-[10px] h-10 overflow-hidden skeleton skeleton-radius"></p>
                <div class="flex items-center justify-between mt-5">
                    <div class="flex items-center p-10 skeleton skeleton-radius">
                    </div>
                    <div class=" p-10 skeleton skeleton-radius">
                    </div>
                </div>
            </article>
        `

        $comment_container.append(html)
        $comment_container.append(html)
        return html

    }

    let hasFetchCommentsState = false
    $('body').on('click', '.show-comment-view, .show-all-bookmarks, .show-who-to-follow, .show-edit-profile-card-btn, .show-followers-card-btn', () => {
        if (!hasFetchCommentsState) {
            commentCardSkeleton()
            setTimeout(() => {
                fetchComments()
                hasFetchCommentsState = true
            }, 3000)
        }
        if (commentView.hasClass('is-hidden')) {
            $('.divider').addClass('bg-lightblue opacity-45').show()
            commentView.removeClass('md:-right-[100%] is-hidden -bottom-[100%]').addClass('-bottom-[20%] md:right-0')
            $('textarea').focus()

        } else {
            //commentView.removeClass('md:right-0').addClass('md:-right-[100%] md:-bottom-[100%] is-hidden')
        }
    })

    $('.divider, .separator').on('click', function () {
        commentView.removeClass('md:right-0 -bottom-[20%]').addClass('md:-right-[100%] md:-bottom-[100%] -bottom-[100%] is-hidden')
        $('.divider').hide()
        //hide showImages carousel in story.html
        $('.show-story-images-container').addClass('hidden');
    })

    $('.comment-textarea, .search-bookmarks-input').on('input', function () {
        if ($(this).val().length > 8) $('.share-comment, .search-bookmark ').removeAttr('disabled').removeClass('opacity-0')
        else $('.share-comment, .search-bookmark ').addClass('opacity-0').attr('disabled')
    })

    $('body').delegate('.view-more', 'click', function () {
        let $commentText = $($(this).parent()).find('.comment-text')
        const scrollHeight = $commentText.prop('scrollHeight')
        let commentHeight = $commentText.prop('clientHeight')

        console.log(scrollHeight)
        console.log(commentHeight)

        // double the height when view more is clicked
        if (commentHeight < scrollHeight) {
            $commentText.height(commentHeight + commentHeight);
        }
        // but ensuring that the height is equal the content height
        if (commentHeight >= scrollHeight) {
            $commentText.height(scrollHeight)
            $(this).hide()
        }
    })

    // function to replace button
    const replaceButton = ($target, $value) => {
        if (window.location.pathname.includes('/story') === true) {
            $target.replaceWith($value)
        }
    }

    // like comment
    $('body').on('click', '.comment-like-btn', (e) => {
        let $target = $(e.target)
        let $comment = $(e.target.closest('.comment-card'))
        const $comment_id = $comment.data('comment_id')

        // like the comment
        $.ajax({
            url: `http://192.168.236.220:4000/api/v1/comments/${$comment_id}/like/`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                // update like count and btn
                let $like_count = $comment.find('.comment-like-count')
                let likedBtn = '<button class="comment-like-btn comment-liked-btn"><img class="block active:bg-lightblue" src="/static/icons/liked.svg" alt=""></button>'
                let likeBtn = '<button class="comment-like-btn comment-like-btn-trans"><img class="block active:bg-lightblue" src="/static/icons/like.svg" alt=""/></button>'

                $target = $target.closest('button')
                $like_count.text(response.likes_count)  // update like count

                // update btn
                if ($target.hasClass('comment-like-btn-trans')) {
                    $target.replaceWith('<button class="comment-like-btn comment-liked-btn"><img class="block active:bg-lightblue" src="/static/icons/liked.svg" alt=""></button>')
                    replaceButton($target.siblings('.comment-like-btn'), likedBtn)
                } else {
                    $target.replaceWith('<button class="comment-like-btn comment-like-btn-trans"><img class="block active:bg-lightblue" src="/static/icons/like.svg" alt=""/></button>')
                    replaceButton($target.siblings('.comment-like-btn'), likeBtn)
                }
            }
        })
    })

    // share comment
    const $comment_form = $('.share-comment-form')
    $comment_form.on('submit', function (e) {
        e.preventDefault()

        console.log($comment_form.find('#comment-textarea'))

        comment_json = JSON.stringify({"comment": $comment_form.find('#comment-textarea').val()})

        $.ajax({
            type: "POST",
            url: `http://192.168.236.220:4000/api/v1/stories/${$story_id}/comments/`,
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                contentType: 'application/json'
            },
            data: comment_json,
            dataType: 'json',
            contentType: 'application/json',
            success: function (response) {
                fetchComments()
                $comment_form.find('#comment-textarea').val('')
            }
        });
    })
    
    // load comments
    let $comment = (comment, idx) => {
        return ( `
        <article class="comment-card ${comment.commenter.id == $current_user_id ? 'my-comment' : ''} rounded-lg p-4 ${idx % 2 == 0 ? 'bg-mediumpurple text-white' : 'bg-white text-lightgray' }" data-comment_id="${ comment.id }">
            <div class="profile container mx-auto px-5 sm:px-2 ">
            <div class="flex items-center">
                ${ 
                    comment.commenter.avatar == null
                    ? `<img class="rounded-full h-[30px] w-[30px] object-cover" src="https://picsum.photos/200/700" alt="">`
                    : `<img class="rounded-full h-[30px] w-[30px] object-cover" src="/uploads/${comment.commenter.avatar}/${comment.commenter.id}" alt="">`
 
                }
                <div class="ml-[15px]">
                    ${
                        $current_user_id != comment.commenter.id
                        ?`
                        <div class="flex gap-[5px] follow-card" data-user_id=${comment.commenter.id}>
                            <h3 class=" text-base">${comment.commenter.username}</h3>
                            ${console.log(comment.user_is_following_commenter),
                                comment.user_is_following_commenter == true
                                ? `<button class="follow text-sm flex items-center text-lightblue unfollow"><img src="/static/icons/correct.svg" alt="">Following</button>`
                                : `<button class="follow text-sm flex items-center text-lightblue"><img src="/static/icons/plus.svg" alt="">Follow</button>`
                            }
                        </div>
                        ` : `
                            <div class="flex gap-[5px] follow-card" data-user_id=${comment.commenter.id}>
                                <h3 class="">${comment.commenter.username}</h3>
                            </div>
                        `
                    }
                    
                    <div class="mt-[2px] flex gap-[5px] items-center">
                        <p class="text-xs">posted ${ moment(comment.created_at).fromNow()}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="relative px-4 isolate comment-text-container">
            <p class="comment-text text-sm mt-[10px] overflow-hidden focus:outline-0 focus:border-0 focus:border-b-2 focus:border-b-lightblue">${comment.comment}</p>
            <span class="span block text-white text-sm absolute bottom-0 right-0 z-10 px-1 rounded-md bg-lightblue cursor-pointer view-more">view more</span>
        </div>
        <div class="flex items-center justify-between pl-4">
            <div class="flex items-center">
                <p class="mt-3 text-sm comment-like-count">${comment.likes_count }</p>
                ${
                    comment.is_liked_by == true
                    ? `<button class="comment-like-btn comment-liked-btn"><img class="block active:bg-lightblue" src="/static/icons/liked.svg" alt=""/></button>`
                    : `<button class="comment-like-btn comment-like-btn-trans"><img class="block active:bg-lightblue" src="/static/icons/like.svg" alt=""/></button>`
                }
            </div>
            <div class="flex gap-3">
                ${
                    $current_user_id == comment.commenter.id ?
                    `<button class="update-comment-btn text-sm text-white bg-lightblue p-[2px] px-[4px] rounded-sm">update</button>
                    <button class="delete-comment-btn text-sm text-white p-[2px] px-[4px] rounded-sm bg-red-500">delete</button>` :
                    ''
                }
            </div>
        </div>
    </article>
    `)}

    // fetch comments based on sort-type (newest, relevant)
    const fetchComments = (type) => {
        let url = `http://192.168.236.220:4000/api/v1/stories/${$story_id}/comments/newest/`
        if (type) url = `http://192.168.236.220:4000/api/v1/stories/${$story_id}/comments/${type}/`
        //paginate
        //block the request if it is loading/request is in progress
        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                console.log(response)
                $comment_container.empty()
                response.forEach((comment, idx) => {
                    if (idx <= 5) {
                        $comment_container.append($comment(comment, idx))
                    }

                })
                $('.comments-count').text(
                    (
                        response.length == 1
                        ? (response.length + ' person ')
                        : (response.length) + ' people ') + 'has commented on this story'
                );
            }
        })
    }

    let $sort_comment_by_select = $('#sort-comment-by')

    $sort_comment_by_select.on('change', function () {
        let value = $sort_comment_by_select.val()
        let $response = {}

        if (value == 'relevants') fetchComments('relevant');

        if (value == 'newests') fetchComments();
        
    })

    // initially fetch the comments
    //fetchComments()

    // update comment
    $('body').on('click', '.update-comment-btn', (e) => {
        //update comment
        updateComment()
    })

    // save comment
    $('body').on('click', ' .save-comment-btn', (e) => {
        saveComment()
    })
    //delete comment
    $('body').on('click', '.delete-comment-btn', (e) => {
        deleteComment()
    })
    const updateComment = (target) => {
        const comment = $('.my-comment')
        console.log(comment)
        comment.attr('contenteditable', true).focus()
        $('.update-comment-btn').removeClass('update-comment-btn').addClass('save-comment-btn').html('Save')
    }

    //actually save the comment
    const saveComment = () => {
        const comment = $('.my-comment')
        const comment_id = comment.data('comment_id')
        const newCommentText = comment.text()

        $.ajax({
            url: `http://192.168.236.220:4000/api/v1/${comment_id}/`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            contentType: 'application/json',
            data: JSON.stringify({comment: newCommentText}),
            success: (response) => {
                comment.attr('contenteditable', true)
                $('.save-comment-btn').removeClass('save-comment-btn').addClass('update-comment-btn').html('Update')
            }
        })
    }

    // delete comment
    const deleteComment = () => {
        const comment = $('.my-comment')
        const comment_id = comment.data('comment_id')

        $.ajax({
            url: `http://192.168.236.220:4000/api/v1/${comment_id}`,
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                comment.remove()
            }
        })
    }
})
