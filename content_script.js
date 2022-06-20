"use strict"

function insertTexButton(toolBar) {
    let cell = toolBar.querySelector('div[class="cell--3MTt0"]');

    let container = document.createElement("DIV");
    container.className = "container--22ASZ";
    container.id = "texButton";

    let texButton = document.createElement("BUTTON");
    texButton.title = "Затехать";
    texButton.className = "container--2lPGK type_base--rkphf color_base--hO-yz";
    texButton.onclick = texMessage;

    let icon = document.createElement("IMG");
    icon.src = chrome.runtime.getURL("images/logo128.png");
    icon.width = "16";
    icon.height = "16";

    container.appendChild(texButton);
    texButton.appendChild(icon);
    cell.children[3].after(container);
}

function insertTexImg(textBox, texText, order, texType) {
    const src = "https://s0.wp.com/latex.php?zoom=5&bg=ffffff&fg=000000&s=0&latex=";
    if (texType == 'block')
        textBox.innerHTML = textBox.innerHTML.replace('$$' + texText + '$$', `<img _order="${order}">`);
    else
        textBox.innerHTML = textBox.innerHTML.replace('$' + texText + '$', `<img _order="${order}">`);
    let img = document.createElement('IMG');
    img.alt = texText;
    img.title = texText;
    img.name = 'texImg';
    img.onload = function() {
        this.height = this.naturalHeight / 37 * 8;
        this.style['vertical-align'] = 'middle';
        this.style.display = 'inline';
        let img = textBox.querySelector(`img[_order="${order}"`);
        if (texType == 'block') {
            let block = document.createElement('DIV');
            block.className = 'texBlock';
            block.align = 'center';
            block.style.display = 'block';
            this.style.display = 'block';
            block.append(this);
            img.replaceWith(block);
        }
        else {
            this.style['vertical-align'] = 'middle';
            this.style.display = 'inline';
            img.replaceWith(this);
        }
    }
    texText = texText.replaceAll('+', '%2B');
    img.src = src + texText;
}

function texMessage() {
    let textBox = getActiveTextBox();
    let text = textBox.innerHTML;
    let texText = "";
    let texType = null;
    let order = 0;
    let prevChar = '';
    for (let char of text) {
        if (char == '$') {
            if (prevChar == '$') {
                if (texType == 'block') {
                    insertTexImg(textBox, texText, order, texType);
                    order += 1;
                    texType = null;
                    texText = '';
                }
                else {
                    texType = 'block';
                }
            }
            else if (!texType) {
                texType = 'inline';
            }
            else {
                insertTexImg(textBox, texText, order, texType);
                order += 1;
                texType = null;
                texText = '';
            }
        }
        else if (texType != null) {
            texText += char;
        }
        prevChar = char;
    }
    if (!order) {
        let texImgs = textBox.querySelectorAll('img[name="texImg"]');
        for (let texImg of texImgs) {
            texText = '$' + texImg.alt + '$';
            texImg.outerHTML = texText;
        }
        let texBlocks = textBox.querySelectorAll('div[class="texBlock"]');
        for (let texBlock of texBlocks) {
            texBlock.outerHTML = '$' + texBlock.outerText + '$';
        }
    }
}

function getActiveTextBox() {
    let texButton = document.activeElement;
    let textBoxSelector = 'div[role="textbox"]';
    let editor = texButton.closest('div[class="container--2Rl8H"]');
    let textBox = editor.querySelector(textBoxSelector);
    return textBox;
}

function waitToolBar(node) {
    let composeWindowsObserver = new MutationObserver((mutations, obsorver) => {
        let toolBar = node.querySelector('div[data-id="compose-editor-toolbar"]');
        if (toolBar) {
            insertTexButton(toolBar);
            obsorver.disconnect();
        }    
    })
    composeWindowsObserver.observe(node, {childList: true, subtree: true});
}

function addComposeWindowsObserver(compose_windows_elem) {
    let composeWindowsObserver = new MutationObserver((mutations, obsorver) => {
        let popupClassName = "compose-app_popup";
        for (let mutation of mutations) {
            for (let addedNode of mutation.addedNodes) {
                if (addedNode.classList.contains(popupClassName) >= 0) {
                    let toolBar = addedNode.querySelector('div[data-id="compose-editor-toolbar"]');
                    if (!toolBar || !toolBar.querySelector('div[id="texButton"')) {
                        waitToolBar(addedNode);
                    }
                }
            }
        }
    });
    composeWindowsObserver.observe(compose_windows_elem, {childList: true});
}

function addBodyObserver() {
    let bodyObserver = new MutationObserver((mutations, obobserver) => {
        let firstChild = document.body.firstElementChild;
        if (firstChild.children.length == 1) {
            let compose_class = "compose-windows";
            let child = firstChild.firstChild;
            if (child.classList.contains(compose_class)) {
                addComposeWindowsObserver(child);
                obobserver.disconnect();
            }
        }
    });
    bodyObserver.observe(document.body, {childList: true});
}

addBodyObserver();