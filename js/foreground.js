(function () {

    function printNestedValue(obj, word) {
        let element = ""
        for (var key in obj) {
            if (typeof obj[key] === "object") {
                printNestedValue(obj[key]);
            }
            if (typeof obj[key] === 'string' && obj[key] !== "") {
                const reg = new RegExp(word, 'gi');
                const highLightWord = obj[key].replace(reg, function (str) { return "<bdi style='background-color:yellow;color:#000'>" + str + "</bdi>" });
                element += "<span style='display:block; margin-top:10px;'><b>" + key + ":</b> " + highLightWord + "</span>"
            }
        }
        return element;
    }

    function drawWrapper(top, left) {
        const wrapper = document.createElement("div");
        wrapper.id = "telia-bubble-host";
        wrapper.style.position = "absolute";
        wrapper.style.top = top + "px";
        wrapper.style.left = left + "px";
        return wrapper;
    }

    function drawFloatingContainer(top, left) {
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
        main.style.maxHeight = "300px";
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

    function drawArrow() {
        const arrowContainer = document.createElement("div");
        arrowContainer.style.display = "block";
        arrowContainer.style.zIndex = "99999999";

        const arrow = document.createElement("div");
        arrow.id = "telia-bubble-arrow";
        arrow.style.position = "relative";
        arrow.style.display = "inline-block"
        arrow.style.verticalAlign = "middle";
        arrow.style.boxSizing = "border-box"
        arrow.style.left = "50%";
        arrow.style.width = "0";
        arrow.style.height = "0";
        arrow.style.border = "7px solid transparent";
        arrow.style.borderTop = "7px solid transparent";
        arrow.style.borderBottom = "7px solid";
        arrow.style.top = "2px";
        arrowContainer.appendChild(arrow);

        return arrowContainer;
    }

    function drawFrame(leftPosition, topPosition, payload, word, fontSize) {
        const wrapper = drawWrapper(topPosition, leftPosition);
        const floatingContainer = drawFloatingContainer(topPosition, leftPosition);
        const arrow = drawArrow();
        const closeBtn = drawCloseButton();
        const content = drawContent();
        const mainDictionary = drawDictionary(payload, word, fontSize)

        floatingContainer.appendChild(closeBtn)
        content.appendChild(mainDictionary);
        floatingContainer.appendChild(content);
        wrapper.appendChild(arrow);
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
            if (word.length > 0 && checkKeyPressed(keyToPress, e)) {
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
            }
        });
    }

    document.onmouseup = function async(e) {
        loadConfig(e)
    };
})();
