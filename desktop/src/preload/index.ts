import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('zeroOneCli', {
  runCommand: (command: string) => ipcRenderer.invoke('cli:run', command),
});
