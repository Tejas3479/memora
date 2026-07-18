import { MessageType } from './lib/messages.js';
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

// Auto-capture watcher
async function initAutoCapture() {
  const config = await chrome.storage.local.get(['autoCaptureEnabled', 'blockedSites']);
  const enabled = config.autoCaptureEnabled !== false;
  const blocked = config.blockedSites || [];

  const currentUrl = window.location.href;
  const isBlocked = blocked.some((site: string) => currentUrl.includes(site));

  if (enabled && !isBlocked) {
    // Wait for document to settle
    setTimeout(async () => {
      const pageInfo = await enrichAndExtractPageDetails();
      chrome.runtime.sendMessage({
        type: MessageType.CAPTURE_PAGE,
        payload: pageInfo,
      });
    }, 1000);
  }
}

function extractPageDetails() {
  let content = '';
  let title = document.title || 'Untitled Page';
  let byline = '';

  try {
    // Clone document to avoid modifying original DOM during read
    const docClone = document.cloneNode(true) as Document;
    const reader = new Readability(docClone);
    const article = reader.parse();
    if (article) {
      content = article.textContent || article.snippet || '';
      title = article.title || title;
      byline = article.byline || '';
    }
  } catch (err) {
    console.warn('[Extension] Readability parsing failed, falling back to innerText:', err);
  }

  // Fallback if Readability fails
  if (!content) {
    content = document.body.innerText || '';
  }

  // Sanitize HTML/Text content
  const sanitizedContent = DOMPurify.sanitize(content).slice(0, 50000);
  const url = window.location.href;

  return {
    content: sanitizedContent,
    url,
    title,
    timestamp: new Date().toISOString(),
    source: 'web',
    metadata: {
      siteName: window.location.hostname,
      byline,
    },
  };
}

async function enrichAndExtractPageDetails() {
  const details = extractPageDetails();

  // F12 - Local-Only Privacy Mode (Chrome Gemini Nano)
  if ('ai' in self) {
    try {
      const aiObj = (self as any).ai;
      if (aiObj && aiObj.languageModel) {
        const capabilities = await aiObj.languageModel.capabilities();
        if (capabilities.available !== 'no') {
          const session = await aiObj.languageModel.create({
            systemPrompt: "You are a local summarizer. Given the text, return a concise 1-sentence summary and 3-5 tags in the format: Summary: [summary] Tags: [tag1, tag2]. Do not output anything else."
          });
          
          const rawPrompt = `Text to summarize: ${details.content.slice(0, 1000)}`;
          const response = await session.prompt(rawPrompt);
          
          const summaryMatch = response.match(/Summary:\s*(.*?)(?=\s*Tags:|$)/i);
          const tagsMatch = response.match(/Tags:\s*(.*)/i);
          
          const localSummary = summaryMatch ? summaryMatch[1].trim() : '';
          const localTags = tagsMatch ? tagsMatch[1].split(',').map((t: string) => t.trim()) : [];
          
          details.metadata.localSummary = localSummary;
          details.metadata.localTags = localTags;
        }
      }
    } catch (err) {
      console.warn('[Extension AI] Local Gemini Nano enrichment failed:', err);
    }
  }

  return details;
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
  } else if (message.type === 'GET_FULL_CONTENT') {
    enrichAndExtractPageDetails().then((details) => {
      sendResponse(details);
    });
  }
  return true;
});

// Run
initAutoCapture();
