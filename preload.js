const { contextBridge, ipcRenderer } = require('electron');
const ThemeConfig = require('./themeConfig.js');

contextBridge.exposeInMainWorld('electronBridge', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

// Secure layout parameters exposure channel routing
contextBridge.exposeInMainWorld('themeConfig', ThemeConfig);
