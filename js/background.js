console.log('from background.js')
const url = chrome.extension.getURL('../data/telia-glossary.json');

// load JSON file into memmory on install
chrome.runtime.onInstalled.addListener(() => {
	fetch(url)
        .then((response) => response.json()) //assuming file contains json
        .then((json) => storeGlossary(json));
	console.log("glosary stored on local mashine");
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
			
			console.log("stored:", data.terms)
			for (var i = 0; i < data.terms.length; i++){
				console.log("elenmentA", data.terms[i]);
				console.log("elenmentB", data.terms[i].Term.toLowerCase());
				console.log("query:", query);
				console.log("query:", query.toLowerCase());
				
				//console.log("elenmentC", query.toLowerCase());
				
				if(data.terms[i].Term.toLowerCase() == query.toLowerCase()){
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