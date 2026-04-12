// ============================================================
// options.js — Logic trang cài đặt nâng cao
// ============================================================
// Chạy khi user mở options.html (chrome-extension://…/options.html)
// Hoặc khi user bấm nút "Cài đặt" trong popup.
//
// TẠI SAO dùng chrome.storage.local thay vì chrome.storage.sync?
//   → chrome.storage.local chia sẻ được giữa popup, background, content scripts
//   → chrome.storage.sync có giới hạn 100KB và cần đăng nhập Google
//   → Các module khác (xgboost_predictor.js, content.js) cùng đọc key 'phishingSettings'
//
// CẤU TRÚC settings object (key: 'phishingSettings'):
//   sensitivity:     0=Low, 1=Medium, 2=High  (ảnh hưởng ngưỡng warn/block)
//   brandDetection:  true/false  (bật/tắt layer 2 brand impersonation)
//   tldRules:        true/false  (bật/tắt layer 3a TLD rules)
//   rdapCheck:       true/false  (bật/tắt layer RDAP domain age)
//   domAnalysis:     true/false  (bật/tắt DOM content analysis)
//   showBanner:      true/false  (hiện/ẩn banner cảnh báo trên trang)
//   logToConsole:    true/false  (bật/tắt log debug trong console)
//   customBlocklist: string[]    (danh sách domain user tự thêm vào blacklist)
//   customWhitelist: string[]    (danh sách domain user tự thêm vào whitelist)
// ============================================================

// ──────────────────────────────────────────────────────────────
// VALIDATION — Kiểm tra domain hợp lệ trước khi thêm vào list
// ──────────────────────────────────────────────────────────────

/**
 * Kiểm tra chuỗi có phải domain hợp lệ không
 * Cho phép: "google.com", "sub.example.co.uk"
 * Không cho: "http://", "localhost", "192.168.x.x", ký tự đặc biệt
 * @param {string} domain
 * @returns {boolean}
 */
function isValidDomain(domain) {
  // Regex: cho phép chữ, số, dấu gạch ngang, dấu chấm
  // Phải có ít nhất 1 dấu chấm (ví dụ: "example.com")
  // Không bắt đầu/kết thúc bằng dấu chấm hoặc dấu gạch ngang
  return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
}

// ──────────────────────────────────────────────────────────────
// LOAD — Tải settings từ chrome.storage.local khi trang mở
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Đọc key 'phishingSettings' từ chrome.storage.local
  // Nếu chưa có → trả về {} → code dưới dùng giá trị mặc định
  chrome.storage.local.get('phishingSettings', (data) => {
    const s = data.phishingSettings || {};

    // ── Sensitivity slider ──
    // 0=Low, 1=Medium (default), 2=High
    document.getElementById('sensitivity').value = s.sensitivity ?? 1;
    updateSensitivityLabel(s.sensitivity ?? 1);

    // ── Defense layer toggles ──
    // Dùng !== false vì nếu chưa set → undefined → true (mặc định bật)
    document.getElementById('toggle-brand').checked      = s.brandDetection !== false;
    document.getElementById('toggle-tld').checked        = s.tldRules !== false;
    document.getElementById('toggle-rdap').checked       = s.rdapCheck !== false;
    document.getElementById('toggle-dom').checked        = s.domAnalysis !== false;
    document.getElementById('toggle-banner').checked     = s.showBanner !== false;
    document.getElementById('toggle-log').checked        = s.logToConsole === true; // Mặc định TẮT

    // ── Custom lists ──
    // Hiển thị danh sách domain user đã thêm (mỗi domain 1 dòng)
    document.getElementById('blocklist-items').textContent =
      (s.customBlocklist || []).join('\n');
    document.getElementById('whitelist-items').textContent =
      (s.customWhitelist || []).join('\n');
  });

  // ── Sensitivity label update khi kéo slider ──
  document.getElementById('sensitivity').addEventListener('input', (e) => {
    updateSensitivityLabel(parseInt(e.target.value));
  });

  // ── Nút lưu settings ──
  document.getElementById('save-settings')?.addEventListener('click', saveSettings);

  // ── Nút thêm domain vào blocklist ──
  document.getElementById('add-blocklist')?.addEventListener('click', () => {
    addDomainToList('blocklist');
  });

  // ── Nút thêm domain vào whitelist ──
  document.getElementById('add-whitelist')?.addEventListener('click', () => {
    addDomainToList('whitelist');
  });

  // ── Nút xóa false positive reports ──
  document.getElementById('clear-reports')?.addEventListener('click', () => {
    chrome.storage.local.remove('fpReports', () => {
      showToast('Đã xóa báo cáo');
    });
  });
});

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Cập nhật label cho slider sensitivity
 * @param {number} val - 0, 1 hoặc 2
 */
