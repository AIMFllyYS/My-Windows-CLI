import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { runDesktopCli } from './cli-runner';

function isAllowedRendererUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  } catch {
    return false;
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: '0-1 CLI',
    backgroundColor: '#101113',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    if (!isAllowedRendererUrl(devUrl)) throw new Error('VITE_DEV_SERVER_URL must point to localhost.');
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('cli:run', (event, command: string) => {
    const senderUrl = event.senderFrame?.url || '';
    if (senderUrl.startsWith('file:') || isAllowedRendererUrl(senderUrl)) {
      return runDesktopCli(command);
    }
    return { ok: false, output: 'IPC sender is not trusted.' };
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
