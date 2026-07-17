export enum MessageType {
  CAPTURE_PAGE = 'CAPTURE_PAGE',
  CAPTURE_SELECTION = 'CAPTURE_SELECTION',
  CAPTURE_SCREENSHOT = 'CAPTURE_SCREENSHOT',
  SYNC_QUEUE = 'SYNC_QUEUE',
  GET_STATUS = 'GET_STATUS',
  SET_TOKEN = 'SET_TOKEN',
  OPEN_SIDEBAR = 'OPEN_SIDEBAR',
  TOGGLE_AUTOCAPTURE = 'TOGGLE_AUTOCAPTURE',
  GET_CONFIG = 'GET_CONFIG',
}

export interface MessagePayload {
  type: MessageType;
  payload?: any;
}

export function sendMessage<T>(message: MessagePayload): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(response);
    });
  });
}

export function onMessage(
  handler: (message: MessagePayload, sender: chrome.runtime.MessageSender) => Promise<any>,
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handler(message, sender)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // asynchronous response
  });
}
