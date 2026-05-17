// ============================================================
// background.js — Service Worker (Manifest V3)
// ============================================================
importScripts('icon_generator.js');

// EVENT: Khi tab được cập nhật
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    updateExtensionIcon('default', tabId).catch(() => {
      void chrome.runtime.lastError;
    });
  }
});

// EVENT: Khi user chuyển sang tab khác
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateExtensionIcon('default', activeInfo.tabId).catch(() => {});
});

// EVENT: Lắng nghe message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. Cập nhật Icon
  if (message.type === 'updateIcon') {
    const tabId = sender.tab ? sender.tab.id : null;
    updateExtensionIcon(message.tier, tabId)
      .then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e.message }));
    return true;
  }

  // 2. Fetch Domain Age
  if (message.type === 'fetchDomainAge') {
    const { rdapUrl } = message;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(rdapUrl, { 
      headers: { 'Accept': 'application/rdap+json, application/json' },
      signal: controller.signal
    })
      .then(r => {
        clearTimeout(timeoutId);
        return r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`);
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(e => {
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: e.name === 'AbortError' ? 'Timeout (10s)' : e.toString() });
      });
    return true;
  }

  // 3. Fetch Dynamic Blacklist
  if (message.type === 'fetchDynamicBlacklist') {
    const CACHE_KEY = 'phishing_army_cache';
    const CACHE_TIME_KEY = 'phishing_army_time';
    chrome.storage.local.get([CACHE_KEY, CACHE_TIME_KEY], (result) => {
      const now = Date.now();
      if (result[CACHE_KEY] && result[CACHE_TIME_KEY] && (now - result[CACHE_TIME_KEY] < 21600000)) {
        sendResponse({ success: true, source: 'cache', data: result[CACHE_KEY] });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      fetch('https://phishing.army/download/phishing_army_blocklist.txt', { signal: controller.signal })
        .then(r => r.text())
        .then(text => {
          clearTimeout(timeoutId);
          const domains = text.split('\n').map(l => l.split('#')[0].trim().toLowerCase()).filter(l => l.length > 0);
          chrome.storage.local.set({ [CACHE_KEY]: domains, [CACHE_TIME_KEY]: now });
          sendResponse({ success: true, source: 'network', data: domains });
        })
        .catch(e => {
          clearTimeout(timeoutId);
          if (result[CACHE_KEY]) sendResponse({ success: true, source: 'fallback', data: result[CACHE_KEY] });
          else sendResponse({ success: false, error: e.toString() });
        });
    });
    return true;
  }

  // 4. Fetch Deep Analysis (IP Geo + ISP)
  if (message.type === 'fetchDeepAnalysis') {
    const { domain } = message;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for IP info

    const apiReq = `http://ip-api.com/json/${domain}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
    
    fetch(apiReq, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        clearTimeout(timeoutId);
        sendResponse({ success: true, data });
      })
      .catch(e => {
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: e.toString() });
      });
    return true;
  }
});
