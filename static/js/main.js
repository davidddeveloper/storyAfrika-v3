$(function(){
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const jwtToken = getCookie('jwt_token');

    const checkToken = (response) => {
        if (response.status == 401) location.replace('/logout')
    }

    // delete temporary story
    // function to delete a story
    const delete_story = () => {
        if (localStorage.getItem('status') == 'updating') {
            localStorage.removeItem('story_id')
            localStorage.removeItem('status')
            return Promise.resolve()
        }
        const story_id = localStorage.getItem('story_id')
        return $.ajax({
            method: 'DELETE',
            url: `http://127.0.0.1:4000/api/v1/stories/${story_id}/`,
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            processData: false,
            contentType: false,
            success: function (response) {
                localStorage.removeItem('story_id')
            }
        })
    }

    // creating the carousel
    const slider = $('.slider');
    const sliderItems = $('.slider-item');
    const itemWidth = sliderItems.outerWidth(true); // includes margin
    //const totalItems = sliderItems.length;
    let startX = 0;
    let isDragging = false;

    const totalItems = ($current_slider) => {
        try { return $current_slider.find('.slider-item').length }
        catch { return 0}
    }

    function updateSliderPosition($current_slider) {
        $current_slider.css('transform', `translateX(${-$current_slider.data('current_index') * itemWidth}px)`); 
        if (currentIndex($current_slider) == 0) $('.prev').hide()
        if (currentIndex($current_slider) > 0) $('.prev').show()
        console.log(currentIndex($current_slider), totalItems($current_slider))
        if (currentIndex($current_slider) == totalItems($current_slider)) $('.next').hide()
        if (currentIndex($current_slider) < totalItems($current_slider)) $('.next').show()
    }

    function currentIndex ($current_slider) {
        return Number($($current_slider).data('current_index'))
    }

    function incrementCurrentIndex ($current_slider) {
        $($current_slider).data('current_index', $($current_slider).data('current_index') + 1);
    }

    function decrementCurrentIndex ($current_slider) {
        $($current_slider).data('current_index', $($current_slider).data('current_index') - 1);
    }

    $('.next').on('click', function(e) {
        let $current_slider = $(this).parent().find('.slider')
        if (currentIndex($current_slider) < totalItems($current_slider) + 1) {
            incrementCurrentIndex($current_slider)
            updateSliderPosition($current_slider)

            $('.prev').show()
        }
    });

    $('.prev').on('click', function(e) {
        let $current_slider = $(this).parent().find('.slider')
        if (currentIndex($current_slider) > 0) {
            decrementCurrentIndex($current_slider)
            updateSliderPosition($current_slider)
            
            $('.next').show()
        }
    });

    slider.on('touchstart', function (e) { 
        startX = e.originalEvent.touches[0].pageX // horizantal position of first touch in touches array of touch objects
        isDragging = true
    })

    slider.on('touchmove', function (e) {
        if (isDragging) {
            const currentX = e.originalEvent.touches[0].pageX
            const diff = startX - currentX

            if (diff > 30) { //swips left
                console.log(totalItems($(this)), currentIndex($(this)))
                if (currentIndex($(this)) < totalItems($(this)) + 2) {
                    incrementCurrentIndex($(this)) // increment current index
                    updateSliderPosition($(this))
                }
                isDragging = false
            } else if (diff < -30) { // swips right
                if (currentIndex($(this)) > 0) {
                    decrementCurrentIndex($(this)) // decrement current index
                    updateSliderPosition($(this))
                }
                isDragging = false
            }
        }
    })

    slider.on('touchend', function() {
        isDragging = false;
    });

    slider.on('mousedown', function(e) {
        startX = e.pageX
        isDragging = true
    })

    slider.on('mousemove', function(e) {
        if (isDragging) {
            const currentX = e.pageX
            const diff = startX - currentX
            slider.css({'user-select': 'none'})

            if (diff > 30) { // drag left
                if (currentIndex($(this)) < totalItems($(this)) + 1) {
                    incrementCurrentIndex($(this))
                    updateSliderPosition($(this))
                }
                isDragging = false
            } else if (diff < -30) { // drag right
                if (currentIndex($(this)) > 0) {
                    decrementCurrentIndex($(this))
                    updateSliderPosition($(this))
                }
                isDragging = false
            }
        }
    })

    slider.on('mouseup', function () {
        isDragging = false; slider.removeClass('dragging')
    })

    slider.on('mouseleave', function () {
        isDragging = false; slider.removeClass('dragging')
    })

    // load the state of a story text
    let $story_text_container = $('.story-story-text')
    const $story_id = $story_text_container.data('story_id')
    const removeSkeleton = (container) => {
        container.find('skeleton').remove()
    }
    const storyTextSkeleton = () => {
        $story_text_container.html('<div class="skeleton skeleton-radius"></div>')
        $story_text_container.append('<div class="my-5"></div>')
        $story_text_container.append('<div class="skeleton skeleton-radius"></div>')
        $story_text_container.append('<div class="my-5"></div>')
        $story_text_container.append('<div class="skeleton skeleton-radius"></div>')

    }

    storyTextSkeleton()

    setTimeout(() => {
        $.ajax({
            url: `http://127.0.0.1:4000/api/v1/stories/${$story_id}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                let content = ''
                removeSkeleton($story_text_container)
                JSON.parse(response.text).forEach(block => {
                    console.log(block.content)
                    try {
                        let temp = $(block.content).removeAttr('contenteditable')
                        content = content + temp[0].outerHTML;
                    }
                    catch {
                        content = block.content;
                    }
                })
                let $jcontent = $(`<div>${content}</div>`.replaceAll("⇅", "")).html();
                $story_text_container.html(`${$jcontent}`)
            }
        })
    }, 2000)
    

    // load stories when user scroll to the bottom
    const $current_user_id = $('body').data('current_user_id')
    const loadTextFormat = (text) => {
        try {
            let json_text = JSON.parse(text)
            let content = ''
            json_text.forEach(block => {
                content = content + block.content.replace("⇅", "")
            })
            let $jcontent = $(`<div>${content}</div>`).text()
            return $jcontent
        } catch (error) {
            let $jtext = $(`<div>${text}</div>`).text()
            return $jtext
        }
    }
    const getImage = (image, other_uri) => {
        if (!image) return image
        if (image.includes('fastly.picsum.photos')) return image
        return image
    }
    let $stories_container = $('.stories-container')
    let $story = (story) => {
        return (`
        <article class="shrink-0 story-card max-h-[350px] relative" data-story_id="${story.id}">
            <div class="flex w-[300px] items-center">
            <div class="profile flex items-center">
                <img class=" w-[40px] h-[40px] object-cover border-2 rounded-full" src="${story.writer.avatar}" alt="">
                <h2 class="ml-5 text-sm">${story.writer.username}</h2>
            </div>
            <div class="w-[10px] h-3 border-lightgray border-l ml-[14px] mr-[8px]"></div>
            <div class="time text-xs">
                ${
                    moment !== undefined ? moment(story.created_at).fromNow() : story.created_at
                      
                }
            </div>
            </div>
            <div class="flex justify-between gap-[25px]">
                <div class="mt-3 flex flex-col w-3/4">
                    <h3 class="font-medium text-lg home-story-title shrink-0" data-story_id="${story.id}"><a href="/story/${story.id}">${story.title}</a></h3>
                    <p class="shrink-0 mt-[10px] w-full max-w-[400px] overflow-x-hidden whitespace-normal overflow-ellipsis line-clamp-2 sm:w-[250px] md:w-[400px]">${loadTextFormat(story.text)}</p>
                </div>
                <div class="story-image self-center w-1/4">
                    <img class='w-full h-3/4 object-cover max-h-[130px]' src="${getImage(story.image, story.writer.id)}" alt="" srcset="">
                </div>
            </div>
            <div class="px-3 mt-[15px] flex items-center justify-between">
                <div class="flex items-center">
                    <div class="flex items-center">
                        <p class="mt-3 like-count">${story.likes_count}</p>
                        ${console.log(story.liked),
                            story.liked === true 
                              ? '<button class="like-btn liked-btn"><img class="block active:bg-lightblue" src="/static/icons/liked.svg" alt=""/></button>' 
                              : '<button class="like-btn like-btn-trans"><img class="block active:bg-lightblue" src="/static/icons/like.svg" alt=""/></button>'
                          }
                          
                        </div>
                    <div class="inline-block ml-5">
                        <p class="text-xs">${story.read_time} min read</p>
                    </div>
                </div>
                <div class="flex flex-row gap-2 justify-between items-center">
                <div class="bookmark">
                ${console.log(story.bookmarked),
                    story.bookmarked == true
                    ? `<button class="bookmark-btn unbookmark-btn"><img class='bookmark-img' src="/static/icons/bookmarked.svg" alt="" srcset=""></button>`
                    : `<button class="bookmark-btn"><img class='bookmark-img' src="/static/icons/bookmark.svg" alt="" srcset=""></button>`
                }
                </div>
                <div class="more-tools-main-container">
                    <button class="show-more-tools-btn">
                        <img class="" src="/static/icons/more.svg" alt=""/>
                    </button>
                    <div class="is-hidden more-tools overflow-hidden flex flex-col h-0 w-0 bg-offwhite rounded-xl shadow-xl transition-all absolute right-0 bottom-10 before:block before:absolute before:bg-offwhite before:w-[20px] before:h-[20px] before:-bottom-2 before:shadow-xl before:right-[10%] before:rotate-45">
                        <div class="p-3 pt-4">
                            ${
                                $current_user_id != story.writer.id
                                ? `<div class="flex gap-[15px] follow-card" data-user_id=${story.writer.id}>
                                        ${
                                            story.user_is_following_writer == true
                                            ? `<button class="follow flex items-center text-lightblue unfollow"><img src="/static/icons/correct.svg" alt="">Following</button>`
                                            : `<button class="follow flex items-center text-lightblue"><img src="/static/icons/plus.svg" alt="">Follow author</button>`
                                        }
                                    </div>`
                                : ''
                            }
                            <button class="text-lightgray block cursor-pointer hover:underline"><a href="/immersive_read/${story.id}" target="_blank">Read in immersive mode</a></button>
                        </div>
                        <hr class="border-black"/>
                        <div class="p-3 pt-4 login-user-actions-container">
                            <! -- append actions if user is login -->
                            ${
                                $current_user_id == story.writer.id
                                ? `<button class="update-story-btn block text-lightblue cursor-pointer hover:underline">Update story</button>
                                    <button class="delete-story-btn block text-red-500 cursor-pointer hover:underline">Delete story</button>`
                                : ''
                            }
                        </div>
                        }
                        
                    </div>
                </div>
                </div>
            </div>
        </article>
        <hr class="border-black">
    `)}

    /*$.get(`http://127.0.0.1:4000/api/v1/users/${$current_user_id}/following_stories/`, function ($response, $status) {
        if ($status == 'success') {
            $response.forEach(story_data => {
                $stories_container.append($story(story_data))
            })
            if (Object.keys($response).length === 0) {
                $response.html('<h1>Try following some people to see their post here</h1>')
            }
        }
    })*/

    const loadingIndicator = () => {
        const html = `
            <article class="loading-indicator shrink-0 story-card fade-in max-h-[350px] relative">
                <div class="flex w-[300px] items-center">
                    <div class="profile flex items-center">
                        <!-- image -->
                        <div class="w-[40px] h-[40px] object-cover border-2 rounded-full skeleton"></div>
                        <h2 class="ml-5 text-sm py-3 px-10 skeleton skeleton-radius"></h2>
                    </div>
                </div>
                <div class="flex justify-between gap-[25px]">
                    <div class="mt-3 flex flex-col w-3/4">
                        <h3 class="shrink-0 skeleton skeleton-radius"></h3>
                        <p class="shrink-0 mt-[10px] w-full max-w-[400px] sm:w-[250px] md:w-[400px] skeleton skeleton-radius h-20"></p>
                    </div>
                    <div class="story-image self-center w-1/4 h-20 skeleton skeleton-radius">
                        <!-- image -->
                    </div>
                </div>
                <div class="px-3 mt-[15px] flex items-center justify-between">
                    <div class="flex items-center skeleton skeleton-radius w-2/5">
                    </div>
                    <div class="flex flex-row gap-2 justify-between items-center skeleton skeleton-radius w-2/12">
                    </div>
                </div>
            </article>
            <hr class="loading-indicator skeleton skeleton-divider skeleton-radius fade-in">
        `
        $stories_container.append(html)
        $stories_container.append(html)
    }

    const removeLoadingIndicator = () => {
        $stories_container.find('.loading-indicator').remove()
    }

    // load data when the user scrolls to the bottom
    let page = 1;
    const perPage = 8;
    let loading = false;

    function fetchStories(url, new_tab, method, data={}) {
        if (loading) return;
        loading = true
        let $url = `http://127.0.0.1:4000/api/v1/topics/foryou_stories?page=${page}&per_page=${perPage}`
        if (url) {
            $url = url
        }

        if (!new_tab) {
            loadingIndicator()
            console.log($stories_container)
        }
        setTimeout(() => {
            $.ajax({
                url: $url,
                method: 'POST' ? method : 'GET',
                data: JSON.stringify(data),
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                },
                success: (response) => {
                    console.log('ap------', response);
                    checkToken(response)
                    if (new_tab) $stories_container.empty()
                    
                    removeLoadingIndicator()
                    response.stories.forEach($story_data => {
                        $stories_container.append($story($story_data))
                    })
                    if (response.stories.length === 0) {
                        $stories_container.html('<h1>Try following some people to see their post here</h1>')
                        if (new_tab) $stories_container.html("<h1>There aren't any story yet for this topic</h1>")
                    }
                    if (page < response.total_pages) {
                        page++;
                        loading = false
                    } else {
                        $('.stories-container').off('scroll', handleScroll);
                    }
    
                    showMoreTools()
                },
                error: (err) => {
                    console.log('ap----', err)
                    $stories_container.html('<h1>Failed to load data</h1>')
                    loading = false;
                    checkToken(err)
                }
            })
        }, 2000)
        
    }

    const skeleton = () => {
        const html = `
            <article class="shrink-0 story-card fade-in max-h-[350px] relative">
                <div class="flex w-[300px] items-center">
                    <div class="profile flex items-center">
                        <!-- image -->
                        <div class="w-[40px] h-[40px] object-cover border-2 rounded-full skeleton"></div>
                        <h2 class="ml-5 text-sm py-3 px-10 skeleton skeleton-radius"></h2>
                    </div>
                </div>
                <div class="flex justify-between gap-[25px]">
                    <div class="mt-3 flex flex-col w-3/4">
                        <h3 class="shrink-0 skeleton skeleton-radius"></h3>
                        <p class="shrink-0 mt-[10px] w-full max-w-[400px] sm:w-[250px] md:w-[400px] skeleton skeleton-radius h-20"></p>
                    </div>
                    <div class="story-image self-center w-1/4 h-20 skeleton skeleton-radius">
                        <!-- image -->
                    </div>
                </div>
                <div class="px-3 mt-[15px] flex items-center justify-between">
                    <div class="flex items-center skeleton skeleton-radius w-2/5">
                    </div>
                    <div class="flex flex-row gap-2 justify-between items-center skeleton skeleton-radius w-2/12">
                    </div>
                </div>
            </article>
            <hr class="skeleton skeleton-divider skeleton-radius fade-in">

        `

        /** append three times */
        $stories_container.html(html)
        $stories_container.append(html)
        $stories_container.append(html)
    }

    function handleScroll(url) {
        let container = $('.stories-container');
        let height = container.outerHeight();  // Use outerHeight for better accuracy
        let scrollTop = container.scrollTop();
        let scrollHeight = container.prop('scrollHeight');
        
        // Adding a buffer to handle floating-point precision issues
        let buffer = 10;  // Pixels to account for rounding issues
    
        // Check if scrolled near the bottom
        if (height + scrollTop >= scrollHeight - buffer) {
            if (localStorage.getItem('story_id')) {
                delete_story();  // Ensure this function exists
            }
            if (window.location.pathname === '/') {
                fetchStories();  // Fetch stories only on the homepage
            }
            if (window.location.pathname.includes('/profile/')) {
                if (url) {
                    console.log('we are here', url)
                    fetchStories(url);
                }
            }
            if (location.pathname.includes('/search')) {
                const value = $('.input-to-search').val()
                fetchStories(url, true, 'POST', {data: value})
            }
        }
    }

    if (!window.location.pathname.includes === '/profile/') {
        $('.stories-container').scroll(handleScroll);

    }
    // initially fetch foryou story on the story on homepage
    if (window.location.pathname === '/') {
        if (localStorage.getItem('story_id')) delete_story().then(() => fetchStories());  // only on home
        fetchStories(undefined, true)
    }

    // get stories for a particular topic
    $('.topic-btn').on('click', function () {
        let topic_id = $(this).data('topic_id')
        console.log(topic_id)

        $('.topic-btn, .for-you, .following').removeClass('border-b')
        $(this).addClass('border-b')
        loading = false;
        skeleton()
        fetchStories(`http://127.0.0.1:4000/api/v1/topics/${topic_id}/stories?page=${page}&per_page=${perPage}`, true)
    })

    $('.following').on('click', function () {
        page = 1 // reset page
    
        loading = false;
        $('.topic-btn, .for-you').removeClass('border-b')
        $stories_container.empty()
        skeleton()
        $(this).addClass('border-b')
        fetchStories(`http://127.0.0.1:4000/api/v1/users/following_stories?page=${page}&per_page=${perPage}`, true)
    })

    $('.for-you').on('click', function () {
        page = 1 // reset page

        loading = false;
        $('.topic-btn, .following').removeClass('border-b')
        $stories_container.empty()
        skeleton()
        $(this).addClass('border-b')
        fetchStories(undefined, true)
    })

    const replaceButton = ($target, $value) => {
        if (window.location.pathname.includes('/story') === true) {
            $target.replaceWith($value)
        }
    }

    const story_and_user_id = ($story) => {
        let current_user_id = $('body').data('current_user_id')
        let story_id = $story.data('story_id')

        return [current_user_id, story_id]
    }

    // interactions - like bookmark
    $('body').on('click', '.like-btn', (e) => {
        let $target = $(e.target)
        let $story = $(e.target.closest('.story-card'))
        let [$current_user_id, $story_id] = story_and_user_id($story)

        $.ajax({
            url: `http://127.0.0.1:4000/api/v1/stories/${$story_id}/like/`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                // update like count and btn
                let $like_count = $story.find('.like-count')
                let likedBtn = '<button class="like-btn liked-btn"><img class="block active:bg-lightblue" src="/static/icons/liked.svg" alt=""></button>'
                let likeBtn = '<button class="like-btn like-btn-trans"><img class="block active:bg-lightblue" src="/static/icons/like.svg" alt=""/></button>'

                $target = $target.closest('button')
                $like_count.text(response.likes_count)  // update like count

                // update btn
                if ($target.hasClass('like-btn-trans')) {
                    $target.replaceWith('<button class="like-btn liked-btn"><img class="block active:bg-lightblue" src="/static/icons/liked.svg" alt=""></button>')
                    replaceButton($('.like-btn'), likedBtn)
                } else {
                    $target.replaceWith('<button class="like-btn like-btn-trans"><img class="block active:bg-lightblue" src="/static/icons/like.svg" alt=""/></button>')
                    replaceButton($('.like-btn'), likeBtn)
                }
            }
        })
        
    })

    //follow user or unfollow user
    $('body').delegate('.follow', 'click', function () {
        let $target = $(this)
        let user_id = $target.closest('.follow-card').data('user_id')
        $.ajax({
            url: `http://127.0.0.1:4000/api/v1/users/follow/${user_id}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                console.log(response)
                if ($target.hasClass('unfollow')) $target.html('<img src="/static/icons/plus.svg" alt="">Follow').removeClass('unfollow')
                else $target.html('<img src="/static/icons/correct.svg" alt="">Following').addClass('unfollow')
            }
        })
    })

    // bookmark a story

    $('body').on('click', '.bookmark-btn', function () {
        let $target = $(this)
        let story_id = $target.closest('.story-card').data('story_id')
        $.ajax({
            url: `http://127.0.0.1:4000/api/v1/stories/${story_id}/bookmark/`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: () => {
                let bookmarkBtn = `<button class="bookmark-btn"><img class='bookmark-img' src="/static/icons/bookmark.svg" alt="" srcset=""></button>`
                let bookmarkedBtn = `<button class="bookmark-btn unbookmark-btn"><img class='bookmark-img' src="/static/icons/bookmarked.svg" alt="" srcset=""></button>`

                console.log($target)
                if ($target.hasClass('unbookmark-btn')) {
                    $target.html(`<img class='bookmark-img' src="/static/icons/bookmark.svg" alt="" srcset="">`).removeClass('unbookmark-btn')
                    replaceButton($('.bookmark-btn'), bookmarkBtn)
                }
                else {
                    $target.html(`<img class='bookmark-img' src="/static/icons/bookmarked.svg" alt="" srcset="">`).addClass('unbookmark-btn')
                    replaceButton($('.bookmark-btn'), bookmarkedBtn)
                }
            }
        })
    })

    // search stories in bookmark
    let bookmarkSearchInput = $('.search-bookmarks-input')
    let bookmarksContainer = $('.bookmarks-container')
    $('.show-all-bookmarks').on('click', function () {
        bookmarkSearchInput.focus()
    })

    let bookmarkCard = (story, idx) => {
        return `
            <article class="comment-card rounded-lg p-4 ${idx % 2 == 0 ? 'bg-mediumpurple text-white' : 'bg-white text-lightgray' }" data-story_id=${story.id}>
                <div class="profile container mx-auto px-5 sm:px-2 ">
                    <div class="mt-[2px] flex gap-[5px] items-center">
                        <p class="text-xs mb-2">posted ${ moment(story.created_at).fromNow()} by</p>
                    </div>
                    <div class="flex items-center">
                        ${ story.writer.avatar
                            ? `<img class="rounded-full h-[40px] w-[40px] object-cover" src="/uploads/${story.writer.avatar}/{{story.writer.id}}/" alt="">`
                            : `<img class="rounded-full h-[40px] w-[40px] object-cover" src="https://picsum.photos/200/700" alt="">`
                        }

                        <div class="ml-[15px]">
                            <div class="flex gap-[5px] follow-card" data-user_id="${story.writer.id}">
                                <h3 class="">${story.writer.username}</h3>
                                ${ story.user_is_following_writer == true 
                                    ? `<button class="follow flex items-center text-lightblue unfollow"><img src="/static/icons/correct.svg" alt="">Following</button>`
                                    : `<button class="follow flex items-center text-lightblue"><img src="/static/icons/plus.svg" alt="">Follow</button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="">
                    <h3 class="comment-text text-base mt-[5px] ml-[50px] h-10"><a href="/story/${story.id}">${story.title}</a></h3>
                </div>
            </article>
        `
    }

    $('.search-bookmark-form').on('submit', function (e) {
        e.preventDefault()
        let searchData = bookmarkSearchInput.val()
        $.ajax({
            url: `http://127.0.0.1:4000/api/v1/search_bookmarked_stories?data=${searchData}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                console.log(response)
                bookmarksContainer.empty()
                response.forEach((story, idx) => {
                    bookmarksContainer.append(bookmarkCard(story, idx))
                })

                if (response.length == 0) {
                    bookmarksContainer.append(`<article class="rounded-lg p-4 bg-mediumpurple text-white">Oh oh, looks like you haven\'t bookmarked that yet.</article>`)
                }
            }
        })
    })


    //login user profile card functionality - change avatar/image
    // also used by text-editor
    let $profile_image_container = $('.change-img-button-container');
    $profile_image_container.on('mouseenter', () => {
        $(this).find('.image-btn-change').show(100)
        $(this).find('.generate-random-image').show()
    }).on('mouseleave', () => {
        $(this).find('.image-btn-change').hide()
        $(this).find('.generate-random-image').hide()
    })

    let $change_profile_image_btn = $('.image-btn-change')
    $change_profile_image_btn.on('click', () => {
        $(this).find('#file-input-field').click()

    })

    $('#file-input-field').change(function () {
        let file = this.files[0]
        if (file) {
            let form_data = new FormData()
            form_data.append('file', file)
            if (localStorage.getItem('story_id')) form_data.append('story_id', localStorage.getItem('story_id'))
            //form_data.append('csrf_token', $('#csrfToken').val())

            const getUrl = () => {
                if (window.location.pathname == '/') {
                    return `/users/upload_avatar/`
                } else if (window.location.pathname.includes('/profile/')) {
                    return '/users/upload_avatar'
                } else {
                    return `/stories/${localStorage.getItem('story_id')}/upload_image/`
                }
            }
            $.ajax({
                method: 'POST',
                url: `http://127.0.0.1:4000/api/v1${getUrl()}`,
                headers: {
                    Authorization: `Bearer ${jwtToken}`
                },
                data: form_data,
                processData: false,
                contentType: false,
                success: function(response) {
                    console.log('this is the response', response)
                    if (window.location.pathname == '/story/write/' ||
                        window.location.pathname == '/story/write'
                    ) {
                        //$('#story-image').attr('src', `/uploads/${file.name.replaceAll(" ", "_")}/${$current_user_id}`)
                        $('#story-image').attr('src', response.image)

                    } else if (window.location.pathname == '/') {

                        $('.profile-image').attr('src', response.image)
                        //$('.profile-image').attr('src', `/uploads/${file.name.replaceAll(" ", "_")}/${$current_user_id}`)
                        //$('.home-profile-img').attr('src', `/uploads/${file.name.replaceAll(" ", "_")}`)

                    } else if (window.location.pathname.includes('/profile/')) {
                        $('.profile-image').attr('src', response.avatar)
                    }
                    //if (!response.includes('/story/write/')) window.location.reload()
                },
                error: function(error) {
                    console.error('Error:', error);
                    //window.location.reload()
                }
            })
        }
    })

    $('.remove-profile-image').on('click', function () {
        $.ajax({
            method: 'POST',
            url: `http://127.0.0.1:4000/api/v1/users/upload_avatar/default`,
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            processData: false,
            contentType: false,
            success: function(response) {
                $('.profile-image').attr('src', response.avatar)
            }
        })
    })


    // show profile card on profile-image click
    $('.home-profile-img').on('click', function () {
        //$('.profile-card-shadow').show()
        //$('.profile-card').removeClass('-top-[100%] hidden').addClass('flex flex-col-reverse md:flex-row top-[10%] sm:top-[20%]')
        $(this).closest('section').find('.new-profile-card').toggle()
    })

    $('.profile-card-shadow').on('click', function () {
        $('.profile-card-shadow').hide()
        $('.profile-card').addClass('-top-[100%] hidden').removeClass('sm:top-[20%]').removeClass('top-[10%]')
    })

    // show more tools
    const showMoreTools = () => {

        const showTool = (target) => {
            // hide all tool except the selected one
            $('.more-tools').addClass('h-0 w-0 is-hiddden overflow-hidden') 
            target.removeClass('h-0 w-0 is-hidden overflow-hidden') 
        }
        const hideTool = (target) => {
            target.addClass('h-0 w-0 is-hidden overflow-hidden');
        }

        let moreToolBtn = $('.show-more-tools-btn')
        moreToolBtn.on('click', function (e) {
            console.log('yeah!')
            let parent = $(e.target).parent().parent();
            let moreTool = parent.find('.more-tools');

            if (moreTool.hasClass('is-hidden')) {
                showTool(moreTool)
            }
            else {
                hideTool(moreTool)
            }
        })

        // handle deleting story
        let card = $('.confirm-story-deletion')
        let divider = $('.home-divider')
        let story_id = ''
        $('.delete-story-btn').on('click', function () {
            story_id = $(this).closest('.story-card').data('story_id')

            if (card.hasClass('is-hidden')) {
                card.addClass('top-0 sm:top-2/4').removeClass('is-hidden')
                divider.show()
            } else {
                card.removeClass('top-0 sm:top-2/4').addClass('is-hidden')
                divider.hide()
            }
        })

        //view image on story
        $('.view-story-image').on('click', () => {
            $(this).addClass('block absolute').removeClass('w-full h-full').focus()
        })

        // hide divider and card when divider is clicked
        divider.on('click', function () {
            divider.hide()
            card.removeClass('top-0 sm:top-2/4').addClass('is-hidden')
        })

        // hide divider and card when cancel is cicked
        $('.confirm-delete-cancel').on('click', function () {
            divider.hide()
            card.removeClass('top-0 sm:top-2/4').addClass('is-hidden')
        })

        // delete story with yes
        $('.confirm-delete-yes').on('click', function () {
            localStorage.setItem('story_id', story_id) // add story_id to localstorage so delete_story would work
            // get the id of story previously added to localstorage
            if (localStorage.getItem('story_id')) delete_story().then(response => {
                localStorage.removeItem('story_id')
                if (response.status === 'Deleted') window.location.replace('/');
            });
        })

        //handle update story
        $('body').delegate('.update-story-btn', 'click', function () {
            story_id = $(this).closest('.story-card').data('story_id') // get story id
            localStorage.setItem('story_id', story_id)
            localStorage.setItem('status', 'updating')
            // if story_id was added successfully to localstorage redirect to update page
            if (localStorage.getItem('story_id')) window.location.assign('/story/write/');
        })

    }

    const editAbout = () => {
        const container = $('.profile-about-text, .topic-about-text')
        console.log('clicked and is editing lol')
        container.attr('contenteditable', 'true')
        console.log(container)
    }

    // fetching stories for profile / topic
    $('.profile-stories-btn, .topic-stories-btn, .profile-bookmarks-btn, .profile-likes-btn, .profile-about-btn, .topic-about-btn, .search-stories-btn, .search-people-btn, .search-topics-btn').on('click', function () {

        const target = $(this).closest('nav');
        let $url;
        let topic_id = target.data('topic_id')
        let editBtn = $(`<button class='text-lightblue' >Edit</button>`)
        const handleEditBtn = () => {
            editBtn.on('click', function () {
                if ($(this).text() === 'Edit') {
                    editAbout()
                }
                // saving

            })
            $(this).text('Save');
        }

        if (target.hasClass('profile-nav')) { // for profile
            $url = `http://127.0.0.1:4000/api/v1/users/stories?page=${page}&per_page=${perPage}`

            if ($(this).hasClass('profile-bookmarks-btn')) $url = `http://127.0.0.1:4000/api/v1/users/bookmarks?page=${page}&per_page=${perPage}`
            if ($(this).hasClass('profile-likes-btn')) $url = `http://127.0.0.1:4000/api/v1/users/likes?page=${page}&per_page=${perPage}`

            if ($(this).hasClass('profile-about-btn')) {
                $('.stories-container').empty().append(`<article class="topic-about-container relative mx-auto md:px-0 md:w-[500px]">${$('.topic-about-container').html()}</article>`)
                $('.profile-stories-container .topic-about-container').show()
                $('.edit-topic-about-text-btn').on('click', function (e) {
                    if ($(e.target).text() == 'Edit') { // if edit btn is clicked
                        $('.profile-about-text').attr('contenteditable', true).focus().addClass("border-2 focus:outline-lightblue focus:border-lightblue") // change the p tag to editable
                        $(e.target).text('Save')  // change to save
                    } else if ($(e.target).text() == 'Save') {  // if save btn is clicked
                        $('.about-input').val($('.profile-about-text').text())  // set the hidden input val to the editable text
                        $('.edit-profile-about-submit-btn').click()  // finally submit the form
                    }
                })
                return
            }
            
        } else if (target.hasClass('search-nav')) { // for search
            $url = `http://127.0.0.1:4000/api/v1/search?search=stories&page=${page}&per_page=${perPage}`
            if ($(this).hasClass('search-people-btn')) $url = `http://127.0.0.1:4000/api/v1/search?search=users&page=${page}&per_page=${perPage}`
            if ($(this).hasClass('search-topics-btn')) $url = `http://127.0.0.1:4000/api/v1/search?search=topics&page=${page}&per_page=${perPage}`
        } else { // for topic
            $url = `http://127.0.0.1:4000/api/v1/topics/${topic_id}/stories?page=${page}&per_page=${perPage}`
            if ($(this).hasClass('topic-about-btn')) {
                $('.stories-container').empty().append(`<p class="text-xl">${$('.topic-about-text').text()}</p>`)
                $('.stories-container').append(editBtn)
                handleEditBtn()
                return
            }
        }

        console.log($url)
        $('.stories-container').empty()
        loadingIndicator()
        loading = false;
        
        if (location.pathname.includes('/search')) {
            const value = $('.input-to-search').val()
            fetchStories($url, true, 'POST', {data: value})
        }
        else fetchStories($url, true);

        $('.stories-container').scroll((e) => {
            handleScroll($url);
        });
    })

    // story view
    if (window.location.pathname.includes('/story/')) showMoreTools()

    // a divider is a nice bg that separates fixed or absolute card from the body
    const showDivider = () => {
        
    }

    // show menu on mobile
    const showMenuBtn = $('.show-menu-on-mobile')
    showMenuBtn.on('click', () => {
        // show and also add eventlistener to hide
        $('.first-divider').removeClass('-left-[100%]').addClass('left-0').on('click', function () {
            $(this).removeClass('left-0').addClass('-left-[100%]')
            $('.menu').removeClass('left-0').addClass('-left-[100%]')
        })

        $('.menu').removeClass('-left-[100%]').addClass('left-0')
    })

    //show images in story when initial image is clicked
    //initial hide view-image
    $('.show-story-images-container').addClass('hidden')

    let viewImages = $('.view-image');
    viewImages.each((idx, img) => {
        let image = $(img);
        let storyImagesContainer = $('.show-story-images-container');
        image.on('click', function () {
            if (storyImagesContainer.hasClass('hidden')) {
                storyImagesContainer.removeClass('hidden');
                $('.divider').addClass('bg-offset opacity-45').show();
            } else {
                storyImagesContainer.addClass('hidden');
            }
        })

        storyImagesContainer.on('click', function (e) {
            let target = $(e.target)
            console.log(target)
            if (target.hasClass('story-wrapper')) {
                return;
            } else if (target.hasClass('next')) {
                return;
            } else if (target.hasClass('prev')) {
                return;
            } else if (e.target.localName === 'img') {
                console.log(e.target.className)
                return;
            } else {
                $('.divider').click()
            }
        })
    })
})