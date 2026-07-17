import { MessageType } from './lib/messages.js';

document.addEventListener('DOMContentLoaded', () => {
  const saveNoteBtn = document.getElementById('save-note-btn');
  const quickNoteText = document.getElementById('quick-note') as HTMLTextAreaElement;
  const memoriesList = document.getElementById('memories-list');

  // Load contextual relations from active tab
  const loadTabContext = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    // Send query context to backend
    const credentials = await chrome.storage.local.get(['jwt_token']);
    const token = credentials.jwt_token;
    if (!token) return;

    try {
      const response = await fetch('http://localhost:4000/api/sidebar/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: tab.url, title: tab.title }),
      });

      if (response.ok) {
        const body = await response.json();
        renderMemories(body.memories || []);
      }
    } catch (err) {
      console.warn('[Sidebar] Failed to load tab context:', err);
    }
  };

  const renderMemories = (mems: any[]) => {
    if (mems.length === 0) {
      memoriesList!.innerHTML = '<div style="font-size:12px;color:#8888a0;">No contextual memories found for this page.</div>';
      return;
    }

    memoriesList!.innerHTML = mems
      .map(
        (m) => `
      <div class="card">
        <div class="card-title">${escapeHtml(m.title)}</div>
        <div class="card-meta">${m.source} • ${new Date(m.timestamp * 1000).toLocaleDateString()}</div>
      </div>
    `,
      )
      .join('');
  };

  const escapeHtml = (str: string) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // Quick note captures
  saveNoteBtn!.addEventListener('click', async () => {
    const note = quickNoteText.value.trim();
    if (!note) return;

    saveNoteBtn!.innerText = 'Saving...';
    
    chrome.runtime.sendMessage(
      {
        type: MessageType.CAPTURE_PAGE,
        payload: {
          content: note,
          title: `Quick Note from Sidebar`,
          url: 'memora://sidebar/quick-note',
          timestamp: new Date().toISOString(),
          source: 'note',
        },
      },
      () => {
        saveNoteBtn!.innerText = 'Saved!';
        quickNoteText.value = '';
        setTimeout(() => {
          saveNoteBtn!.innerText = 'Save Note';
          loadTabContext();
        }, 1500);
      },
    );
  });

  // Load context on startup
  loadTabContext();

  // Listen to tab shifts
  chrome.tabs.onActivated.addListener(() => loadTabContext());
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      loadTabContext();
    }
  });
});
