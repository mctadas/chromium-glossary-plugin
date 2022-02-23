function configExtension() {
	chrome.storage.local.get('options', data => {
		let apiUrl;
		if (!data.options) {
			const defaultValues = {
				apiUrl: './../data/telia-glossary.json',
				triggerKey: "1",
				fontSize: "11",
				wordHistory: true,
				auto_select: "on"
			}
			apiUrl = './../data/telia-glossary.json';

			chrome.storage.local.set({
				options: defaultValues
			});

		} else {
			apiUrl = data.options.apiUrl;
		}

		/*	chrome.identity.getAuthToken({ interactive: true }, function (token) {
				fetch(apiUrl, {
					headers: new Headers({
						'Authorization': 'Bearer ' + token,
					}),
				})
					.then((response) => response.json())
					.then((json) => {
						if (json.data) {
							storeGlossary(json.data);
						} else {
							storeGlossary(json);
						}
					});
			}); 
			*/


		fetch(apiUrl)
			.then((response) => response.json())
			.then((json) => {
				if (json.data) {
					storeGlossary(json.data);
				} else {
					storeGlossary(json);
				}
			});
	});
}

chrome.runtime.onInstalled.addListener(() => {
	configExtension();
})

chrome.windows.onCreated.addListener(() => {
	configExtension();
});


function storeGlossary(json) {
	chrome.storage.local.set({
		terms: json
	});
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	chrome.storage.local.get('terms', data => {
		if (request.message === 'get_term') {
			let query = request.query;

			let result_array = data.terms.filter(item => item.Term && item.Term.toLowerCase().includes(query.toLowerCase()));

			if (result_array.length > 1) {
				result_array.sort((a, b) =>
					(b.Term.toLowerCase() === query.toLowerCase()) - (a.Term.toLowerCase() === query.toLowerCase()))
			}

			sendResponse({
				message: 'success',
				query: query,
				payload: result_array
			});
		}
	});
	if (request.message === "update_glossory") {
		configExtension();
	}
	if (request.message === "get_glossory") {
		chrome.storage.local.get('terms', data => {
			sendResponse({
				message: 'success',
				query: "Entire glossory",
				payload: data.terms
			});
		});
	}
	return true;
});
