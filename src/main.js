const { app, BrowserWindow, shell, session, Menu, Tray, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');

// Add command-line switches to prevent notification/audio crashes
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Conditionally disable GPU acceleration for development in containers
// This is controlled by the DISABLE_GPU environment variable
if (process.env.DISABLE_GPU === 'true') {
  console.log('Running in containerized environment - disabling GPU acceleration');
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('no-sandbox');
}

// Keep references to prevent garbage collection
let mainWindow = null;
let tray = null;

// Teams Web URL
const TEAMS_URL = 'https://teams.microsoft.com/v2/';

// Chrome-like user agent for better compatibility with Microsoft services
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    title: 'Microsoft Teams',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      // Persist session data (cookies, localStorage, etc.)
      partition: 'persist:teams',
      // Disable backgroundThrottling to prevent crashes with notifications
      backgroundThrottling: false
    }
  });

  // Set user agent for compatibility
  mainWindow.webContents.setUserAgent(USER_AGENT);

  // Load Teams
  mainWindow.loadURL(TEAMS_URL);

  // Handle permission requests (notifications, etc.)
  session.fromPartition('persist:teams').setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowedPermissions = ['notifications', 'clipboard-read', 'clipboard-write', 'media'];
      console.log(`Permission requested: ${permission}`);
      if (allowedPermissions.includes(permission)) {
        console.log(`Permission granted: ${permission}`);
        callback(true);
      } else {
        console.log(`Permission denied: ${permission}`);
        callback(false);
      }
    }
  );

  // Log console messages from the web page for debugging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level === 3) { // Error level
      console.error(`[WebContent Error] ${message}`);
    }
  });

  // Handle Service Worker errors to prevent crashes
  mainWindow.webContents.session.serviceWorkers.on('console-message', (event, messageDetails) => {
    console.log(`[Service Worker] ${messageDetails.message}`);
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Microsoft/Teams related domains to open in app
    const allowedDomains = [
      'teams.microsoft.com',
      'teams.cloud.microsoft',
      'teams.events.data.microsoft.com',
      'teams.cdn.office.net',
      'teams.office.com',
      'teams.live.com',
      'cosmic.office.net',
      'login.microsoftonline.com',
      'login.live.com',
      'account.live.com',
      'graph.microsoft.com',
      'microsoft.com'
    ];

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );

    if (isAllowed) {
      return { action: 'allow' };
    } else {
      shell.openExternal(url);
      return { action: 'deny' };
    }
  });

  // Handle navigation within the same window
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const urlObj = new URL(url);
    const allowedDomains = [
      'teams.microsoft.com',
      'teams.cloud.microsoft',
      'teams.events.data.microsoft.com',
      'teams.cdn.office.net',
      'teams.office.com',
      'teams.live.com',
      'cosmic.office.net',
      'login.microsoftonline.com',
      'login.live.com',
      'account.live.com',
      'graph.microsoft.com'
    ];

    const isAllowed = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Update window title based on page title
  mainWindow.webContents.on('page-title-updated', (event, title) => {
    mainWindow.setTitle(title || 'Microsoft Teams');
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details);
    if (details.reason !== 'clean-exit') {
      // Reload the page after a crash
      console.log('Reloading page after crash...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
        }
      }, 1000);
    }
  });

  // Handle unresponsive renderer
  mainWindow.on('unresponsive', () => {
    console.warn('Window became unresponsive');
  });

  mainWindow.on('responsive', () => {
    console.log('Window became responsive again');
  });

  // Handle page crashes
  mainWindow.webContents.on('crashed', () => {
    console.error('Page crashed, reloading...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  // Remove the menu bar
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  // Handle window close - minimize to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Try to load icon, fall back to empty image if not found
  let icon;
  try {
    icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'icon.png'));
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch (e) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Microsoft Teams');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Microsoft Teams',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// Handle app ready
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Handle notifications from renderer process
  ipcMain.on('show-notification', (event, { title, body, icon, tag }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, '..', 'assets', 'icon.png')
      });

      notification.on('click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
        event.sender.send(`notification-clicked-${tag || 'default'}`);
      });

      notification.show();
    }
  });
});

// Handle all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

// Handle before-quit to properly close
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Handle second instance (single instance lock)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
