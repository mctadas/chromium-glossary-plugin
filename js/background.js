const url = "https://api.dictionaryapi.dev/api/v2/entries/en/";

/*
Not removing this since it can be useful if we wanna load the entire dictionary 
chrome.runtime.onInstalled.addListener(() => {
	fetch(url)
		.then((response) => response.json()) //assuming file contains json
		.then((json) => storeGlossary(json));
});

function storeGlossary(json) {
	chrome.storage.local.set({
		 terms: json	
	});	
}
*/

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === 'get_term') {
		console.log("Term")
		let query = request.query;
		let result_array = [];
		fetch(url + query)
			.then((response) => response.json())
			.then((json) => {
				console.log(json);
				sendResponse({
					message: 'success',
					query: query,
					payload: json
				});
			});

	}
	return true;
});