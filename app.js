const electron = require('electron')
const { app, BrowserWindow, ipcMain, nativeImage } = electron;

//var tcpp = require('tcp-ping');
var http = require('http');

let trayIcon = nativeImage.createFromPath("warframe_logo.ico");
var win; // App window

app.on('window-all-closed', (event) => {
    event.preventDefault();
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', () => {
    setupWindow();
})

function setupWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: "file://${__dirname}/warframe_logo.ico",
        title: "Seblor's Toolbox"
    });
    win.setMenu(null);
    win.loadURL(`file://${__dirname}/front/index.html`)
    win.setRepresentedFilename("warframe_logo.ico"); // Mac
    win.setIcon(trayIcon) // Windows Linux

    win.webContents.openDevTools();
}

/**
 * ---------------- Ping ----------------
 */


var timer = new Timer();
var timeout = null;
var req, listenerSet = false, pongSent = false;

ipcMain.on('asynchronous-message', (event, arg) => {
    pongSent = false;
    if (arg.type == "ping") {

        timer.start("ping");

        req = http.request({ method: 'HEAD', host: arg.target }, function (res) {
            var time = timer.end("ping") / 2;
            //clearTimeout(timeout);
            pongSent = true;
            try { // catching when object destroyed
                event.sender.send('asynchronous-reply', {
                    type: 'pong',
                    error: false,
                    time: time
                });
            } catch (error) { }
        })
        req.end();

        // Catching errors
        if (!listenerSet) {
            req.setTimeout(1000, function (err) {
                console.error('Timeout');
                req.abort();
                timer.end("ping");
                if (!pongSent) {
                    sendError(event);
                }
            });
            req.on('error', function (err) {
                //clearTimeout(timeout);
                timer.end("ping")
                req.abort();
                if (!pongSent) {
                    sendError(event);
                };
            })
        }



    }
})

/**
 * ---------------- Functions ----------------
 */


function sendError(event) {
    try { // catching when object destroyed
        event.sender.send('asynchronous-reply', {
            type: 'pong',
            error: true,
            time: 1000
        });
    } catch (error) { }
    pongSent = true;
}

function Timer() {
    this._times = new Map();
    Timer.prototype.start = function (label) {
        this._times.set(label, Date.now());
    };
    Timer.prototype.end = function (label) {
        try {
            var time = this._times.get(label);
            if (!time) {
                throw new Error('No such label: ' + label);
            }
            var duration = Date.now() - time;
            return duration;
        } catch (error) {
            return -1;
        }
    };
};