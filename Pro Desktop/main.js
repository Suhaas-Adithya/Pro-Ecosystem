const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let ecosystemProcess;

const PROJECT_ROOT = 'e:\\Projects\\Project Pro';

// App Ports Mapping
const APPS = {
  'launcher': { port: 5172, name: 'Pro Launcher' },
  'browser': { port: 5177, name: 'Pro Browser' },
  'mail': { port: 5187, name: 'Pro Mail' },
  'keep': { port: 5173, name: 'Pro Keep' },
  'chat': { port: 5178, name: 'Pro Chat' },
  'meet': { port: 5174, name: 'Pro Meet' },
  'drive': { port: 5179, name: 'Pro Drive' },
  'calendar': { port: 5180, name: 'Pro Calendar' },
  'dev': { port: 5176, name: 'Pro Dev' },
  'vault': { port: 5181, name: 'Pro Vault' },
  'hub': { port: 5182, name: 'Pro Hub' }
};

function generateShortcuts() {
  const os = require('os');
  const fs = require('fs');
  const { execSync } = require('child_process');
  
  const startMenuDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Pro Ecosystem');
  
  if (fs.existsSync(startMenuDir)) return; // Already generated
  
  console.log('First run detected: Generating Windows Start Menu shortcuts...');
  fs.mkdirSync(startMenuDir, { recursive: true });
  
  const exePath = process.execPath; // Path to the running Electron executable
  
  Object.keys(APPS).forEach(appId => {
    if (appId === 'launcher') return;
    const shortcutPath = path.join(startMenuDir, \`\${APPS[appId].name}.lnk\`);
    
    // Use PowerShell to create the shortcut
    const psScript = \`
      $WshShell = New-Object -comObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut('\${shortcutPath}')
      $Shortcut.TargetPath = '\${exePath}'
      $Shortcut.Arguments = '--launch=\${appId}'
      $Shortcut.Save()
    \`;
    
    try {
      execSync(\`powershell -NoProfile -Command "\${psScript.replace(/\\n/g, ';')}"\`);
    } catch (e) {
      console.error('Failed to create shortcut for', appId, e.message);
    }
  });
}

function createWindow() {
  // Parse launch args: e.g., "Pro Desktop.exe --launch=mail"
  const launchArg = process.argv.find(arg => arg.startsWith('--launch='));
  const targetAppId = launchArg ? launchArg.split('=')[1] : 'launcher';
  const targetApp = APPS[targetAppId] || APPS['launcher'];

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: targetApp.name,
    autoHideMenuBar: true,
    frame: targetAppId === 'launcher' ? false : true,
    transparent: targetAppId === 'launcher' ? true : false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Start the ecosystem in the background if it's the launcher or main wrapper
  console.log('Booting Pro Ecosystem from', PROJECT_ROOT);
  ecosystemProcess = spawn('node', ['start_all.js'], {
    cwd: PROJECT_ROOT,
    shell: true,
    detached: false
  });

  ecosystemProcess.stdout.on('data', (data) => {
    console.log(\`[Ecosystem] \${data}\`);
  });

  ecosystemProcess.stderr.on('data', (data) => {
    console.error(\`[Ecosystem ERROR] \${data}\`);
  });

  if (process.platform === 'win32') {
    generateShortcuts();
  }

  // Wait 5 seconds for Vite servers to start before loading the URL
  setTimeout(() => {
    mainWindow.loadURL(\`http://localhost:\${targetApp.port}\`);
  }, 5000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Handle multi-window IPC from the frontend
ipcMain.on('open-app', (event, { url, title }) => {
  const childWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: title || 'Pro App',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  childWindow.loadURL(url);
});

ipcMain.on('window-control', (event, action) => {
  if (mainWindow) {
    if (action === 'minimize') mainWindow.minimize();
    if (action === 'maximize') {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
    if (action === 'close') mainWindow.close();
  }
});

app.whenReady().then(() => {
  app.setAppUserModelId("com.prosuite.os");
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Ensure we kill the detached ecosystem process when Electron quits
app.on('will-quit', () => {
  if (ecosystemProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', ecosystemProcess.pid, '/f', '/t']);
      } else {
        process.kill(-ecosystemProcess.pid);
      }
    } catch (e) {
      console.error('Failed to kill ecosystem process', e);
    }
  }
});
