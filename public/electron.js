const { app, BrowserWindow } = require('electron');
const path = require('path');
const isdev = require('electron-is-dev');

let mainWindow = null;


const createWindow = () => {

    mainWindow = new BrowserWindow({ width: 1200, height: 800 });
    
    mainWindow.loadURL(isdev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
    // mainWindow.webContents.openDevTools(); // Uncomment if for devtools on launch
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit(); 
});

app.on('activate', () => {
    if (mainWindow === null)
        createWindow();
})