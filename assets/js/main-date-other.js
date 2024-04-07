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

