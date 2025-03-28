$('.edit-topic-about-text-btn').on('click', function (e) {
    if ($(e.target).text() == 'Edit') { // if edit btn is clicked
        $('.profile-about-text').attr('contenteditable', true).focus().addClass("border-2 focus:outline-lightblue focus:border-lightblue") // change the p tag to editable
        $(e.target).text('Save')  // change to save
    } else if ($(e.target).text() == 'Save') {  // if save btn is clicked
        $('.about-input').val($('.profile-about-text').text())  // set the hidden input val to the editable text
        $('.edit-profile-about-submit-btn').click()  // finally submit the form
    }
})