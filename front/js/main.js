var panelButtons = document.getElementsByClassName("nav-group-item");
const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

ready(init);

function init() {
    var buttons = document.getElementsByClassName("nav-group-item");
    linkPanelsByDataset(buttons, "active", "main-panel-active");
}

function getElementIndex(element) {
    var i = 0;
    while ((element = element.previousSibling) != null)
        i++;
}