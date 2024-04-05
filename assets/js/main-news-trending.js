window.addEventListener("load", () => fetchNewsForTrending("India"));

async function fetchNewsForTrending(query) {

	const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
	const data = await res.json();
	console.log("and data is ");
	// console.log(data);
	console.log("Logging from the fetchNews function with results");
	// console.log(data.results);
	// console.log(data.results);

	if (!data) {
		console.log("null data from API call");
		return;
	}


	populateTrendingNews(data.results)
}


function populateTrendingNews(articles) {

	if (!articles) {
		console.log("null data from API call");
		return;
	}


	console.log("populating from populateTrendingNews function with articles : ");
	console.log(articles);

	var index = 0;
	for (var i = 0; i < 3; i++) {
		var str = 'news-trending-bottom-' + i + '-topic';
		console.log(str);
		index = showContentInTrendingBottom(articles, index, 'news-trending-bottom-' + i);
	}

	for (var i = 0; i < 5; i++) {
		var str = 'news-trending-right-' + i + '-topic';
		console.log(str);
		index = showContentInTrendingBottom(articles, index, 'news-trending-right-' + i);
	}

	index = showContentInTrendingBottom(articles, index, 'news-trending-top');
	// getNewsViaKeyWord('trending India', 'news-trending-top');

}


function showContentInTrendingBottom(articles, index, containerName) {

	if (!articles)
		return;

	console.log('logging articles from showContentInTrendingBottom with index : ' + index);
	console.log(articles);

	var article;

	for (var i = index; i < articles.length; i++) {
		console.log("i : " + i);
		if (articles[i].link && articles[i].image_url && articles[i].title) {
			article = articles[i];
			console.log("article: " + article);
			index = i + 1;
			break;
		}
	}

	console.log("The article is ");
	console.log(article);

	console.log("The containerName is ");
	console.log(containerName);
	// Fill in the data
	const img = document.getElementById(containerName + '-img');
	img.src = article.image_url;
	img.alt = article.title;


	const title = document.getElementById(containerName + '-title');
	title.innerHTML = article.title;
	title.href = article.link;

	return index;
}