function updateSensitivityLabel(val) {
  const labels = ['Thấp (ít cảnh báo hơn)', 'Trung bình (mặc định)', 'Cao (nhạy cảm nhất)'];
  const el = document.getElementById('sensitivity-label');
  if (el) el.textContent = labels[val] || labels[1];
}

/**
 * Thêm domain vào blocklist hoặc whitelist
 * Validate domain trước khi thêm để tránh lưu rác
 * @param {'blocklist'|'whitelist'} listType
 */
function addDomainToList(listType) {
  const inputId  = listType === 'blocklist' ? 'blocklist-input'  : 'whitelist-input';
  const itemsId  = listType === 'blocklist' ? 'blocklist-items'  : 'whitelist-items';
  const storageKey = listType === 'blocklist' ? 'customBlocklist' : 'customWhitelist';

  const input = document.getElementById(inputId);
  if (!input) return;

  // Normalize: bỏ http://, https://, www. và trim
  const raw = input.value.trim().toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '');

  // Validate
  if (!raw || !isValidDomain(raw)) {
    showToast('Domain không hợp lệ! Ví dụ: example.com', true);
    return;
  }

  // Đọc list hiện tại, thêm domain mới, lưu lại
  chrome.storage.local.get('phishingSettings', (data) => {
    const s = data.phishingSettings || {};
    const list = s[storageKey] || [];

    // Tránh duplicate
    if (list.includes(raw)) {
      showToast('Domain đã có trong danh sách');
      return;
    }

    list.push(raw);
    s[storageKey] = list;

    chrome.storage.local.set({ phishingSettings: s }, () => {
      // Cập nhật UI
      const itemsEl = document.getElementById(itemsId);
      if (itemsEl) itemsEl.textContent = list.join('\n');
      input.value = '';
      showToast('Đã thêm: ' + raw);
    });
  });
}

/**
 * Lưu toàn bộ settings vào chrome.storage.local
 * Đọc giá trị từ tất cả toggle và slider trong UI
 */
function saveSettings() {
  // Đọc giá trị hiện tại của custom lists để không mất dữ liệu
  chrome.storage.local.get('phishingSettings', (data) => {
    const existing = data.phishingSettings || {};

    const settings = {
      // Giữ nguyên custom lists — không overwrite
      customBlocklist: existing.customBlocklist || [],
      customWhitelist: existing.customWhitelist || [],

      // Sensitivity: 0=Low, 1=Medium, 2=High
      sensitivity: parseInt(document.getElementById('sensitivity')?.value ?? 1),

      // Defense layer toggles
      brandDetection: document.getElementById('toggle-brand')?.checked !== false,
      tldRules:       document.getElementById('toggle-tld')?.checked !== false,
      rdapCheck:      document.getElementById('toggle-rdap')?.checked !== false,
      domAnalysis:    document.getElementById('toggle-dom')?.checked !== false,
      showBanner:     document.getElementById('toggle-banner')?.checked !== false,
      logToConsole:   document.getElementById('toggle-log')?.checked === true,
    };

    // Lưu vào chrome.storage.local với key 'phishingSettings'
    // Tất cả các module (xgboost_predictor.js, content.js) đọc cùng key này
    chrome.storage.local.set({ phishingSettings: settings }, () => {
      showToast('Đã lưu cài đặt!');
    });
  });
}

/**
 * Hiển thị toast notification tạm thời
 * @param {string} msg - Nội dung thông báo
 * @param {boolean} isError - true = màu đỏ, false = màu xanh
 */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast') || createToast();
  toast.textContent = msg;
  toast.style.background = isError ? '#ef4444' : '#22c55e';
  toast.style.display = 'block';
  // Ẩn sau 2 giây
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

/**
 * Tạo toast element nếu chưa có trong DOM
 * @returns {HTMLElement}
 */
function createToast() {
  const el = document.createElement('div');
  el.id = 'toast';
  el.style.cssText = [
    'position:fixed', 'bottom:20px', 'right:20px',
    'padding:10px 18px', 'border-radius:6px', 'color:#fff',
    'font-size:14px', 'z-index:9999', 'display:none',
  ].join(';');
  document.body.appendChild(el);
  return el;
}
