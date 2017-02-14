/**
 * Links buttons to panels
 * Linking button's tag 'data-panel' to panel's id'
 * 
 * 
 * @param {Element[]} buttons
 * @param {string} [buttonActiveClass="active"]
 * @param {string} [panelActiveClass="active"]
 */
function linkPanelsByDataset(buttons, buttonActiveClass = "active", panelActiveClass = "active") {
    for (var i = 0; i < panelButtons.length; i++) {
        let button = panelButtons[i];
        button.addEventListener('click', function (e) {
            // Hiding panel
            let activePanel = document.getElementsByClassName(panelActiveClass)[0];
            activePanel.classList.remove(panelActiveClass);
            
            // De-activating button
            document.querySelector(".nav-group-item." + buttonActiveClass).classList.remove(buttonActiveClass);

            // displaying panel
            document.getElementById(button.dataset.panel).classList.add(panelActiveClass);

            // Activating button
            button.classList.add(buttonActiveClass);
        });
    }
}