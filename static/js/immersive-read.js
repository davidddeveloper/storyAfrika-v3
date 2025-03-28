$(function () {
	let pinned = false;
	// show or hide toolbar
	let $toolbarContainer = $('.toolbar-container');
	$toolbarContainer.on('mouseover', function () {
		$toolbarContainer.removeClass('-mt-14');
	}).on('mouseleave', function () {
		setTimeout(() => {
			if (!pinned && $toolbarContainer.innerWidth() > 400) $toolbarContainer.addClass('-mt-14');
			
		}, 700);
	});

	const pinnedTool = () => {
		$('.pin-toolbar').on('click', function () {
			if (!pinned) pinned = true;
			else pinned = false;
			if ($(this).hasClass('bg-mediumpurple')) {
				$(this).removeClass('bg-mediumpurple').html(`<img src="/static/icons/pin.svg" alt="" srcset="">`);
			}
			else $(this).addClass('bg-mediumpurple').html(`<img src="/static/icons/pinned.svg" alt="" srcset="">`);
		});
	}
	pinnedTool();

	const textSizeInput = $('#text-size-input');
	let text = $('.story-story-text');
	let logo = $('.logo-text');
	textSizeInput.val(40);

	// show or hide preferences
	let settingsBtns = $('.setting-btn');
	settingsBtns.on('click', (e) => {
		let target = $(e.target)
		settingsBtns.removeClass('bg-mediumpurple');
		settingsBtns.next('.text-preferences').hide();
	
		
		if (target.hasClass('setting-btn')) {
			target.addClass('bg-mediumpurple');
			if (!(target.hasClass('text-preferences-btn'))) {
				target.next('.text-preferences').addClass('is-hidden')
			}
		}
		else {
			target = target.closest('.setting-btn');
			target.addClass('bg-mediumpurple')
			if (!(target.hasClass('text-preferences-btn'))) {
				target.next('.text-preferences').addClass('is-hidden')
			}
		}
	})

	// reading preferences
	// show reading preferences
	let textPreferencesBtn = $('.text-preferences-btn');
	let readingPreferences = $('.text-preferences');

	textPreferencesBtn.on('click', () => {
		if (readingPreferences.hasClass('is-hidden')) {
			readingPreferences.removeClass('is-hidden').show()

		} else {
			readingPreferences.addClass('is-hidden').hide()

		}
	})
	// text size
	logo.css({'font-size': `${textSizeInput.val()}px`})
	text.css({'font-size': `${textSizeInput.val() - 10}px`});

	textSizeInput.on('change', function () {
		value = textSizeInput.val();
		logo.css({'font-size': `${value}px`});
		text.css({'font-size': `${value - 10}px`});
	})

	// letter spacing
	const letterSpacingInput = $('.text-spacing-setting input');
	letterSpacingInput.on('change', function (e) {
		if(e.target.checked) text.css({'letter-spacing': '8px'});
		else text.css({'letter-spacing': 'normal'});
	})

	// column spacing
	let changeColBtns = $('.change-col-btn');
	let content = $('.content');
	let columnInfo = $('.column-info');

	changeColBtns.each((idx, btn) => {
		let button = $(btn);
		button.on('click', function () {
			changeColBtns.removeClass('active-column');
			if (button.hasClass('col-1')) {
				columnInfo.text('Narrow Column');
				button.addClass('active-column');
				content.addClass('sm:w-[430px]');
				if (content.hasClass('sm:w-[720px]')) content.removeClass('sm:w-[720px]');
				if (content.hasClass('md:w-[960px]')) content.removeClass('md:w-[960px]');
			} else if (button.hasClass('col-2')) {
				columnInfo.text('Medium column');
				button.addClass('active-column');
				content.addClass('sm:w-[720px]');
				if (content.hasClass('sm:w-[430px]')) content.removeClass('sm:w-[430px]');
				if (content.hasClass('md:w-[960px]')) content.removeClass('md:w-[960px]');
			} else if (button.hasClass('col-3')) {
				columnInfo.text('Wide column');
				button.addClass('active-column');
				content.addClass('md:w-[960px]');
				if (content.hasClass('sm:w-[720px]')) content.removeClass('sm:w-[720px]');
				if (content.hasClass('sm:w-[430px]')) content.removeClass('sm:w-[430px]');
			}
		})
	})

	// fonts
	// comic 
	let changeFontInputs = $('.text-font-setting input');
	changeFontInputs.each((idx, inputbox) => {
		let input = $(inputbox);
		input.on('change', function () {
			console.log(input.data('font'))
			if (input.data('font') === 'sitka') {
				content.removeClass('font-[cursive]').removeClass('font-comic').addClass('font-sitka-light');
			}
			if (input.data('font') === 'comic') {
				content.removeClass('font-[cursive]').removeClass('font-sitka-light').addClass('font-comic');
			}
			if (input.data('font') === 'cursive') {
				content.removeClass('font-comic').removeClass('font-sitka-light').addClass('font-[cursive]');
			}

		})
	})

	// themes
	//set save theme on local storage
	//text-black text-darkGrayForeground text-white text-lightgray bg-black bg-grey bg-sepia bg-darkGrey bg-white
	const defaultTheme = `text-lightgray bg-white`
	const removeDefaultTheme = () => {
		$('body').removeClass(defaultTheme)
		localStorage.removeItem('theme')
	}

	const setDefaultTheme = () => {
		$('body').addClass(defaultTheme)
		localStorage.setItem('theme', defaultTheme)
	}

	const setTheme = (themBtn) => {
		removeTheme();
		$('body').addClass(themBtn.data('theme'));
		localStorage.setItem('theme', themBtn.data('theme'));
	}

	const removeTheme = () => {
		$('body').removeClass(localStorage.getItem('theme'))
	}
	// set default theme
	if (localStorage.getItem('theme')) {
		$('body').addClass(localStorage.getItem('theme'))
	} else {
		setDefaultTheme()
	}

	$('body').addClass(localStorage.getItem('theme'))
	let themesBtn = $('.themes-container .theme');
	themesBtn.each((idx, themeHtml) => {
		let theme = $(themeHtml);
		theme.removeClass('active-column');
		theme.on('click', (e) => {
			$('.theme').removeClass('active-column')
			// remove default theme
			theme.addClass('active-column');
			setTheme(theme);
			//setDefaultTheme()
		})
	})

	// listen to story using speech synthesis
	const listenBtn = $('.listen-story');
	listenBtn.on('click', () => {
		if ('speechSynthesis' in window) {
			const synthesis = new SpeechSynthesisUtterance()
			const voices = window.speechSynthesis.getVoices();
			console.log(voices)
			synthesis.text = $('.content').text()
			synthesis.voice = voices[300];
			window.speechSynthesis.speak(synthesis)
		} else {
			alert("Sorry, your browser doesn't support text to speech!")
		}
	})

	//hide toolbar
	$('.content').on('click', () => {
		readingPreferences.addClass('is-hidden').hide()
	})

})