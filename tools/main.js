const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');

let mainWindow;
let serverProcess = null;

// Get the Blueprint directory
const os = require('os');
const BLUEPRINT_DIR = path.join('C:', 'Users', os.userInfo().username, 'Desktop', 'Blueprint');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    resizable: false,
    title: 'Blueprint Server Manager'
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Kill server process when app closes
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for renderer process
ipcMain.handle('restart-server', async () => {
  try {
    // Kill existing server
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }

    // Start new server process
    serverProcess = spawn('node', ['server.js'], {
      cwd: BLUEPRINT_DIR,
      stdio: 'pipe', // Capture output
      windowsHide: true // Hide command window on Windows
    });

    return { success: true, message: 'Server restarted successfully' };
  } catch (error) {
    return { success: false, message: `Failed to restart server: ${error.message}` };
  }
});

ipcMain.handle('generate-pages', async () => {
  return new Promise((resolve) => {
    exec('node generate.js', { cwd: BLUEPRINT_DIR }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, message: `Error: ${stderr || error.message}` });
      } else {
        resolve({ success: true, message: stdout || 'Pages generated successfully' });
      }
    });
  });
});

ipcMain.handle('check-server-status', async () => {
  return { running: serverProcess !== null && !serverProcess.killed };
});