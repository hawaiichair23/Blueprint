const { ipcRenderer } = require('electron');

// DOM elements
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const restartBtn = document.getElementById('restartBtn');
const generateBtn = document.getElementById('generateBtn');
const logDiv = document.getElementById('log');

// Update status display
function updateStatus(isRunning) {
  if (isRunning) {
    statusDiv.className = 'status running';
    statusText.textContent = '🟢 Server is running';
  } else {
    statusDiv.className = 'status stopped';
    statusText.textContent = '🔴 Server is stopped';
  }
}

// Log messages
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logDiv.textContent = `[${timestamp}] ${message}`;
}

// Check server status on startup
async function checkStatus() {
  try {
    const result = await ipcRenderer.invoke('check-server-status');
    updateStatus(result.running);
  } catch (error) {
    log(`Error checking status: ${error.message}`);
  }
}

// Restart server button
restartBtn.addEventListener('click', async () => {
  restartBtn.classList.add('loading');
  restartBtn.textContent = 'Restarting...';
  log('Restarting server...');
  
  try {
    const result = await ipcRenderer.invoke('restart-server');
    
    if (result.success) {
      log('✅ Server restarted successfully');
      updateStatus(true);
    } else {
      log(`❌ ${result.message}`);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`);
  } finally {
    restartBtn.classList.remove('loading');
    restartBtn.textContent = 'Restart Server';
  }
});

// Generate pages button
generateBtn.addEventListener('click', async () => {
  generateBtn.classList.add('loading');
  generateBtn.textContent = 'Generating...';
  log('Generating pages...');
  
  try {
    const result = await ipcRenderer.invoke('generate-pages');
    
    if (result.success) {
      log('✅ Pages generated successfully');
      if (result.message.trim()) {
        log(result.message);
      }
    } else {
      log(`❌ ${result.message}`);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`);
  } finally {
    generateBtn.classList.remove('loading');
    generateBtn.textContent = 'Generate Pages';
  }
});

// Check status on startup
checkStatus();