var json = JSON.parse(localStorage.getItem("history")) || [];
var shouldHistoryBeOn;

(function () {
	chrome.storage.local.get('options', data => {
		shouldHistoryBeOn = data.options && data.options.wordHistory;
		if (json && json.length > 0) {
			appendToHistoryHTML()
		}
	});
})();

function appendToHistoryHTML() {
	if (shouldHistoryBeOn) {
		const parentElement = document.querySelector("#history");
		parentElement.innerHTML = ""
		for (var i = 0; i < json.length; i++) {
			var item = json[i];
			var history_container = document.createElement('a');
			history_container.setAttribute('id', 'history_link');
			history_container.text = item;
			parentElement.appendChild(history_container);
		}
	}
}

function addToHistoryLocalStorage(item) {
	let unique = json.includes(item)
	if (!unique) {
		if (json.length === 3) {
			json.shift();
		}
		json.push(item);
		localStorage.setItem("history", JSON.stringify(json))
	}
	appendToHistoryHTML();
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

function printNestedValue(obj, word) {
	let element = ""
	for (var key in obj) {
		if (typeof obj[key] === "object") {
			printNestedValue(obj[key]);
		}
		if (typeof obj[key] === 'string' && obj[key] !== "") {
			const reg = new RegExp(word, 'gi');
			const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
			let highLightWord = obj[key].replace(reg, function (str) { 
				return "<bdi style='background-color:yellow;color:#000'>" + str + "</bdi>" 
			});

			highLightWord = highLightWord.replace(urlRegex, function (url) {
				let hyperlink = url;
				if (!hyperlink.match('^https?:\/\/')) {
					hyperlink = 'http://' + hyperlink;
				}
				return '<a href="' + hyperlink + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
			});

			element += "<span style='display:block;'><b>" + key + ":</b> " + highLightWord + "</span>"
		}
	}
	return element;
}

// Format response into web represeantation 
function printTermInfo(JSON_data, word) {
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
