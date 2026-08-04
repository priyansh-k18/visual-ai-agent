import { Activity } from 'shared';

let activityBatch: Activity[] = [];
let apiToken = '';

// Load token
chrome.storage.local.get(['apiToken'], (res) => {
  if (res.apiToken) apiToken = res.apiToken;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiToken) apiToken = changes.apiToken.newValue;
});

// Receive activities from content scripts
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NEW_ACTIVITY') {
    activityBatch.push(message.payload);
  }
});

// Track Tab Changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  activityBatch.push({
    type: 'tab_switch',
    url: tab.url || '',
    title: tab.title || '',
    timestamp: Date.now()
  });
});

// Track Navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    activityBatch.push({
      type: 'navigation',
      url: changeInfo.url,
      title: tab.title || '',
      timestamp: Date.now()
    });
  }
});

// Track Window Focus
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const tabs = await chrome.tabs.query({ active: true, windowId });
  if (tabs.length > 0) {
    activityBatch.push({
      type: 'window_focus',
      url: tabs[0].url || '',
      title: tabs[0].title || '',
      timestamp: Date.now()
    });
  }
});

// Batch Upload and Screenshot Timer
chrome.alarms.create('sync_and_screenshot', { periodInMinutes: 10 / 60 }); // Every 10 seconds

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync_and_screenshot') {
    await syncActivities();
    await captureAndUploadScreenshot();
  }
});

async function syncActivities() {
  if (!apiToken) return;
  
  // Also load any queued activities from storage
  const { offlineQueue = [] } = await chrome.storage.local.get('offlineQueue');
  const allActivities = [...offlineQueue, ...activityBatch];
  
  if (allActivities.length === 0) return;
  
  try {
    const res = await fetch('http://localhost:3000/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify(allActivities)
    });
    
    if (res.ok) {
      activityBatch = [];
      await chrome.storage.local.set({ offlineQueue: [] });
    } else {
      throw new Error('Upload failed');
    }
  } catch (err) {
    // Save to offline queue
    await chrome.storage.local.set({ offlineQueue: allActivities });
    activityBatch = [];
  }
}

async function captureAndUploadScreenshot() {
  if (!apiToken) return;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return;
    const activeTab = tabs[0];

    const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: 'jpeg', quality: 50 });
    
    // Upload
    await fetch('http://localhost:3000/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        screenshotBase64: dataUrl,
        url: activeTab.url || '',
        title: activeTab.title || '',
        timestamp: Date.now()
      })
    });
  } catch (err) {
    console.error('Screenshot error:', err);
  }
}
