// const API_KEY = "";
const FACTS_API_KEY = "6K8F0KUmxbkwILLE16Topg==p6zMCiZzsiOlfAAZ";

document.addEventListener("load", fetchAndPopulateFacts());



async function fetchAndPopulateFacts() {

	fetch('https://api.api-ninjas.com/v1/facts?limit=20', {
		method: 'GET',
		headers: {
			'X-Api-Key': '6K8F0KUmxbkwILLE16Topg==p6zMCiZzsiOlfAAZ'
		}
	})
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(result => {
			console.log("Called Facts API");
			console.log(result);
			populateFacts(result);
		})
		.catch(error => {
			console.error('Error:', error);
		});

}




function populateFacts(facts) {

	console.log("setting top Facts")
	for (var i = 10; i < 14; i++) {
		var index = i - 10;
		var factContainer = document.getElementById('random-fact-' + index);
		// console.log('factContainer for index : ' + index);
		// console.log(factContainer);
		factContainer.innerHTML = facts[index].fact;
	}
	console.log("done setting top Facts");
}

