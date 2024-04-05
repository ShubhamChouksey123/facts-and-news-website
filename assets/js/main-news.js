// const API_KEY = "";
const API_KEY = "413ebebdfb2443e1aa5a426a2af6f439";
const url = "https://newsapi.org/v2/everything?q=";

window.addEventListener("load", () => fetchNews("India"));
window.addEventListener("load", () => setDate());

setDate();
function setDate() {
	const dateNow = new Date();

	var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var day = days[dateNow.getDay()];

	let year = dateNow.getFullYear();
	let month = dateNow.getMonth() + 1;
	let dateToday = dateNow.getDate();

	console.log("day : " + day);
	console.log("year : " + year);
	console.log("month : " + month);
	console.log("dateToday : " + dateToday);

	let finalDate = day + ", " + dateToday + " " + month + " " + year;
	document.getElementById("today-date").innerHTML = dateNow.toDateString();
	console.log("setting date : " + dateNow.toDateString());

}


async function fetchNews(query) {

	console.log("fetching news with query : " + query);

	const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
	const data = await res.json();
	console.log(data);
	console.log("Logging from the fetchNews function");
	console.log(data.articles);

	showContentInCard(data.articles);
}



function showContentInCard(articles) {

	document.getElementById('container-news-card').innerHTML = "";
	console.log("Logging from the bindData function");
	console.log(articles);

	var articleFiltered = [];

	articles.forEach(article => {

		if (!article.urlToImage) {
			console.log("Image is null for article : " + article.title);
			return;
		}
		console.log("Image is not null for article : " + article.title);

		articleFiltered.push(article);

		if (articleFiltered.length == 4) {
			fillNewsCard(articleFiltered);
			articleFiltered = [];
		}

		console.log("Successfully appended is not null for article : " + article.title);
	});

}


// Function to fill the template with article and append it to the DOM
function fillNewsCard(article) {
	// Get the template
	const template = document.querySelector('#template-news-card');

	// Clone the template content
	const clone = document.importNode(template.content, true);

	for (let i = 0; i < 4; i++) {
		fillNthCard(article[i], clone, i);
	}

	document.getElementById('container-news-card').appendChild(clone);
}

// Function to fill the Nth Card with article and append it to the DOM
function fillNthCard(article, clone, i) {

	console.log("The article is ");
	console.log(article);
	// Fill in the data
	const img = clone.querySelector('#news-img');
	img.src = article.urlToImage;
	img.alt = article.title;

	const title = clone.querySelector('#news-title');
	title.textContent = article.title;
	title.href = article.url;

	const desc = clone.querySelector('#news-desc');
	desc.textContent = article.description;
	desc.href = article.url;


	const dateNews = new Date(article.publishedAt).toLocaleString("en-US", {
		timeZone: "Asia/Jakarta",
	});

	const date = clone.querySelector('#news-date');
	date.textContent = `${article.source.name} · ${dateNews}`;
}



function searchViaKeyWord(keyword) {

	if (!keyword)
		return;

	// closeSideCanvas();
	fetchNews(keyword);
}

const searchKeyWord = document.getElementById('search-keyword');
const searchButton = document.getElementById('search-button');



searchButton.addEventListener("click", () => {
	const keyword = searchKeyWord.value;
	console.log("submitted with keyword : " + keyword);
	if (!keyword) return;
	fetchNews(keyword);
	// curSelectedNav?.classList.remove("active");
	// curSelectedNav = null;
});


const canvasWindow = document.getElementById('fh5co-offcanvas');
function closeSideCanvas() {
	console.log("closing side canvas");
	canvasWindow.style.display = 'none';
}


function openSideCanvas() {
	canvasWindow.style.display = 'block';
}

async function fetchNew(query) {

	console.log("fetch news with query : " + query);

	const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
	const data = await res.json();
	console.log(data);
	// console.log(data.articles[0]);
	console.log("Logging from the fetchNews function and returning " + data.articles[0]);

	return data.articles[0];
}



// getNewsViaKeyWord('concert');

// function getNewsViaKeyWord(keyword) {

// 	if (!keyword)
// 		return;

// 	// closeSideCanvas();
// 	var article = fetchNew(keyword);
// 	console.log("news article " + article);
// }