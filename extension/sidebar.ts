import { MessageType } from './lib/messages.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const memoriesList = document.getElementById('memories-list');
  const quickNoteText = document.getElementById('quick-note') as HTMLTextAreaElement;
  const saveNoteBtn = document.getElementById('save-note-btn');
  const summarizeBtn = document.getElementById('summarize-btn');
  const summarySection = document.getElementById('summary-section');
  const highlightsList = document.getElementById('highlights-list');

  let currentTabUrl = '';
  let currentTabTitle = '';

  // 1. Tab Switching
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab!)?.classList.add('active');

      if (targetTab === 'tab-highlights') {
        loadHighlights();
      } else if (targetTab === 'tab-related') {
        loadTabContext();
      }
    });
  });

  // 2. Load tab details & context
  const loadTabContext = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    currentTabUrl = tab.url;
    currentTabTitle = tab.title || 'Active Page';

    memoriesList!.innerHTML = `
      <div class="loader">
        <div class="spinner"></div>
        <span>Finding context...</span>
      </div>`;

    const credentials = await chrome.storage.local.get(['jwt_token']);
    const token = credentials.jwt_token;
    if (!token) {
      memoriesList!.innerHTML = '<div style="font-size:12px;color:#ef4444;text-align:center;">Please log in to Memora via the extension popup.</div>';
      return;
    }

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
      } else {
        memoriesList!.innerHTML = '<div style="font-size:11px;color:#8888a0;text-align:center;">No context found.</div>';
      }
    } catch (err) {
      memoriesList!.innerHTML = '<div style="font-size:11px;color:#ef4444;text-align:center;">Failed to connect to API server.</div>';
    }
  };

  const renderMemories = (mems: any[]) => {
    if (mems.length === 0) {
      memoriesList!.innerHTML = '<div style="font-size:11px;color:#8888a0;text-align:center;padding:12px 0;">No contextual memories found for this page.</div>';
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

  // 3. Summarization Trigger
  summarizeBtn?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    summarySection!.innerHTML = `
      <div class="loader">
        <div class="spinner"></div>
        <span>Scraping content & generating AI summary...</span>
      </div>`;

    // Retrieve full page content from content script
    chrome.tabs.sendMessage(tab.id, { type: 'GET_FULL_CONTENT' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.content) {
        summarySection!.innerHTML = `
          <div style="text-align:center;padding:12px 0;">
            <p style="font-size:12px;color:#ef4444;margin-bottom:10px;">Failed to scrape page content. Make sure page is fully loaded.</p>
            <button class="btn btn-secondary" id="retry-summary-btn">Retry</button>
          </div>`;
        document.getElementById('retry-summary-btn')?.addEventListener('click', () => summarizeBtn.click());
        return;
      }

      // Call API server via background script
      chrome.runtime.sendMessage(
        {
          type: MessageType.SUMMARIZE_PAGE,
          payload: {
            url: response.url,
            title: response.title,
            content: response.content,
          },
        },
        (res) => {
          if (res && res.success && res.summary) {
            renderSummary(res.summary);
          } else {
            summarySection!.innerHTML = `
              <div style="text-align:center;padding:12px 0;">
                <p style="font-size:12px;color:#ef4444;margin-bottom:10px;">Failed to generate AI summary: ${res?.error || 'Unknown error'}</p>
                <button class="btn btn-secondary" id="retry-summary-btn">Retry</button>
              </div>`;
            document.getElementById('retry-summary-btn')?.addEventListener('click', () => summarizeBtn.click());
          }
        }
      );
    });
  });

  const renderSummary = (summary: any) => {
    summarySection!.innerHTML = `
      <div class="summary-tldr">${escapeHtml(summary.tldr)}</div>
      <div class="section-title">Key Takeaways</div>
      <ul class="summary-bullets">
        ${summary.keyPoints.map((pt: string) => `<li>${escapeHtml(pt)}</li>`).join('')}
      </ul>
      <div class="summary-tag-container">
        ${summary.tags.map((tag: string) => `<span class="summary-tag">#${escapeHtml(tag)}</span>`).join('')}
      </div>
    `;
  };

  // 4. Highlights Handling
  const loadHighlights = async () => {
    if (!currentTabUrl) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTabUrl = tab?.url || '';
    }

    if (!currentTabUrl) return;

    highlightsList!.innerHTML = `
      <div class="loader">
        <div class="spinner"></div>
        <span>Loading highlights...</span>
      </div>`;

    chrome.runtime.sendMessage(
      {
        type: MessageType.GET_HIGHLIGHTS,
        payload: { url: currentTabUrl },
      },
      (res) => {
        if (res && Array.isArray(res)) {
          renderHighlights(res);
        } else {
          highlightsList!.innerHTML = '<div style="font-size:11px;color:#ef4444;text-align:center;">Failed to load highlights.</div>';
        }
      }
    );
  };

  const renderHighlights = (highlights: any[]) => {
    if (highlights.length === 0) {
      highlightsList!.innerHTML = `
        <div style="font-size:11px;color:var(--text-muted);text-align:center;padding:16px 0;">
          No highlights saved for this page.<br>
          Highlight text on the page & right click to save.
        </div>`;
      return;
    }

    highlightsList!.innerHTML = highlights
      .map(
        (hl) => `
      <div class="card highlight-card ${hl.color || 'yellow'}" id="hl-${hl.id}">
        <button class="delete-btn" data-id="${hl.id}" title="Delete highlight">✕</button>
        <div class="highlight-text">"${escapeHtml(hl.text)}"</div>
        ${hl.note ? `<div class="highlight-note">${escapeHtml(hl.note)}</div>` : ''}
        <div class="card-meta">${new Date(hl.createdAt).toLocaleDateString()}</div>
      </div>
    `,
      )
      .join('');

    // Attach delete listeners
    const deleteBtns = highlightsList!.querySelectorAll('.delete-btn');
    deleteBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (id) {
          deleteHighlight(id);
        }
      });
    });
  };

  const deleteHighlight = (id: string) => {
    chrome.runtime.sendMessage(
      {
        type: MessageType.DELETE_HIGHLIGHT,
        payload: { id },
      },
      (res) => {
        if (res && res.success) {
          loadHighlights();
        } else {
          alert('Failed to delete highlight');
        }
      }
    );
  };

  // 5. Quick capture note saving
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

  // 6. Escape helper
  const escapeHtml = (str: string) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  // Listen to context menu updates & background notifications
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'HIGHLIGHT_ADDED') {
      if (message.payload.url === currentTabUrl) {
        loadHighlights();
      }
    }
  });

  // Load context on startup
  loadTabContext();

  // Listen to tab shifts
  chrome.tabs.onActivated.addListener(() => {
    loadTabContext();
    const activeTabButton = document.querySelector('.tab-btn.active');
    if (activeTabButton?.getAttribute('data-tab') === 'tab-highlights') {
      loadHighlights();
    }
  });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      loadTabContext();
      const activeTabButton = document.querySelector('.tab-btn.active');
      if (activeTabButton?.getAttribute('data-tab') === 'tab-highlights') {
        loadHighlights();
      }
    }
  });
});
