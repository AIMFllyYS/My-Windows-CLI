import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('zeroOneCli', {
  runCommand: (command: string) => ipcRenderer.invoke('cli:run', command),
  getLatestRelease: () => ipcRenderer.invoke('release:getLatest'),
  openLatestRelease: () => ipcRenderer.invoke('release:openLatest'),
});
