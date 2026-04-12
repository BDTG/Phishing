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
// Content script gửi message khi hoàn tất phân tích URL
// Format: { type: 'updateIcon', tier: 'safe'|'warning'|'block' }
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Kiểm tra type của message
  if (message.type === 'updateIcon') {
    // Lấy tabId từ sender (tab đang gửi message)
    const tabId = sender.tab ? sender.tab.id : null;

    // Gọi hàm updateExtensionIcon với tier nhận được
    // tier: 'safe' (xanh), 'warning' (vàng), 'block' (đỏ), 'default' (xám)
    updateExtensionIcon(message.tier, tabId)
      // Trả về kết quả thành công cho content script
      .then(() => sendResponse({ success: true }))
      // Trả về lỗi nếu có vấn đề
      .catch((e) => sendResponse({ success: false, error: e.message }));

    // return true giữ channel mở cho async response
    // Nếu không có dòng này, sendResponse sẽ bị ignore
    return true;
  }
});
