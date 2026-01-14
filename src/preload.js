// Preload script for secure context isolation
// This script runs in a sandboxed context and can expose limited APIs to the renderer

const { contextBridge, ipcRenderer } = require('electron');

// Create a custom Notification class that uses native Electron notifications
class ElectronNotification {
  constructor(title, options = {}) {
    this.title = title;
    this.body = options.body || '';
    this.icon = options.icon || '';
    this.tag = options.tag || '';
    this.onclick = null;
    this.onclose = null;
    this.onerror = null;
    this.onshow = null;

    const notificationId = this.tag || `notif-${Date.now()}`;

    // Send to main process for native notification
    ipcRenderer.send('show-notification', {
      title: this.title,
      body: this.body,
      icon: this.icon,
      tag: notificationId
    });

    // Listen for click events from main process
    ipcRenderer.once(`notification-clicked-${notificationId}`, () => {
      if (this.onclick) this.onclick();
    });

    // Trigger onshow callback
    setTimeout(() => {
      if (this.onshow) this.onshow();
    }, 0);
  }

  close() {
    if (this.onclose) this.onclose();
  }

  static get permission() {
    return 'granted';
  }

  static requestPermission(callback) {
    if (callback) callback('granted');
    return Promise.resolve('granted');
  }
}

// Override the global Notification with our custom implementation
window.Notification = ElectronNotification;

// Log that preload script has loaded (for debugging)
console.log('Electron Teams preload script loaded - native notifications enabled');
