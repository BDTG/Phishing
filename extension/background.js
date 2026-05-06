// ============================================================
// background.js — Service Worker (Manifest V3)
// ============================================================
// File này chạy ở background context của extension (service worker).
// Nhiệm vụ DUY NHẤT:
//   1. Reset icon về default khi tab đổi URL hoặc user chuyển tab
//   2. Lắng nghe message từ content script để cập nhật icon
//
// LƯU Ý QUAN TRỌNG: KHÔNG inject scripts ở đây!
//   Content scripts đã được khai báo trong manifest.json và Chrome tự
//   inject theo thứ tự đúng. Nếu inject thêm bằng executeScript() sẽ
//   gây lỗi "Identifier has already been declared" vì script chạy 2 lần.
// ============================================================

// Import icon_generator.js để dùng hàm updateExtensionIcon()
// importScripts() chỉ hoạt động trong service worker context (background.js)
// Không dùng được trong content scripts
importScripts('icon_generator.js');

// ============================================================
// EVENT: Khi tab được cập nhật (tải trang mới, reload...)
// ============================================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Chỉ reset icon khi trang load xong và là HTTP/HTTPS
  // Bỏ qua chrome://, file://, about:blank
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Reset icon về default (xám) — icon sẽ được content.js cập nhật
    // sau khi phân tích ML xong (~5ms)
    updateExtensionIcon('default', tabId).catch(() => {
      // Suppress "No tab with id" error khi tab đóng trước khi icon update xong
      void chrome.runtime.lastError;
    });
  }
});

// ============================================================
// EVENT: Khi user chuyển sang tab khác
// ============================================================
chrome.tabs.onActivated.addListener((activeInfo) => {
  // activeInfo.tabId là ID của tab vừa được active
  // Reset icon về default ngay lập tức
  // Content script của tab mới sẽ cập nhật icon sau khi phân tích xong
  updateExtensionIcon('default', activeInfo.tabId).catch(() => {});
});

// ============================================================
// EVENT: Lắng nghe message từ content script
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. Cập nhật Icon
  if (message.type === 'updateIcon') {
    const tabId = sender.tab ? sender.tab.id : null;
    updateExtensionIcon(message.tier, tabId)
      .then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ success: false, error: e.message }));
    return true;
  }

  // 2. Fetch Domain Age (Vượt rào cản CORS/CSP của trang web)
  if (message.type === 'fetchDomainAge') {
    const { rdapUrl } = message;
    
    // Thêm timeout 10 giây để tránh treo service worker
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
        const errorMsg = e.name === 'AbortError' ? 'Timeout (10s)' : e.toString();
        sendResponse({ success: false, error: errorMsg });
      });
    return true;
  }

  // 3. Fetch Dynamic Blacklist (Phishing.army)
  if (message.type === 'fetchDynamicBlacklist') {
    const CACHE_KEY = 'phishing_army_cache';
    const CACHE_TIME_KEY = 'phishing_army_time';
    const CACHE_DURATION = 6 * 60 * 60 * 1000; // Cập nhật mỗi 6 tiếng

    chrome.storage.local.get([CACHE_KEY, CACHE_TIME_KEY], (result) => {
      const now = Date.now();
      // Nếu cache còn hạn sử dụng -> Trả về ngay lập tức
      if (result[CACHE_KEY] && result[CACHE_TIME_KEY] && (now - result[CACHE_TIME_KEY] < CACHE_DURATION)) {
        sendResponse({ success: true, source: 'cache', data: result[CACHE_KEY] });
        return;
      }

      // Nếu cache hết hạn -> Fetch từ mạng
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Đợi tối đa 15s cho file lớn

      fetch('https://phishing.army/download/phishing_army_blocklist.txt', { signal: controller.signal })
        .then(r => r.text())
        .then(text => {
          clearTimeout(timeoutId);
          // Parse text: Bỏ comment (#), xóa khoảng trắng, lọc dòng trống
          const domains = text.split('\n')
            .map(line => line.split('#')[0].trim().toLowerCase())
            .filter(line => line.length > 0);
          
          // Lưu vào cache
          chrome.storage.local.set({ [CACHE_KEY]: domains, [CACHE_TIME_KEY]: now });
          sendResponse({ success: true, source: 'network', data: domains });
        })
        .catch(e => {
          clearTimeout(timeoutId);
          // Nếu rớt mạng, cố gắng dùng lại cache cũ (dù hết hạn)
          if (result[CACHE_KEY]) {
             sendResponse({ success: true, source: 'expired_cache_fallback', data: result[CACHE_KEY] });
          } else {
             sendResponse({ success: false, error: e.toString() });
          }
        });
    });
    return true; // Giữ cổng kết nối mở cho async callback
  }
});
