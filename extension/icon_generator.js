// ============================================================
// icon_generator.js
// Tạo và cập nhật icon extension theo trạng thái (safe/warning/block)
// Dùng PNG tĩnh thay vì Canvas API → nhanh hơn ~10-20x
// ============================================================

// Đường dẫn đến các file PNG icon
// Mỗi trạng thái có 2 kích thước: 16px (toolbar nhỏ) và 32px (toolbar lớn)
const ICON_PATHS = {
  safe:    { 16: 'icons/icon_safe_16.png',    32: 'icons/icon_safe_32.png' },
  warning: { 16: 'icons/icon_warning_16.png', 32: 'icons/icon_warning_32.png' },
  block:   { 16: 'icons/icon_block_16.png',   32: 'icons/icon_block_32.png' },
  default: { 16: 'icons/icon_default_16.png', 32: 'icons/icon_default_32.png' },
};

/**
 * Cập nhật icon extension theo trạng thái
 * @param {string} tier - Trạng thái: 'safe' | 'warning' | 'block' | 'default'
 * @param {number} tabId - (Optional) ID của tab cần cập nhật icon
 * @returns {Promise<void>}
 */
async function updateExtensionIcon(tier, tabId) {
  // Lấy đường dẫn icon tương ứng với tier
  // Nếu tier không hợp lệ → dùng default
  const icon = ICON_PATHS[tier] || ICON_PATHS.default;

  try {
    // Kiểm tra chrome.action API có sẵn không
    if (chrome && chrome.action) {
      if (tabId) {
        // Cập nhật icon cho tab cụ thể
        // Mỗi tab có thể có icon khác nhau
        await chrome.action.setIcon({ tabId, path: icon });
      } else {
        // Cập nhật icon global (cho tất cả tabs chưa có icon riêng)
        await chrome.action.setIcon({ path: icon });
      }
    }
  } catch (e) {
    // Log warning nếu có lỗi (không crash extension)
    console.warn('[IconGenerator] Error updating icon:', e);
  }
}

// Export cho module system (nếu dùng)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateExtensionIcon };
}
