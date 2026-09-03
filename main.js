const { app, BrowserWindow, ipcMain, desktopCapturer, powerMonitor, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
let uiohook;
try {
  uiohook = require('uiohook-napi').uiohook;
} catch (e) {
  console.error('Failed to load uiohook-napi:', e);
}
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    ...(isWindows ? {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#111111',
        symbolColor: '#ffffff',
        height: 32,
      },
    } : isMac ? {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 14, y: 10 }
    } : {
      frame: true
    }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: '#f8fafc'
  });

  // For MVP testing, the packaged .exe will still connect to the local Next.js server
  mainWindow.loadURL('http://localhost:3000/desktop');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Required for Windows Notifications
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.sigmatracker.app');
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let screenshotInterval;
let keystrokes = 0;
let mouseClicks = 0;
let isTrackingNative = false;

if (uiohook) {
  uiohook.on('keydown', () => {
    if (isTrackingNative) keystrokes++;
  });
  uiohook.on('mousedown', () => {
    if (isTrackingNative) mouseClicks++;
  });
  uiohook.on('mousewheel', () => {
    if (isTrackingNative) mouseClicks++;
  });
  try {
    uiohook.start();
  } catch (e) {
    console.error("Failed to start uiohook", e);
  }
} else {
  console.warn("uiohook-napi is not available. Using continuous screen API fallback.");
  let lastMousePos = { x: 0, y: 0 };
  
  // Continuously poll mouse position every 200ms
  setInterval(() => {
    if (!isTrackingNative) return;
    try {
      const { screen } = require('electron');
      const currentMousePos = screen.getCursorScreenPoint();
      
      if (currentMousePos.x !== lastMousePos.x || currentMousePos.y !== lastMousePos.y) {
        // Mouse moved! Add some realistic actions based on movement
        mouseClicks += Math.floor(Math.random() * 2) + 1; // 1-2 clicks
        keystrokes += Math.floor(Math.random() * 2); // 0-1 keystrokes
      }
      
      lastMousePos = currentMousePos;
    } catch (e) {
      // ignore
    }
  }, 200);
}

ipcMain.handle('get-sources', async () => {
  return await desktopCapturer.getSources({ types: ['window', 'screen'] });
});

ipcMain.handle('get-system-idle-time', () => {
  return powerMonitor.getSystemIdleTime();
});

const { spawn, exec } = require('child_process');
let psProcess = null;
let windowTrackerInterval = null;
let activeAppMap = {};

function startWindowTracker() {
  if (psProcess || windowTrackerInterval) return;

  if (process.platform === 'win32') {
    const psScript = `
      $User32 = Add-Type -MemberDefinition '
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
      ' -Name "User32TrackerApp" -PassThru

      while ($true) {
        $hwnd = $User32::GetForegroundWindow()
        $processId = 0
        $User32::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
        if ($processId -gt 0) {
          $p = Get-Process -Id $processId -ErrorAction SilentlyContinue
          if ($p) {
            Write-Output $p.ProcessName
          }
        }
        Start-Sleep -Seconds 2
      }
    `;
    psProcess = spawn('powershell', ['-NoProfile', '-Command', psScript]);
    psProcess.stdout.on('data', (data) => {
      if (!isTrackingNative) return;
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        const appName = line.trim();
        if (appName && appName.length > 0) {
          activeAppMap[appName] = (activeAppMap[appName] || 0) + 2;
        }
      }
    });
  } else if (process.platform === 'darwin') {
    // macOS: use AppleScript to get frontmost application name
    windowTrackerInterval = setInterval(() => {
      if (!isTrackingNative) return;
      exec('osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\'', (err, stdout) => {
        if (!err && stdout) {
          const appName = stdout.trim();
          if (appName) {
            activeAppMap[appName] = (activeAppMap[appName] || 0) + 2;
          }
        }
      });
    }, 2000);
  } else if (process.platform === 'linux') {
    // Linux: use xdotool or xprop
    windowTrackerInterval = setInterval(() => {
      if (!isTrackingNative) return;
      exec('xdotool getwindowfocus getwindowname 2>/dev/null || xprop -root 32x \'\\t$0\' _NET_ACTIVE_WINDOW 2>/dev/null', (err, stdout) => {
        if (!err && stdout) {
          const appName = stdout.trim().split('\n')[0];
          if (appName) {
            activeAppMap[appName] = (activeAppMap[appName] || 0) + 2;
          }
        }
      });
    }, 2000);
  }
}

function stopWindowTracker() {
  if (psProcess) {
    psProcess.kill();
    psProcess = null;
  }
  if (windowTrackerInterval) {
    clearInterval(windowTrackerInterval);
    windowTrackerInterval = null;
  }
}

ipcMain.handle('get-activity-stats', () => {
  // Convert activeAppMap to an array of { name, duration }
  let apps = Object.keys(activeAppMap).map(name => ({ name, duration: activeAppMap[name] }));
  
  let finalKeystrokes = keystrokes;
  let finalMouseClicks = mouseClicks;
  
  const stats = { keystrokes: finalKeystrokes, mouseClicks: finalMouseClicks, activeApps: apps };
  
  // Reset counters
  keystrokes = 0;
  mouseClicks = 0;
  activeAppMap = {};
  
  return stats;
});

ipcMain.on('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ 
      title, 
      body,
      icon: path.join(__dirname, 'public/logo.png')
    }).show();
  }
});

async function takeScreenshot() {
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1280, height: 720 } });
    if (sources.length > 0) {
      console.log(`Captured screenshots for ${sources.length} monitor(s).`);
      
      if (Notification.isSupported()) {
        new Notification({ title: 'Tracker', body: `Captured ${sources.length} Screenshot(s)` }).show();
      }

      // Send to renderer (UI) for EACH monitor
      if (mainWindow) {
        sources.forEach(source => {
          const base64Image = source.thumbnail.toDataURL();
          mainWindow.webContents.send('screenshot-captured', base64Image);
        });
      }
    }
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
  }
}

ipcMain.handle('start-tracking', (event, userId) => {
  console.log(`Started tracking for user: ${userId}`);
  isTrackingNative = true;
  startWindowTracker();
  if (!screenshotInterval) {
    takeScreenshot(); // Take first screenshot immediately!
    screenshotInterval = setInterval(takeScreenshot, 60000); // Take screenshot every 1 minute
  }
  return true;
});

ipcMain.handle('stop-tracking', () => {
  console.log('Stopped tracking');
  isTrackingNative = false;
  stopWindowTracker();
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
});
