$(function () {

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const jwtToken = getCookie('jwt_token');

    let $body = $('body')
    let $currentBlock = $('.block').first()
    let $story = {}
    $currentBlock.focus()

    // create a temporary story in database
    if (!localStorage.getItem('story_id')) {
        $.ajax({
            url: 'http://192.168.236.220:4000/api/v1/stories/',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            data: JSON.stringify({"title": " ", "text": '[{"content":"<div class=\'block\' contenteditable=\'true\'><span class=\'handle\' style=\'display: none;\'>⇅</span></div>"}]'}),
            dataType: 'json',
            contentType: 'application/json',
            success: function (response) {
                localStorage.setItem('story_id', response.id)
                $story = response;

                // initially set a random image
                setRandomStoryImage($('#story-image'))
            }
        })
    }
    console.log($story, 'this is the temp story')

    // generate random image
    const generateImage = () => {
        // generage random image from unsplash
        return fetch('https://picsum.photos/800/500')
    }

    const setRandomStoryImage = (img) => {
        generateImage().then((response) => {
            img.attr('src', response.url)
            saveBlocks()
        })
    }

    // set a random image when a random image button is clicked
    $('.generate-random-image').on('click', () => {
        setRandomStoryImage($('#story-image'))
        saveBlocks()
    })

    // save state of block
    const saveBlocks = () => {
        const blocks = [];
        const topics = $('#topics-selected').val()
        const image = $('#story-image').attr('src')

        $('.block').each(function() {
            console.log((this).innerText)
            let text = $(this).text().replaceAll(' ', '').replaceAll('⇅', '')
          if (text === '') {
            blocks.push({ content: '<br />'})
          } else blocks.push({ content: `${$(this)[0].outerHTML}` });
        });
        
        //localStorage.setItem('blocks', JSON.stringify(blocks));
        let $story_id = localStorage.getItem('story_id')
        // get the story
        console.log($story)
        $story.title = $('#title').val() === '' ? 'random title' : $('#title').val()
        $story.text = JSON.stringify(blocks)
        $story.topics = topics
        $story.image = image
        $.ajax({
            url: `http://192.168.236.220:4000/api/v1/stories/${$story_id}/`,
            method: "PUT",
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            data: JSON.stringify($story),
            dataType: "json",
            contentType: "application/json",
            success: function (response) {
                console.log(response, 'saved to db')
            }
        });
    }

    // Load blocks from db
    const loadBlocks = () => {
        let $story_id = localStorage.getItem('story_id')
        //get the state of the story
        $.ajax({
            url: `http://192.168.236.220:4000/api/v1/stories/${$story_id}/`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`
            },
            success: (response) => {
                console.log(response)
                const blocks = JSON.parse(response.text) || [];
                const $container = $('#blocks-container');

                // update the story image
                $('#story-image').attr('src', response.image)
                console.log(blocks, 'alx')
                $container.empty();
                blocks.forEach(block => {
                    const $block = $(`<div class="block" contenteditable="true">${$(block.content).html()}</div>`);
                    //$block.html(block.content);
                    $container.append(
                        block.content === '<br />'
                        ? `<div class="block" contenteditable="true"><span class="handle" style="display: none;">⇅</span></div>`
                        : block.content
                    )
                });
                $('.story-title-input').val(response.title);
        
                //show enable publish button when val is in input
                if ($('.story-title-input').val().length > 8) $('.publish').removeAttr('disabled').removeClass('opacity-55')

                //automatically select the selected topics when the using is editing story
                if (localStorage.getItem('status') === 'updating') {
                    const topicsContainer = $(".select-topics-container");

                    const options = topicsContainer.find('option')

                    options.each((idx, opt) => {
                        let option = $(opt);
                        response.topics.forEach(topic => {
                            console.log(topic.name, option.text())
                            if (topic.name === option.text()) {
                                console.log("Yes!");
                                option.attr('selected', 'true')
                            }
                        })
                    })
                }

            }
        })
        
        //makeBlocksSortable();
    };

    loadBlocks()

    //inserts a new block or delete a block
    $(document).on('keydown', '.block', function (e) {
        $(this).focus()
        //inserts a new block on enter key
        if (e.key === 'Enter') {
            saveBlocks()
            e.preventDefault()
            let $newBlock = $('<div contenteditable=true class="block"><span class="handle">⇅</span></div>')
            $(this).after($newBlock)
            $newBlock.focus()
            $currentBlock = $newBlock
        }

        // change focus on arrowup
        else if (e.key === 'ArrowUp' && $(this).prev('.block').length) {
            $(this).prev('.block').focus()
        }

        // change focus on arrowdown
        else if (e.key === 'ArrowDown' && $(this).next('.block').length) {
            $(this).next('.block').focus()
        }

       
        else if (e.key === '/' && $(this).text().replace("⇅", "").length === 0 ) {
            let $position = $(this).offset()
            
            $("#toolbar").css({
                top: $position.top - window.screenY - $(this).outerHeight() - 90,
                left: $position.left - 120
            }).show()
        }

        //delete a block on enter key
        if (e.key === 'Backspace' && $(this).text().trim() === "") {
            saveBlocks()
            if ($(this).prev('.block').length) {
                $(this).prev('.block').focus()
                $(this).remove()

                $currentBlock = $(this).prev('.block')
            }
            else if ($(this).next('.block').length) {
                $(this).next().focus()
                $(this).remove()

                $currentBlock = $(this).next('.block')
            }
        }

        // hide toolbar when typing
        if (e.key !== '/')
        {
            $("#toolbar").hide()
        }

        // hide handlers
        $(this).find('.handle').hide()
    })

    //show toolbar on select
    $(document).on("mouseup", '.block', function (e) {
        $(this).find('.handle').hide() // hide the handlers
        $('#toolbar').hide()
        $(this).focus()
        let $toolbar = $("#toolbar")
        let $selection = window.getSelection()
        let $range = $selection.getRangeAt(0)
        let $rect = $range.getBoundingClientRect()
       
        let $selectedText = $selection.toString()
        if ($selectedText) {
            $toolbar.css({
                top: window.scrollY + $rect.top - $toolbar.outerHeight() - 90,
                left: $rect.left - 120
            }).show()
        } else {
            console.log('xzy')
            $toolbar.hide()
        }
        console.log($rect.left, '0000')
        $currentBlock = $($selection.anchorNode).closest('.block');
    })

    //focus on block
    $(document).on("click", '.block', function (e) {
        $(this).focus()
    })

    // add the formating using execCommand
    $.each($("#formatting button"), function (key, button) {
        button.addEventListener("click", function (e) {
            document.execCommand($(this).data('format'))
            saveBlocks()
        })
    })

   //show block type
   $("#type button.type-btn").on('click', function () {
    $('.types').toggle()
    
   })
   //show ai actions
   //initially hide it
   $("#ai .ai-solutions").hide()
   $("#ai .ask-ai-btn").on('click', function () {
    $('.ai-solutions').toggle()
    
   })

    // create block type
   $(document).delegate('#types button', 'click', function (e) {
    
    switch ($(this).data('format')) {
        case "h1":
            constructBlock('h1', $currentBlock, $css={'font-size': '24px'})
            break;
        
        case "h2":
            constructBlock('h2', $currentBlock, $css={'font-size': '18px'})
            break;
        
        case "text":
            constructBlock('text', $currentBlock)
            break;
        
        case "p":
            constructBlock('p', $currentBlock, $css={'text-indent': '20px'})
            break;
        
        default:
            break;
    }

    // helper function
    function constructBlock ($tag, $block, $css=null) {
        $block = $(`<${$tag == 'text' ? 'p' : $tag} contenteditable=true class="block"><span class="handle" contenteditable="false">⇅</span>${$block.text() !== '/' ? $block.text().replace("⇅", "") : ''}</${$tag == 'text' ? 'p' : $tag}>`)

        if ($css) $block.css($css);

        $currentBlock.replaceWith($block)

        $currentBlock = $block
        $currentBlock.focus()
        if ($tag == 'p') {
            $currentBlock.find('.handle').css({
                "left": "-35px"
            })
        }
    }

    //hide types tools
    console.log($(this).closest('.types'))
    $(this).closest('.types').hide()
   })

   // use gemini for assistive writing
   const actionButtons = $(".ai-solutions button");
   actionButtons.on('click', function () {
    const target = $(this);
    const content = $currentBlock.text().replaceAll("⇅", "");
    const action = $(this).text().toLowerCase().replaceAll(" ", "-");
    const url = `http://192.168.236.220:4000/api/v1/ai_assistive_writing?ask-ai=${action}&text=${content}`;

    //make api call to server
    $.ajax({
        type: "GET",
        url: url,
        headers: {
            Authorization: `Bearer ${jwtToken}`
        },
        success: function (response) {
            console.log(response)
            $currentBlock.html(`<span class="handle" contenteditable="false">⇅</span>${response.response}`)
        },
        error: function (error) {
            console.log(error.responseJSON)
        }

    })
    //receive data

    //insert the data
   })

    // make block draggable
    // Initialize sortable for the editor container
    const makeBlocksSortable = () => {
        $('#blocks-container').sortable({
            handle: '.handle',
            axis: 'y',
            containment: '#blocks-container'
        }
        // axis: 'y' only on x if not specified draggable everywhere
        );
    }
    makeBlocksSortable()

    // show handle on block hover
    $(document).on('mouseenter', '.block', function () {
        $(this).find('.handle').show()
    })

    $(document).on('mouseleave', '.block', function (event) {
        $(this).find('.handle').hide();
        /*if ($handle.is(":hover")) {
            // pass
        } else {
            $handle.hide()
        }
        $handle.mouseenter(function () { 
            //do noting
        }).mouseleave(function() {
            $handle.hide()
        })*/
    })

    $(document).on('mouseenter', '.handle', function (event) {
        $(this).show()
    })

    // load blocks
    /*if (localStorage.getItem('story_id')) {
        loadBlocks()
    }*/

   // miscellaneous - hide all popups
   $("#toolbar").hide()
   $(".types").hide()
   $(".handle").hide()
   
   $(document).on('click', function () {
       let $selection = window.getSelection()
       let $block = $(":focus")
       if ($selection.toString() === "" && $block.text().length === 0) {

           $("#toolbar").hide()
           $('.types').hide()
       }
   })

   //preventing the user from leaving the page if they're still editing
   let isSubmitting = false;

    $(window).on('beforeunload', function(e) {
        if (!isSubmitting) {
            const message = 'Data you\'ve entered will be lost if you leave. Do you wish to leave?';
            e.preventDefault();
            e.returnValue = message; // For modern browsers

            return message; // For older browsers
        }
    });

    // before leaving
    /*$(window).on('unload', function() {
        if (!isSubmitting) {
            delete_story()
            navigator.sendBeacon('/log-leave', 'User left the page');
        }
    });*/


    // save state of block when save is clicked
    $('.save-state').on('click', function () {
        $('.bg-shadow').css({'display': 'block'}).show('fast')
        $('.title-form').css({'display': 'flex'}).show('slow')
        $('.title-form').find('story-title-input').focus()
        saveBlocks();
    })

    // enable and disable the button to let user submit a title for a story

    $('.story-title-input').on('input', function () {
        if ($(this).val().length > 8 && $(this).val().replaceAll(' ', '') != '') $('.publish').removeAttr('disabled').removeClass('opacity-55')
        else $('.publish').addClass('opacity-55').attr('disabled')
    })

    $('.publish').on('click', function (e) {
        let story_id = localStorage.getItem('story_id')
        e.preventDefault()
        saveBlocks()
        localStorage.removeItem('story_id');
        isSubmitting = true
        setTimeout(() => {
            window.location.replace(`/story/${story_id}`);
            
        }, 1000);

    })

    $('.continue-editing').on('click', function (e) {
        $('.bg-shadow').hide('fast')
        $('.title-form').hide('slow')
    })

})
