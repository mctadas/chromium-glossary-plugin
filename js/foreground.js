(function () {

    chrome.runtime.sendMessage({
        message: "get_glossory",
        query: ""
    }, response => {
        var context = document.querySelector("body");
        var instance = new Mark(context);
        const arrOfWords = response.payload.map(word => word.Term);

        instance.mark(arrOfWords, {
            separateWordSearch: false,
            accuracy: {
                "value": "exactly",
                "limiters": [",", "."]
            }
        });
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
                element += "<span style='display:block; margin-top:10px;'><b>" + key + ":</b> " + highLightWord + "</span>"
            }
        }
        return element;
    }

    function isElementXPercentInViewport(maxHeight, leftPosition) {
        const parentElement = window.getSelection().focusNode.parentNode.getBoundingClientRect();
        return (parentElement.y > 0 && parentElement.y + maxHeight) < window.innerHeight;
      };

    function drawWrapper(top, left, shouldBeOnTop, maxHeight) {
        const wrapper = document.createElement("div");
        const parentElement = window.getSelection().focusNode.parentNode.getBoundingClientRect();
        wrapper.id = "telia-bubble-host";
        wrapper.style.position = "absolute";
        wrapper.style.top = shouldBeOnTop ? top + "px" : (top - maxHeight) + "px";
        wrapper.style.left = left + "px";
        return wrapper;
    }

    function drawFloatingContainer() {
        const floatingContainer = document.createElement("div");
        floatingContainer.id = "telia-bubble-host";
        floatingContainer.style.width = "auto";
        floatingContainer.style.maxWidth = "500px";
        floatingContainer.style.minWidth = "200px";
        floatingContainer.style.height = "auto";
        floatingContainer.style.background = "#fff";
        floatingContainer.style.color = "#000";
        floatingContainer.style.boxShadow = "0 8px 17px 0 rgb(0 0 0 / 20%), 0 6px 20px 0 rgb(0 0 0 / 19%)";
        floatingContainer.style.border = "1px solid #000";
        return floatingContainer;
    }

    function drawContent() {
        const content = document.createElement("div");
        content.id = "telia-bubble-content";
        content.style.width = "100%";
        content.style.marginTop = "10px"
        content.style.padding = "5px";

        return content;
    }

    function drawCloseButton() {
        const btn = document.createElement("span");
        btn.innerHTML = "X";
        btn.style.marginRight = "10px";
        btn.style.float = "right";
        btn.style.marginTop = "5px";
        btn.style.color = "#000";
        btn.style.cursor = "pointer";
        btn.onclick = function (e) {
            const target = e.target;
            target.parentNode.parentNode.remove();
        }
        return btn;
    }

    function drawDictionary(payload, word, fontSize) {
        const main = document.createElement("div");
        main.id = "telia-bubble-main-dictionary";
        main.style.overflowY = "auto";
        main.style.maxHeight = "200px";
        const mainTitle = document.createElement("div");
        mainTitle.id = "telia-bubble-main-dictionary-title";
        mainTitle.style.color = "rgb(228, 21, 19)";
        mainTitle.style.display = "block";
        mainTitle.innerHTML = word;

        const numberOfHits = document.createElement("span");
        numberOfHits.style.float = "right";
        numberOfHits.innerHTML = "Number of hits: " + payload.length;
        numberOfHits.style.color = "rgb(228, 21, 19)";

        main.appendChild(numberOfHits);
        main.appendChild(mainTitle);
        if (payload.length > 0) {
            for (var i = 0; i < payload.length; i++) {
                const mainWords = document.createElement("div");
                mainWords.innerHTML = printNestedValue(payload[i], word)
                mainWords.style.marginTop = "10px";
                mainWords.style.marginTop = "10px";
                mainWords.style.padding = "10px 10px"
                mainWords.style.background = "#f1e3ff";
                mainWords.style.fontSize = fontSize;
                main.appendChild(mainWords)
            }
        } else {
            const mainWords = document.createElement("div");
            mainWords.innerHTML = "No results found for this word."
            mainWords.style.marginTop = "15px";
            mainWords.style.fontSize = fontSize;
            main.appendChild(mainWords)
        }
        return main;
    }

    function drawFrame(leftPosition, topPosition, payload, word, fontSize) {
        const maxHeight = payload.length > 0 ? 200 : 80;
        const shouldBeOnTop = isElementXPercentInViewport(maxHeight, leftPosition);
        const wrapper = drawWrapper(topPosition, leftPosition, shouldBeOnTop, maxHeight);
        const floatingContainer = drawFloatingContainer();
        const closeBtn = drawCloseButton();
        const content = drawContent();
        const mainDictionary = drawDictionary(payload, word, fontSize)

        floatingContainer.appendChild(closeBtn)
        content.appendChild(mainDictionary);
        floatingContainer.appendChild(content);
        wrapper.appendChild(floatingContainer)
        const htmlDoc = document.documentElement;
        htmlDoc.appendChild(wrapper);
    }

    function checkKeyPressed(key, e) {
        if (key !== "1") {
            if (key === "2" && e.ctrlKey) {
                return true;
            } else if (key === "3" && e.altKey) {
                return true;
            } else if (key === "4" && e.shiftKey) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    }

    async function loadConfig(e) {
        await chrome.storage.local.get('options', data => {
            let keyToPress = "";
            let fontSize = "";
            if (data.options) {
                fontSize = data.options.fontSize + "px";
                keyToPress = data.options.triggerKey;
            }

            var sel = window.getSelection()
            var scrollTop = (window.pageYOffset !== undefined)
                ? window.pageYOffset :
                (document.documentElement || document.body.parentNode || document.body).scrollTop;
            const currentPopup = document.getElementById("telia-bubble-host")

            if (currentPopup) {
                currentPopup.remove();
            }

            const word = sel.toString();
            const splitWord = word.split(/(\s+)/).filter(item => {
                const temp = item.trim();
                if (temp.length > 0) {
                    return temp;
                }
            });

            if (word.length > 0
                && checkKeyPressed(keyToPress, e)
                && splitWord.length <= 4
                && splitWord.length > 0) {
                    console.log(document.getSelection());
                const posX = e.clientX - 110;
                const posY = e.clientY + scrollTop;
                chrome.runtime.sendMessage({
                    message: "get_term",
                    query: word
                }, response => {
                    drawFrame(posX, posY, response.payload, word, fontSize);
                });

                chrome.runtime.sendMessage({
                    message: "selected_word",
                    query: word
                });

                chrome.storage.local.get('history', data => {
                    let unique = false
                    if (data.history) {
                        unique = data.history.includes(word)
                    }

                    if (!unique) {
                        let json = data.history || [];
                        if (json.length === 3) {
                            json.shift();
                        }
                        json.push(word);
                        chrome.storage.local.set({
                            history: json
                        });
                    }
                });
            }
        });
    }

    document.onmouseup = function async(e) {
        loadConfig(e)
    };
})();
