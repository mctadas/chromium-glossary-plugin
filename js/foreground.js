(function () {
    var pageScanned = false;
    function searchPage() {
        chrome.runtime.sendMessage({
            message: "get_glossory",
            query: ""
        }, response => {
            var context = document.querySelector("body");
            var instance = new Mark(context);
            let regexWords = "";
            response.payload.map((word, i) => {
                if (i + 1 === response.payload.length) {
                    regexWords += word.Term.trimLeft().trimRight()
                } else {
                    regexWords += word.Term.trimLeft().trimRight() + "|"
                }
            });
            instance.markRegExp(new RegExp(`(?:^|\s)${regexWords}(?=\s|$)`), {
                "exclude": [".telia-glossory-explanation-popup"],
                "acrossElements": true
            });
        });
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
        wrapper.id = "telia-bubble-host";
        wrapper.style.position = "absolute";
        wrapper.style.top = shouldBeOnTop ? top + "px" : (top - maxHeight) + "px";
        wrapper.style.left = left + "px";
        wrapper.style.zIndex = "999999"
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

    function setupWrapper(posX, posY, fontSize, word) {
        const currentPopup = document.getElementById("telia-bubble-host")

        if (currentPopup) {
            currentPopup.remove();
        }

        const splitWord = word.split(/(\s+)/).filter(item => {
            const temp = item.trim();
            if (temp.length > 0) {
                return temp;
            }
        });

        if (word.length > 0
            && splitWord.length <= 4
            && splitWord.length > 0) {
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
    }

    function getSelectionCoords(win) {
        win = win || window;
        var doc = win.document;
        var sel = doc.selection, range, rects, rect;
        var x = 0, y = 0;
        if (sel) {
            if (sel.type != "Control") {
                range = sel.createRange();
                range.collapse(true);
                x = range.boundingLeft;
                y = range.boundingTop;
            }
        } else if (win.getSelection) {
            sel = win.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0).cloneRange();
                if (range.getClientRects) {
                    range.collapse(true);
                    rects = range.getClientRects();
                    if (rects.length > 0) {
                        rect = rects[0];
                    }
                    x = rect.left;
                    y = rect.top;
                }
                // Fall back to inserting a temporary element
                if (x == 0 && y == 0) {
                    var span = doc.createElement("span");
                    if (span.getClientRects) {
                        // Ensure span has dimensions and position by
                        // adding a zero-width space character
                        span.appendChild(doc.createTextNode("\u200b"));
                        range.insertNode(span);
                        rect = span.getClientRects()[0];
                        x = rect.left;
                        y = rect.top;
                        var spanParent = span.parentNode;
                        spanParent.removeChild(span);

                        // Glue any broken text nodes back together
                        spanParent.normalize();
                    }
                }
            }
        }
        return { x: x, y: y };
    }

    chrome.storage.local.get('options', data => {
        document.onmouseup = function async(e) {
            if (data.options.triggerKey === "1") {
                var sel = window.getSelection()
                var scrollTop = (window.pageYOffset !== undefined)
                    ? window.pageYOffset :
                    (document.documentElement || document.body.parentNode || document.body).scrollTop;
                const posX = e.clientX - 110;
                const posY = e.clientY + scrollTop;
                setupWrapper(posX, posY, data.options.fontSize, sel.toString())
            }
        }
        window.onkeyup = function (event) {
            const selection = getSelectionCoords(window)
            const word = window.getSelection().toString() || document.getSelection().toString();
            if (window.getSelection()) {
                if (event.key === "Alt" && data.options.triggerKey === "3") {
                    setupWrapper(selection.x, selection.y, data.options.fontSize, word)
                }
                if (event.key === "Control" && data.options.triggerKey === "2") {
                    setupWrapper(selection.x, selection.y, data.options.fontSize, word)
                }
            }

            const shouldSearch = data.options && data.options.auto_select;
            if (shouldSearch === "on" && event.key === "Alt" && !pageScanned) {
                alert("Scanning page...")
                searchPage();
                pageScanned = true;
            }
        }

    });
})();
