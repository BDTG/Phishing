// ============================================================
// options.js — Logic trang cài đặt nâng cao
// ============================================================

/**
 * Kiểm tra chuỗi có phải domain hợp lệ không
 */
function isValidDomain(domain) {
  return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
}

// ──────────────────────────────────────────────────────────────
// LOAD — Tải settings từ chrome.storage.local khi trang mở
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Đọc key 'phishingSettings' từ chrome.storage.local
  chrome.storage.local.get('phishingSettings', (data) => {
    const s = data.phishingSettings || {};

    // ── Sensitivity slider ──
    const sensitivityEl = document.getElementById('sensitivity');
    if (sensitivityEl) {
      sensitivityEl.value = s.sensitivity ?? 1;
      updateSensitivityLabel(s.sensitivity ?? 1);
    }

    // ── Defense layer toggles ──
    const setChecked = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val;
    };

    setChecked('toggle-brand', s.brandDetection !== false);
    setChecked('toggle-tld', s.tldRules !== false);
    setChecked('toggle-rdap', s.rdapCheck !== false);
    setChecked('toggle-dom', s.domAnalysis !== false);
    setChecked('toggle-banner', s.showBanner !== false);
    setChecked('toggle-log', s.logToConsole === true);

    // ── Custom lists ──
    const blocklistEl = document.getElementById('blocklist-items');
    if (blocklistEl) blocklistEl.value = (s.customBlocklist || []).join('\n');
    
    const whitelistEl = document.getElementById('whitelist-items');
    if (whitelistEl) whitelistEl.value = (s.customWhitelist || []).join('\n');
  });

  // ── Sensitivity label update khi kéo slider ──
  document.getElementById('sensitivity')?.addEventListener('input', (e) => {
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
    if (confirm('Bạn có chắc muốn xóa tất cả báo cáo nhầm?')) {
      chrome.storage.local.remove('fpReports', () => {
        showToast('Đã xóa dữ liệu báo cáo');
      });
    }
  });
});

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

function updateSensitivityLabel(val) {
  const labels = ['Thấp (Ít cảnh báo)', 'Trung bình (Mặc định)', 'Cao (An toàn tối đa)'];
  const el = document.getElementById('sensitivity-label');
  if (el) {
    el.textContent = labels[val] || labels[1];
    // Thay đổi màu sắc nhãn theo mức độ
    const colors = ['#64748b', '#2563eb', '#ef4444'];
    el.style.color = colors[val];
  }
}

function addDomainToList(listType) {
  const inputId  = listType === 'blocklist' ? 'blocklist-input'  : 'whitelist-input';
  const itemsId  = listType === 'blocklist' ? 'blocklist-items'  : 'whitelist-items';
  const storageKey = listType === 'blocklist' ? 'customBlocklist' : 'customWhitelist';

  const input = document.getElementById(inputId);
  if (!input) return;

  const raw = input.value.trim().toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '');

  if (!raw || !isValidDomain(raw)) {
    showToast('Domain không hợp lệ!', true);
    return;
  }

  chrome.storage.local.get('phishingSettings', (data) => {
    const s = data.phishingSettings || {};
    const list = s[storageKey] || [];

    if (list.includes(raw)) {
      showToast('Đã có trong danh sách');
      return;
    }

    list.push(raw);
    s[storageKey] = list;

    chrome.storage.local.set({ phishingSettings: s }, () => {
      const itemsEl = document.getElementById(itemsId);
      if (itemsEl) itemsEl.value = list.join('\n');
      input.value = '';
      showToast('Đã thêm: ' + raw);
    });
  });
}

function saveSettings() {
  chrome.storage.local.get('phishingSettings', (data) => {
    const existing = data.phishingSettings || {};

    const settings = {
      customBlocklist: existing.customBlocklist || [],
      customWhitelist: existing.customWhitelist || [],
      sensitivity: parseInt(document.getElementById('sensitivity')?.value ?? 1),
      brandDetection: document.getElementById('toggle-brand')?.checked ?? true,
      tldRules:       document.getElementById('toggle-tld')?.checked ?? true,
      rdapCheck:      document.getElementById('toggle-rdap')?.checked ?? true,
      domAnalysis:    document.getElementById('toggle-dom')?.checked ?? true,
      showBanner:     document.getElementById('toggle-banner')?.checked ?? true,
      logToConsole:   document.getElementById('toggle-log')?.checked ?? false,
    };

    chrome.storage.local.set({ phishingSettings: settings }, () => {
      showToast('✅ Đã lưu cài đặt thành công!');
    });
  });
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast') || createToast();
  toast.textContent = msg;
  toast.style.background = isError ? '#ef4444' : '#16a34a';
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

function createToast() {
  const el = document.createElement('div');
  el.id = 'toast';
  document.body.appendChild(el);
  return el;
}
