'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nachtblau', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  probeServer: () => ipcRenderer.invoke('server:probe'),
  login: () => ipcRenderer.invoke('auth:login'),
  submitRedirect: (text) => ipcRenderer.invoke('auth:submitRedirect', text),
  cancelLogin: () => ipcRenderer.invoke('auth:cancel'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  setMemory: (gb) => ipcRenderer.invoke('settings:setMemory', gb),
  launch: () => ipcRenderer.invoke('game:launch'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onAuthChanged: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('auth:changed', handler);
    return () => ipcRenderer.removeListener('auth:changed', handler);
  },
  onAuthStatus: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('auth:status', handler);
    return () => ipcRenderer.removeListener('auth:status', handler);
  },
  onLaunchStatus: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('launch:status', handler);
    return () => ipcRenderer.removeListener('launch:status', handler);
  },
  onUpdateStatus: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  },
});
