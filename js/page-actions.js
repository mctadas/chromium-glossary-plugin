const history = chrome.extension.getURL('../data/history.json');
const url = "https://api.dictionaryapi.dev/api/v2/entries/en/";
var json = JSON.parse(localStorage.getItem("history")) || [];

(function () {
	if (json && json.length > 0) {
		appendToHistoryHTML()
	}
})();

function appendToHistoryHTML() {
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
			printTermInfo(response.payload);
		});

		document.getElementById('answer').innerHTML = q;
		addToHistoryLocalStorage(q);
	}
});

// Format response into web represeantation 
function printTermInfo(JSON_data) {
	if (typeof JSON_data === 'object') {
		if (JSON_data.length > 0) {
			document.getElementById("glossary-info").innerHTML = "";
			for (var i = 0; i < JSON_data.length; i++) {
				const ce_element_container = document.createElement('DIV');
				ce_element_container.classList.add('ce_term_info');

				// Create title container
				const ca_element_title_container = document.createElement('DIV');
				ca_element_title_container.classList.add("ca_title_container")

				// Create title
				const ca_element_h1 = document.createElement("h1");
				ca_element_h1.innerHTML = JSON_data[i].word
				ca_element_h1.classList.add("title_h1")
				
				// Create metainfo
				const ca_element_meta = document.createElement("div");
				ca_element_meta.classList.add('ce_term_title');

				const phonetics = document.createElement('span');
				phonetics.id = "audio_pronunciation"
				const audioUrl = JSON_data[i].phonetics[0].audio;
				phonetics.onclick = function (e) {
					console.log(audioUrl);
					var audio = new Audio(audioUrl);
					audio.play();
				}

				ca_element_meta.appendChild(phonetics);
				ca_element_title_container.appendChild(ca_element_h1);
				ca_element_title_container.appendChild(ca_element_meta);
				ce_element_container.appendChild(ca_element_title_container);

				const meaning = document.createElement('span');
				meaning.id = "meaning";
				meaning.innerHTML = JSON_data[i].meanings[0].definitions[0].definition

				ce_element_container.appendChild(meaning);

				document.getElementById("glossary-info").appendChild(ce_element_container);
			}

		} else {
			document.getElementById("glossary-info").innerHTML = "Term not found in glossary";
		}

	}
}