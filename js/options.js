(function () {
    loadConfig();
})();

const submit = document.getElementById("submit");
const reset = document.getElementById("reset");

const api_input = document.getElementById("api_url");
const bubble = document.getElementById("bubble");
const font_size = document.getElementById("font_size");
const word_history = document.getElementById("word_history");
const auto_select = document.getElementById("autoselect");

submit.addEventListener("click", saveFunc);
reset.addEventListener("click", resetFunc);

function loadConfig() {
    chrome.storage.local.get('options', data => {
        if (data.options) {
            api_input.value = data.options.apiUrl;
            bubble.value = data.options.triggerKey;
            font_size.value = data.options.fontSize;
            word_history.checked = data.options.wordHistory;
            auto_select.value = data.options.auto_select;
        }
    });
}

function saveFunc() {
    chrome.storage.local.set({
        options: {
            apiUrl: api_input.value,
            triggerKey: bubble.value,
            fontSize: font_size.value,
            wordHistory: word_history.checked,
            auto_select: auto_select.value
        }
    });
    chrome.runtime.sendMessage({
        message: "update_glossory",
        query: api_input.values
    });
    
    alert("Saved")
}

function resetFunc() {
    api_input.value = "";
    bubble.value = "1";
    font_size.value = "11"
    word_history.checked = true;

    const defaultValues = {
        apiUrl: './../data/telia-glossary.json',
        triggerKey: "1",
        fontSize: "11",
        wordHistory: true,
        auto_select: "on"
    }

    chrome.storage.local.set({
        options: defaultValues
    });

    alert("Reset to default config")
}