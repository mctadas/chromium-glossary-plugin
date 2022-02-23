var shouldHistoryBeOn;

(function () {

	chrome.storage.local.get('options', data => {
		shouldHistoryBeOn = data.options && data.options.wordHistory;
		appendToHistoryHTML()
	});
})();

function appendToHistoryHTML(shouldAddNew = false, word = "") {
	if (shouldHistoryBeOn) {
		chrome.storage.local.get('history', data => {
			const parentElement = document.querySelector("#history");
			parentElement.innerHTML = ""
			if (shouldAddNew) {
				var history_container = document.createElement('a');
				history_container.setAttribute('id', 'history_link');
				history_container.text = word;
				parentElement.appendChild(history_container);
			} else if (data.history) {
				for (var i = 0; i < data.history.length; i++) {
					var item = data.history[i];
					var history_container = document.createElement('a');
					history_container.setAttribute('id', 'history_link');
					history_container.text = item;
					parentElement.appendChild(history_container);
				}
			}
		});
	}
}

function addToHistoryLocalStorage(item) {
	chrome.storage.local.get('history', data => {
		let unique = false
		if (data.history) {
			unique = data.history.includes(item)
		}

		if (!unique) {
			let json = data.history || [];
			if (json.length === 3) {
				json.shift();
			}
			json.push(item);
			chrome.storage.local.set({
				history: json
			});
			appendToHistoryHTML(true, item);
		}
	});
}

document.addEventListener('click', function (e) {
	if (e.target && e.target.id == 'history_link') {
		const searchBox = document.querySelector("#query");
		const submitBtn = document.querySelector("#submitbtn")
		searchBox.value = e.target.innerHTML;
		submitBtn.click();
	}
});

document.querySelector("#search-term").addEventListener("submit", function (e) {
	e.preventDefault();
	const q = document.querySelector("#query").value;
	if (q !== "") {
		chrome.runtime.sendMessage({
			message: "get_term",
			query: q
		}, response => {
			printTermInfo(response.payload, q);
		});

		document.getElementById('answer').innerHTML = q;
		addToHistoryLocalStorage(q);
	}
});

function isValidHttpUrl(string) {
	let url;
	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}
	return (url.protocol === "http:" || url.protocol === "https:") && (url.href == string || url.origin == string);
}

function printNestedValue(obj, word) {
	let element = ""
	for (var key in obj) {
		if (typeof obj[key] === "object") {
			printNestedValue(obj[key]);
		}
		if (typeof obj[key] === 'string' && obj[key] !== "") {
			const reg = new RegExp(word, 'gi');
			const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
			console.log(obj[key])
			let highLightWord = obj[key];
			if (!obj[key].match(new RegExp(urlRegex))) {
				highLightWord = obj[key].replace(reg, function (str) {
					return "<bdi style='background-color:yellow;color:#000'>" + str + "</bdi>"
				});
			} else {
				highLightWord = highLightWord.replace(urlRegex, function (url) {
					let hyperlink = url;
					if (!hyperlink.match('^https?:\/\/')) {
						hyperlink = 'http://' + hyperlink;
					}
					return '<a href="' + hyperlink + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
				});
			}

			element += "<span style='display:block;'><b>" + key + ":</b> " + highLightWord + "</span>"
		}
	}
	return element;
}

// Format response into web represeantation 
function printTermInfo(JSON_data, word) {
	console.log(JSON_data)
	if (typeof JSON_data === 'object') {
		if (JSON_data.length > 0) {
			document.getElementById("glossary-info").innerHTML = "";
			for (var i = 0; i < JSON_data.length; i++) {
				const ce_element_container = document.createElement('DIV');
				ce_element_container.classList.add('ce_term_info');

				const numberOfHits = document.getElementById("number_of_hits");
				numberOfHits.innerHTML = "Number of hits: " + JSON_data.length;

				// Create title container
				const ca_element_title_container = document.createElement('DIV');
				ca_element_title_container.classList.add("ca_title_container")

				// Create metainfo
				const ca_element_meta = document.createElement("div");
				ca_element_meta.classList.add('ce_term_title');

				ca_element_title_container.appendChild(ca_element_meta);
				ce_element_container.appendChild(ca_element_title_container);

				const meaning = document.createElement('span');
				meaning.id = "meaning";
				meaning.innerHTML = printNestedValue(JSON_data[i], word)

				ce_element_container.appendChild(meaning);

				document.getElementById("glossary-info").appendChild(ce_element_container);
			}

		} else {
			document.getElementById("glossary-info").innerHTML = "Term not found in glossary";
		}

	}
}
