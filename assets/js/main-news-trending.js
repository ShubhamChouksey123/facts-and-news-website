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

	fillTrendingMovingTitles(articles);

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

	var article;

	for (var i = index; i < articles.length; i++) {
		if (articles[i].link && articles[i].image_url && articles[i].title) {
			article = articles[i];
			console.log("so we have got and article which has not null link, image and title");
			console.log(article);
			index = i + 1;
			break;
		}
	}

	if (!article) {
		console.error("so we couldn't find and article from the 10 results");
		return;
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

	const categoryDOM = document.getElementById(containerName + '-topic');
	console.log("setting category of DOM of topic : " + containerName + '-topic');
	console.log(categoryDOM);
	setCategoryOfNews(article, categoryDOM);

	return index;
}



function setCategoryOfNews(article, categoryDOM) {

	if (!article || !article.category) {
		return null;
	}

	console.log("article.category : " + article.category);

	categoryDOM.innerHTML = article.category[0];

}



function searchViaKeyWordForTrending(keyword) {

	if (!keyword)
		return;

	// closeSideCanvas();
	fetchNewsForTrending(keyword);
}



function fillTrendingMovingTitles(articles) {

	var filteredTopics = [];
	for (var i = 0; i < articles.length; i++) {
		if (articles[i].title) {
			filteredTopics.push(articles[i].title);
			console.log("added tittle : " + articles[i].title);
			if (filteredTopics.length == 3)
				break;
		}
	}


	console.log("filteredTopics" + filteredTopics);

	// var dom = document.getElementById('#news-trending-moving-0');
	// console.log(dom);
	// document.getElementById('news-trending-moving-0').innerHTML = filteredTopics.at(0);
	// document.getElementById('news-trending-moving-1').innerHTML = filteredTopics[1];
	// document.getElementById('news-trending-moving-2').innerHTML = filteredTopics[2];

	// startTicker();
}