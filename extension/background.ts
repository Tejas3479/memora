import { MessageType, MessagePayload } from './lib/messages.js';
import { addToQueue, processQueue, getQueueLength } from './offline.js';

const API_URL = 'http://localhost:4000';

chrome.runtime.onInstalled.addListener(() => {
  // Context menus setup
  chrome.contextMenus.create({
    id: 'capture-selection',
    title: 'Capture selected text',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'open-sidebar',
    title: 'Open Memora sidebar',
    contexts: ['page'],
  });

  // Offline retry alarm every 5 minutes
  chrome.alarms.create('retry-offline-sync', { periodInMinutes: 5 });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'capture-selection') {
    chrome.tabs.sendMessage(
      tab.id,
      { type: MessageType.CAPTURE_SELECTION },
      async (response: any) => {
        if (response && response.selection) {
          const payload = {
            content: response.selection,
            title: response.title,
            url: response.url,
            timestamp: new Date().toISOString(),
            source: 'web',
          };
          await saveMemory(payload);
        }
      }
    );
  } else if (info.menuItemId === 'open-sidebar') {
    // Open sidebar panel
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Alarm retries
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'retry-offline-sync') {
    await runQueueSync();
  }
});

// Router for message ports
chrome.runtime.onMessage.addListener((message: MessagePayload, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((res) => sendResponse(res))
    .catch((err) => sendResponse({ error: err.message }));
  return true; // async
});

async function handleMessage(message: MessagePayload, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case MessageType.CAPTURE_PAGE:
      return saveMemory(message.payload);
    case MessageType.SYNC_QUEUE:
      return runQueueSync();
    case MessageType.GET_STATUS: {
      const qLen = await getQueueLength();
      const credentials = await chrome.storage.local.get(['jwt_token']);
      return {
        queueLength: qLen,
        isAuthenticated: !!credentials.jwt_token,
      };
    }
    case MessageType.SET_TOKEN:
      await chrome.storage.local.set({ jwt_token: message.payload });
      return { success: true };
    case MessageType.GET_CONFIG:
      return chrome.storage.local.get(['autoCaptureEnabled', 'blockedSites']);
    case MessageType.TOGGLE_AUTOCAPTURE: {
      const current = await chrome.storage.local.get(['autoCaptureEnabled']);
      const next = current.autoCaptureEnabled !== false ? false : true;
      await chrome.storage.local.set({ autoCaptureEnabled: next });
      return { autoCaptureEnabled: next };
    }
  }
}

async function saveMemory(payload: any) {
  const credentials = await chrome.storage.local.get(['jwt_token']);
  const token = credentials.jwt_token;

  if (!token) {
    console.warn('[Background] Missing jwt auth token, pushing capture to offline queue.');
    await addToQueue(payload);
    await updateBadge();
    return { queued: true };
  }

  try {
    const response = await fetch(`${API_URL}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return response.json();
    } else {
      console.warn('[Background] Server responded with error, saving to queue.');
      await addToQueue(payload);
      await updateBadge();
      return { queued: true };
    }
  } catch (err) {
    console.warn('[Background] Network fetch failed, saving to queue.');
    await addToQueue(payload);
    await updateBadge();
    return { queued: true };
  }
}

async function runQueueSync() {
  const credentials = await chrome.storage.local.get(['jwt_token']);
  const token = credentials.jwt_token;

  if (!token) return { status: 'unauthorized_no_token' };

  const res = await processQueue(async (payload) => {
    const response = await fetch(`${API_URL}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  });

  await updateBadge();
  return res;
}

async function updateBadge() {
  const len = await getQueueLength();
  const text = len > 0 ? String(len) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
}
