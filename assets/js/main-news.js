// const API_KEY = "";
const API_KEY = "pub_41374058451432a24eb77e3552c8fb2010e7d";
const url = "https://newsdata.io/api/1/news?apikey=" + API_KEY + "&language=en,hi" + "&q=";



window.addEventListener("load", () => fetchNews("India"));


async function fetchNews(query) {

	console.log("fetching news with query : " + query);

	const res = await fetch(`${url}${query}`);
	const data = await res.json();
	console.log(data);

	if (!data) {
		console.log("null data from API call");
		return;
	}

	showContentInCard(data.results);
}



function showContentInCard(articles) {

	if (!articles) {
		console.log("null data from API call");
		return;
	}

	document.getElementById('container-news-card').innerHTML = "";
	console.log("Logging from the bindData function");
	console.log(articles);

	var articleFiltered = [];

	articles.forEach(article => {

		if (!article.image_url && !article.source_icon) {
			console.log("Image null for article : " + article.title);
			return;
		}

		if (!article.link) {
			console.log("link null for article : " + article.title);
			return;
		}
		if (!article.title) {
			console.log("title null for article : " + article.title);
			return;
		}

		articleFiltered.push(article);

		if (articleFiltered.length == 4) {
			fillNewsCard(articleFiltered);
			articleFiltered = [];
		}

		console.log("Successfully appended is not null for article : " + article.title);
	});

}


// Function to fill the template with article and append it to the DOM
function fillNewsCard(articles) {

	console.log("after filtering we have article.length : " + articles.length);

	// Get the template
	const template = document.querySelector('#template-news-card');


	for (let i = 0; i < articles.length; i++) {

		// Clone the template content
		const clone = document.importNode(template.content, true);
		console.log("Now working for  : " + articles[i].title);
		fillNthCard(articles[i], clone);
		document.getElementById('container-news-card').appendChild(clone);
	}
}

// Function to fill the Nth Card with article and append it to the DOM
function fillNthCard(article, clone) {

	if (!article) {
		console.log("null data from API call");
		return;
	}

	console.log("The article is ");
	console.log(article);
	// Fill in the data
	const imgDOM = clone.querySelector('#news-img');
	fillCardImage(article, imgDOM)

	const title = clone.querySelector('#news-title');
	title.textContent = article.title;
	title.href = article.link;

	const desc = clone.querySelector('#news-desc');
	desc.textContent = article.description;
	desc.href = article.link;


	const dateNews = new Date(article.pubDate).toLocaleString("en-US", {
		timeZone: "Asia/Jakarta",
	});

	const date = clone.querySelector('#news-date');
	// date.textContent = `${article.source.name} · ${dateNews}`;
	date.textContent = dateNews;

	console.log("Done working for  : " + article.title);
}


// Function to fill the Nth Card with article and append it to the DOM
function fillCardImage(article, imgDOM) {

	if (!article) {
		console.log("null data from API call");
		return;
	}

	if (article.image_url) {
		imgDOM.src = article.image_url;
		imgDOM.alt = article.title;
		return;
	}

	if (article.source_icon) {
		imgDOM.src = article.source_icon;
		imgDOM.alt = article.title;
		return;
	}
}







function searchViaKeyWordForRecentArticle(keyword) {

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


