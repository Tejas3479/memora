import { MessageType } from './lib/messages.js';

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('status-badge');
  const captureBtn = document.getElementById('capture-btn');
  const syncBtn = document.getElementById('sync-btn');
  const autoCaptureCheck = document.getElementById('auto-capture-check') as HTMLInputElement;

  // Initialize status
  const updateStatus = async () => {
    chrome.runtime.sendMessage({ type: MessageType.GET_STATUS }, (response) => {
      if (response) {
        statusBadge!.innerText = response.isAuthenticated ? 'Logged In' : 'Logged Out';
        statusBadge!.style.color = response.isAuthenticated ? '#10b981' : '#ef4444';
        syncBtn!.innerText = `Sync Offline Queue (${response.queueLength || 0})`;
      }
    });
  };

  await updateStatus();

  // Load config
  chrome.runtime.sendMessage({ type: MessageType.GET_CONFIG }, (response) => {
    if (response) {
      autoCaptureCheck.checked = response.autoCaptureEnabled !== false;
    }
  });

  // Capture current tab
  captureBtn!.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    captureBtn!.innerText = 'Capturing...';
    
    // Inject readability / content scrape on active page
    chrome.tabs.sendMessage(tab.id, { type: MessageType.CAPTURE_SELECTION }, (response) => {
      // Background message routing takes care of page captures or selection
      chrome.runtime.sendMessage({
        type: MessageType.CAPTURE_PAGE,
        payload: {
          content: response?.selection || 'Manual page extract content text placeholder.',
          title: tab.title || 'Tab title',
          url: tab.url || '',
          timestamp: new Date().toISOString(),
          source: 'web',
        },
      }, () => {
        captureBtn!.innerText = 'Captured!';
        setTimeout(() => {
          captureBtn!.innerText = 'Capture Page';
          updateStatus();
        }, 1500);
      });
    });
  });

  // Trigger Sync
  syncBtn!.addEventListener('click', () => {
    syncBtn!.innerText = 'Syncing...';
    chrome.runtime.sendMessage({ type: MessageType.SYNC_QUEUE }, () => {
      syncBtn!.innerText = 'Synced!';
      setTimeout(() => {
        updateStatus();
      }, 1000);
    });
  });

  // Toggle Settings
  autoCaptureCheck.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: MessageType.TOGGLE_AUTOCAPTURE });
  });
});
