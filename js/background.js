console.log('from background.js')
const url = chrome.extension.getURL('../data/telia-glossary.json');

// load JSON file into memmory on install
chrome.runtime.onInstalled.addListener(() => {
	fetch(url)
        .then((response) => response.json()) //assuming file contains json
        .then((json) => storeGlossary(json));
	console.log("glossary stored on a local mashine");
});

function storeGlossary(json) {
    chrome.storage.local.set({
	     terms: json	
    });	
}

chrome.runtime.onMessage.addListener(( request, sender, sendResponse) => {
	console.log("get request: ", request);
	
	if (request.message === 'get_term') {
		let query = request.query;
		let result_array = [];
		chrome.storage.local.get('terms', data => {
			//TODO: make a search function out of it
			
			for (var i = 0; i < data.terms.length; i++){
				if(data.terms[i].Term.toLowerCase().includes(query.toLowerCase()) ||
				   //data.terms[i].Term.toLowerCase() == query.toLowerCase() || //search for exact term
				   data.terms[i].Acronym.toLowerCase() == query.toLowerCase())
				{
					result_array.push(data.terms[i]);	
				}
			}
			sendResponse({
				message: 'success',
				query: query,
				payload: result_array
			});			
		});
	}
	return true;
});