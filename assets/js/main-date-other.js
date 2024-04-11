setDate();

function setDate() {
	const dateNow = new Date();

	var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var day = days[dateNow.getDay()];

	let year = dateNow.getFullYear();
	let month = dateNow.getMonth() + 1;
	let dateToday = dateNow.getDate();

	let finalDate = day + ", " + dateToday + " " + month + " " + year;
	document.getElementById("today-date").innerHTML = dateNow.toDateString();
}




$(function () {
	// get hash value
	var hash = window.location.hash;
	// now scroll to element with that id
	$('html, body').animate({ scrollTop: $(hash).offset().top });
});


(function () {
	"use strict";



	/**
	 * Easy on scroll event listener
	 */
	const onscroll = (el, listener) => {
		el.addEventListener('scroll', listener)
	}

	/**
	 * Navbar links active state on scroll
	 */
	let navbarlinks = select('#navbar .scrollto', true)
	const navbarlinksActive = () => {
		let position = window.scrollY - 400
		navbarlinks.forEach(navbarlink => {
			if (!navbarlink.hash) return
			let section = select(navbarlink.hash)
			if (!section) return
			if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
				navbarlink.classList.add('active')
			} else {
				navbarlink.classList.remove('active')
			}
		})
	}
	window.addEventListener('load', navbarlinksActive)
	onscroll(document, navbarlinksActive)

	/**
	 * Scrolls to an element with header offset
	 */
	const scrollto = (el) => {
		let elementPos = select(el).offsetTop
		window.scrollTo({
			top: elementPos,
			behavior: 'smooth'
		})
	}


});