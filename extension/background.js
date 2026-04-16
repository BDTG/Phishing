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
});
