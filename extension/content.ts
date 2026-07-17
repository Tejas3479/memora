import { MessageType } from './lib/messages.js';

// Auto-capture watcher
async function initAutoCapture() {
  const config = await chrome.storage.local.get(['autoCaptureEnabled', 'blockedSites']);
  const enabled = config.autoCaptureEnabled !== false;
  const blocked = config.blockedSites || [];

  const currentUrl = window.location.href;
  const isBlocked = blocked.some((site: string) => currentUrl.includes(site));

  if (enabled && !isBlocked) {
    // Wait for document to settle
    setTimeout(() => {
      const pageInfo = extractPageDetails();
      chrome.runtime.sendMessage({
        type: MessageType.CAPTURE_PAGE,
        payload: pageInfo,
      });
    }, 1000);
  }
}

function extractPageDetails() {
  // Readability style fallback parser
  const bodyText = document.body.innerText || '';
  const title = document.title || 'Untitled Page';
  const url = window.location.href;

  return {
    content: bodyText.slice(0, 50000), // Limit payload length
    url,
    title,
    timestamp: new Date().toISOString(),
    source: 'web',
    metadata: {
      siteName: window.location.hostname,
    },
  };
}

// Context menus trigger listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.CAPTURE_SELECTION) {
    const selected = window.getSelection()?.toString() || '';
    if (selected) {
      sendResponse({ selection: selected, title: document.title, url: window.location.href });
    } else {
      sendResponse({ error: 'No selection found on active tab' });
    }
  }
  return true;
});

// Run
initAutoCapture();
