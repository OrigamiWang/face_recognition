const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const { server, shutdownServer } = require('./server.js');
const fs = require('fs');
const { shell } = require('electron');

let mainWindow;
let forceQuit = false;

const logPath = path.join(app.getPath('userData'), 'logs.txt');

// 重定向 console.log 和 console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function() {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - LOG: ${Array.from(arguments).join(' ')}\n`);
    originalConsoleLog.apply(console, arguments);
};

console.error = function() {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ERROR: ${Array.from(arguments).join(' ')}\n`);
    originalConsoleError.apply(console, arguments);
};

process.on('uncaughtException', (error) => {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - UNCAUGHT EXCEPTION: ${error.stack}\n`);
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadURL('http://localhost:8668');
    mainWindow.setFullScreen(true);

    const menu = Menu.buildFromTemplate([
        {
            label: 'View',
            submenu: [
                {
                    label: 'Open Logs',
                    click: () => {
                        shell.openPath(logPath);
                    }
                }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.on('close', function (e) {
        if (!forceQuit) {
            e.preventDefault();
            cleanShutdown();
        }
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    forceQuit = true;
    app.quit();
});

app.on('before-quit', (e) => {
    if (!forceQuit) {
        e.preventDefault();
        cleanShutdown();
    }
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
    else mainWindow.show();
});

// 添加这个函数来确保应用程序和服务器都正确关闭
async function cleanShutdown() {
    console.log('Cleaning up before shutdown...');
    try {
        if (mainWindow) {
            mainWindow.hide();
            mainWindow.destroy();
        }
        await shutdownServer();
        console.log('Server closed');
    } catch (error) {
        console.error('Error shutting down server:', error);
    }
    forceQuit = true;
    app.quit();
}

app.on('will-quit', () => {
    forceQuit = true;
});

// 添加这个处理器来确保应用程序在更新时能够正确退出
app.on('quit', () => {
    forceQuit = true;
    app.quit();
});