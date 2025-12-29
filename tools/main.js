const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');

let mainWindow;
let serverProcess = null;

const os = require('os');
const BLUEPRINT_DIR = path.join('C:', 'Users', os.userInfo().username, 'Desktop', 'Blueprint');

// Gracefully shutdown MCP server following protocol specification
async function gracefulShutdown(proc) {
  if (!proc || proc.killed) return;

  return new Promise((resolve) => {
    // Close stdin to signal shutdown to the server
    if (proc.stdin && !proc.stdin.destroyed) {
      proc.stdin.end();
    }

    // Wait up to 5 seconds for graceful exit
    const gracefulTimeout = setTimeout(() => {
      if (!proc.killed) {
        // Send SIGTERM (terminate signal)
        proc.kill('SIGTERM');

        // Wait another 3 seconds before SIGKILL
        const killTimeout = setTimeout(() => {
          if (!proc.killed) {
            proc.kill('SIGKILL'); // Force kill
          }
          resolve();
        }, 3000);

        proc.on('exit', () => {
          clearTimeout(killTimeout);
          resolve();
        });
      }
    }, 5000);

    // If process exits gracefully, clear timeout
    proc.on('exit', () => {
      clearTimeout(gracefulTimeout);
      resolve();
    });
  });
}

// Kill any existing server.js processes
async function killExistingServers() {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      // Use wmic to find node.exe processes running server.js
      const cmd = 'wmic process where "name=\'node.exe\' and CommandLine like \'%server.js%\'" get ProcessId';

      exec(cmd, (error, stdout) => {
        if (error || !stdout) {
          resolve();
          return;
        }

        const lines = stdout.split('\n').slice(1); // Skip header
        const pids = lines
          .map(line => line.trim())
          .filter(line => line && /^\d+$/.test(line));

        if (pids.length === 0) {
          resolve();
          return;
        }

        // Try graceful shutdown first with taskkill (without /F)
        exec(`taskkill /PID ${pids.join(' /PID ')}`, (err) => {
          // Wait 3 seconds for graceful shutdown
          setTimeout(() => {
            // Force kill any remaining processes
            exec(`taskkill /F /PID ${pids.join(' /PID ')}`, () => {
              resolve();
            });
          }, 3000);
        });
      });
    } else {
      // Unix: Send SIGTERM first, then SIGKILL if needed
      exec("pgrep -f 'node.*server\\.js'", (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n').join(' ');

        // Send SIGTERM for graceful shutdown
        exec(`kill -TERM ${pids}`, () => {
          // Wait 3 seconds then force kill if needed
          setTimeout(() => {
            exec(`kill -9 ${pids}`, () => {
              resolve();
            });
          }, 3000);
        });
      });
    }
  });
}

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

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  // Gracefully shutdown tracked process
  if (serverProcess) {
    await gracefulShutdown(serverProcess);
  }

  // Kill any other server processes
  await killExistingServers();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault();

  if (serverProcess) {
    await gracefulShutdown(serverProcess);
  }
  await killExistingServers();

  app.exit(0);
});

// IPC handlers
ipcMain.handle('restart-server', async () => {
  try {
    // Gracefully shutdown existing tracked process
    if (serverProcess) {
      await gracefulShutdown(serverProcess);
      serverProcess = null;
    }

    // Kill any other existing servers
    await killExistingServers();

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Start new server process
    serverProcess = spawn('node', ['server.js'], {
      cwd: BLUEPRINT_DIR,
      stdio: 'pipe',
      windowsHide: true
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Server exited with code ${code}`);
      }
      serverProcess = null;
    });

    return { success: true, message: 'Server restarted successfully' };
  } catch (error) {
    return { success: false, message: `Failed to restart: ${error.message}` };
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
  return new Promise((resolve) => {
    const cmd = 'wmic process where "name=\'node.exe\' and CommandLine like \'%server.js%\'" get ProcessId';

    exec(cmd, (error, stdout) => {
      const running = !error && stdout.split('\n').slice(1).some(line => /^\d+$/.test(line.trim()));
      resolve({ running });
    });
  });
});