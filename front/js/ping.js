// Ping time variables
var line;
var error = 0;
var target = "google.com";

// Chart using smoothieJS
var smoothie;

// Regular expression checking URL as valid recipient
var targetRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(([0-9A-Fa-f]{1,4}:){0,5}:((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|(::([0-9A-Fa-f]{1,4}:){0,5}((b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b).){3}(b((25[0-5])|(1d{2})|(2[0-4]d)|(d{1,2}))b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$|([0-9A-Za-z]{2,}\.[0-9A-Za-z]{2,3}\.[0-9A-Za-z]{2,3}|[0-9A-Za-z]{2,}\.[0-9A-Za-z]{2,5})$/

var intervalTimeout;
var totalTimeout = 0;

var defaultPingDelay = 500;

// Timespan while disconnected
var timespan = 0;
var errorStartTime;

function ready(fn) {
    if (document.readyState != 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

/**
 * ---------------- Entry point ----------------
 */
ready(init);


/**
 * Initialising the panel
 */
function init() {
    document.getElementById('pingDelayDisplay').innerText =
        `Delay between pings: ${defaultPingDelay}ms`;
    document.getElementById('pingDelay').value = defaultPingDelay;

    registerEvents();
    initPingChart();
}

/**
 * Now Unused function (keeping it in case of further need)
 * Used to return the element index withing parent node
 * 
 * @param {element} element
 * @returns index of element
 * 
function findElementIndex(element) {
    var index = 0, e = element;

    while (e = e.previousElementSibling) { ++index; }
    return index;
}
*/

/**
 * Changing ping recipient (highlight in green if URL valid, or red otherwise)
 * 
 * @param {any} event
 * @returns
 */
function changeTarget(event) {
    var element = event.target;
    var value = element.children[0].value;
    var successClass = "input-fail";

    // Checking URL
    if (value.match(targetRegex) != null) {
        target = value;
        successClass = "input-success"
    }
    else if (value == "") {
        target = "google.com";
    }
    var input = document.querySelector('form[data-use="ping"] > input');

    // Setting highlight
    input.classList.add(successClass);

    // Removing the highlight
    setTimeout(function () {
        input.classList.remove(successClass);
    }, 1000);

    return false;
}


/**
 * Initializing ping chart with google.com as ping recipient, and seting graph style
 */
function initPingChart() {

    smoothie = new SmoothieChart({
        grid: {
            lineWidth: 1,
            millisPerLine: 0,
            verticalSections: 6
        },
        minValue: 0
    });

    line = new TimeSeries();

    target = "google.com";

    smoothie.addTimeSeries(line, { lineWidth: 2, strokeStyle: '#00ff00', fillStyle: 'rgba(0,128,0,0.30)' });

    smoothie.streamTo(document.getElementById("pingCanvas0"), 500);

    // Sending first ping request to back-end
    ipcRenderer.send('asynchronous-message', {
        type: 'ping',
        target: target
    });
}

/**
 * ---------------- Events ----------------
 */
ipcRenderer.on('asynchronous-reply', (event, arg) => {

    if (arg.type == "pong") {
        //console.log(arg.time);
        if (arg.error) {
            if (typeof error == "undefined") {
                // Checking if error variable is defined
                error = 0;
            }
            if (error == 1) {
                // Error starting after 2nd failed ping
                errorStartTime = new Date();
            }

            error++;

            if (error == 3) {
                // If 3 errors in a row
                DisconnectedNotice("start");
            }
            else if (error < 3 && typeof line.data[line.data.length - 1] != "undefined") {
                // Setting last latency value for the 3 first errors 
                arg.time = line.data[line.data.length - 1][1];
            }
        } else {
            if (error > 0) {
                // If no more errors
                DisconnectedNotice("stop");
                error = 0;
            }
        }

        // Adding ping time to graph
        line.append(new Date().getTime(), arg.time);

        // Displaying current ping
        document.getElementById("currentPing").innerText = Math.round(arg.time) + "ms";


        // Sending a new ping request to back-end after delay
        setTimeout(function () {
            ipcRenderer.send('asynchronous-message', {
                type: 'ping',
                target: target
            });
        }, document.getElementById('pingDelay').value);
    }
})

function registerEvents() {
    document.querySelector('form[data-use="ping"]').onsubmit = changeTarget;

    document.getElementById('pingDelay').addEventListener("input", (e) => {
        document.getElementById('pingDelayDisplay').innerText =
            `Delay between pings: ${e.target.value}ms`;
    });
}



/**
 * ---------------- Methods ----------------
 */

/**
 * Change display according to state, and adds time span when disconnected
 * 
 * @param {boolean} state: true if disconnected
 */
function DisconnectedNotice(state) {

    // If error occured, set timespan to 0
    if (Number.isNaN(timespan)) {
        timespan = 0;
    }

    var hexColor, rgbaStyle;

    if (state == "start") {
        hexColor = '#ff0000';
        rgbaStyle = 'rgba(128,0,0,0.30)';

        // Creating timeout timer
        intervalTimeout = setInterval(function () {
            // Calculating current disconnect session length 
            timespan = new Date().getTime() - errorStartTime.getTime();


            // Updating the displayed counters
            document.getElementById('timeout0').innerText = `Server disconnected for ${timespan++}ms`;

            // Addition to keep the numbers synchronized
            document.getElementById('total-timeout0').innerText = "Server disconnected for a total of " + msToHMSs(totalTimeout + timespan);
        }, 1);

    }
    else if (state == "stop") {
        if (typeof errorStartTime === "undefined") {
            return;
        }
        
        hexColor = '#00ff00';
        rgbaStyle = 'rgba(0,128,0,0.30)';

        // Stopping timeout timer
        clearInterval(intervalTimeout);

        // Updating total timeout counter
        totalTimeout += (new Date().getTime() - errorStartTime.getTime());
        errorStartTime = undefined;

        // Updating the displayed counters
        document.getElementById('timeout0').innerText = `Server reconnected`;
        document.getElementById('total-timeout0').innerText = "Server disconnected for a total of " + msToHMSs(totalTimeout);

    }

    // Recoloring graph
    smoothie.removeTimeSeries(line);
    smoothie.addTimeSeries(line, { lineWidth: 2, strokeStyle: hexColor, fillStyle: rgbaStyle });

}

/**
 * Return string with hours minutes seconds
 */
function msToHMSs(ms) {
    // 1- Convert to seconds:
    var seconds = ms / 1000;
    // 2- Extract hours:
    var hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    var minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;

    hours = Math.floor(hours);
    minutes = Math.floor(minutes);
    seconds = Math.floor(seconds);

    return hours + "h " + minutes + "m " + seconds + "s " + ms % 1000 + "ms";
}