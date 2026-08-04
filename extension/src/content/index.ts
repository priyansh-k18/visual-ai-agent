import { Activity } from 'shared';

// Utility to send activity to background
const sendActivity = (activity: Omit<Activity, 'timestamp'>) => {
  chrome.runtime.sendMessage({
    type: 'NEW_ACTIVITY',
    payload: {
      ...activity,
      timestamp: Date.now()
    }
  });
};

// 1. Track Clicks
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  sendActivity({
    type: 'click',
    url: window.location.href,
    title: document.title,
    x: e.clientX,
    y: e.clientY,
    elementTag: target.tagName,
    text: target.innerText?.substring(0, 100) || '',
  });
}, true);

// 2. Track Scrolls (Throttled)
let lastScroll = 0;
document.addEventListener('scroll', () => {
  const now = Date.now();
  if (now - lastScroll > 1000) { // throttle 1s
    sendActivity({
      type: 'scroll',
      url: window.location.href,
      title: document.title,
      scrollPosition: window.scrollY,
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    });
    lastScroll = now;
  }
}, true);

// 3. Track Keyboard Activity (Ignoring passwords)
let keyCount = 0;
let lastKeyTime = Date.now();
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLInputElement;
  if (target && target.type === 'password') {
    return; // Ignore passwords
  }

  keyCount++;
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // Send keyboard batch every 2 seconds of inactivity
  typingTimeout = setTimeout(() => {
    const timeDiff = (Date.now() - lastKeyTime) / 1000 / 60; // in minutes
    const typingSpeed = timeDiff > 0 ? Math.round(keyCount / timeDiff) : 0;
    
    sendActivity({
      type: 'keyboard',
      url: window.location.href,
      title: document.title,
      keyCount,
      typingSpeed,
      focusedElement: target?.tagName || 'UNKNOWN',
    });

    keyCount = 0;
    lastKeyTime = Date.now();
  }, 2000);
}, true);
