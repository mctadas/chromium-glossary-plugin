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
		let query = request.query;
		fetch('./../data/telia-glossary.json')
			.then((response) => response.json())
			.then((json) => {
				let result_array = json.filter(item => item.Term && item.Term.toLowerCase().includes(query.toLowerCase()));
				
				if(result_array.length > 1) {
					result_array.sort((a,b) => 
					(b.Term.toLowerCase() === query.toLowerCase()) - (a.Term.toLowerCase() === query.toLowerCase()))
				}
				
				sendResponse({
					message: 'success',
					query: query,
					payload: result_array
				});
			});

	}

	if (request.message === "selected_word") {
		console.log(request.query)
		// This should be sent to the popup
	}
	
	return true;
});

chrome.tabs.onUpdated.addListener(function(tab) {
    chrome.tabs.executeScript({
        file: './foreground.js'
    }); 
});