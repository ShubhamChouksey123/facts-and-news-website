populateTrendingNews();




function populateTrendingNews() {

	for (var i = 0; i < 3; i++) {
		var str = 'news-trending-bottom-' + i + '-topic';
		console.log(str);
		var trendingContainer = document.getElementById('news-trending-bottom-' + i + '-topic');
		var keyword = trendingContainer.innerHTML + 'India';
		console.log("keyword : " + keyword);

		getNewsViaKeyWord(keyword, 'news-trending-bottom-' + i);
		// console.log("article : " + article);
		// console.log(article);
	}

	// for (var i = 0; i < 4; i++) {
	// 	var str = 'news-trending-right-' + i + '-topic';
	// 	console.log(str);
	// 	var trendingContainer = document.getElementById('news-trending-right-' + i + '-topic');
	// 	var keyword = trendingContainer.innerHTML + 'India';
	// 	console.log("keyword : " + keyword);

	// 	getNewsViaKeyWord(keyword, 'news-trending-right-' + i);
	// }
}



async function getNewsViaKeyWord(query, containerName) {

	console.log("fetching news with query : " + query);

	const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
	const data = await res.json();
	console.log(data);
	console.log("Logging from the fetchNews function");
	console.log(data.articles);

	if (!data)
		return;

	showContentInTrendingBottom(data.articles, containerName);
}

function showContentInTrendingBottom(articles, containerName) {

	var article;

	for (var i = 0; i < articles.length; i++) {
		if (articles[i].url) {
			article = articles[i];
		}
	}

	console.log("The article is ");
	console.log(article);

	console.log("The containerName is ");
	console.log(containerName);
	// Fill in the data
	const img = document.getElementById(containerName + '-img');
	img.src = article.urlToImage;
	img.alt = article.title;


	const title = document.getElementById(containerName + '-title');
	title.innerHTML = article.title;
	title.href = article.url;
}

