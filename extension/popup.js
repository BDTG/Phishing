// ============================================================
// popup.js — Script xử lý popup extension
// ============================================================
// Chạy khi user click vào icon extension trên thanh toolbar.
//
// LƯU Ý QUAN TRỌNG VỀ CONTEXT:
//   popup.js chạy trong context riêng của popup window, KHÔNG phải
//   trong context của trang web. Vì vậy KHÔNG có quyền truy cập DOM
//   của trang web người dùng đang xem.
//   → Popup chỉ hiển thị kết quả đã lưu, hoặc inject script để lấy kết quả.
//
// TẠI SAO dùng chrome.tabs.query?
//   → Popup cần biết URL của tab đang active để phân tích.
//   → chrome.tabs.query({ active: true, currentWindow: true }) trả về
//     đúng 1 tab — tab đang được user xem.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // ── Lấy tab đang active ──
  // active: true → tab đang focus
  // currentWindow: true → trong cửa sổ hiện tại (không lấy tab từ cửa sổ khác)
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const url = tab ? tab.url : '';

    // ── Lấy các element từ popup.html ──
    const urlEl      = document.getElementById('url-display');
    const resultEl   = document.getElementById('result');
    const barWrapEl  = document.getElementById('prob-bar-wrap');
    const barEl      = document.getElementById('prob-bar');
    const barLabelEl = document.getElementById('prob-label');
    const reasonsEl  = document.getElementById('reasons');

    // ── Kiểm tra URL hợp lệ ──
    // Bỏ qua: chrome://, chrome-extension://, file://, about:blank, newtab
    if (!url || !url.startsWith('http')) {
      if (urlEl) urlEl.textContent = url || '(trang đặc biệt)';
      if (resultEl) {
        resultEl.className = 'error';
        resultEl.textContent = '⚠️ Không phân tích được trang này';
      }
      return;
    }

    // ── Hiển thị URL rút gọn ──
    try {
      const u = new URL(url);
      // Hiện hostname + 40 ký tự đầu của path
      const pathShort = u.pathname.length > 40 ? u.pathname.substring(0, 40) + '…' : u.pathname;
      if (urlEl) urlEl.textContent = u.hostname + pathShort;
    } catch {
      if (urlEl) urlEl.textContent = url.substring(0, 60) + '…';
    }

    // ── Hiển thị trạng thái loading ──
    if (resultEl) resultEl.textContent = '⏳ Đang phân tích…';

    try {
      // ── Gọi predictPhishing() từ xgboost_predictor.js ──
      // Hàm này được inject vào popup context qua manifest "web_accessible_resources"?
      // Không — popup cần chạy script trong context của tab.
      // Dùng chrome.scripting.executeScript để chạy và lấy kết quả về.
      const [{ result: mlResult }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (tabUrl) => {
          // Đây chạy trong context của trang web (có quyền gọi predictPhishing)
          // predictPhishing được inject bởi manifest content_scripts
          if (typeof predictPhishing === 'function') {
            const r = await predictPhishing(tabUrl);
            return r;
          }
          return null;
        },
        args: [url],
      });

      // ── Nếu không lấy được kết quả từ content script ──
      if (!mlResult) {
        if (resultEl) {
          resultEl.className = 'error';
          resultEl.textContent = '⚠️ Không thể phân tích trang này';
        }
        return;
      }

      // ── Unpack kết quả ──
      // predictPhishing trả về: { probability, tier, reason, isPhishing }
      const { probability: prob, tier, reason, isPhishing } = mlResult;
      const pct = (prob * 100).toFixed(1);

      // ── Hiển thị probability bar ──
      if (barWrapEl) barWrapEl.style.display = 'block';
      if (barEl) {
        barEl.style.width = pct + '%';
        // Màu bar theo tier:
        //   block   → đỏ (#ef4444)
        //   warning → cam (#f97316)
        //   safe    → xanh (#22c55e)
        barEl.style.background = tier === 'block' ? '#ef4444'
          : tier === 'warning' ? '#f97316' : '#22c55e';
      }
      if (barLabelEl) barLabelEl.textContent = `Xác suất phishing: ${pct}%`;

      // ── Hiển thị kết quả chính ──
      if (resultEl) {
        if (tier === 'block') {
          resultEl.className = 'danger';
          resultEl.textContent = `🔴 NGUY HIỂM (${pct}%)`;
        } else if (tier === 'warning') {
          resultEl.className = 'warning';
          resultEl.textContent = `🟡 CẢNH BÁO (${pct}%)`;
        } else {
          resultEl.className = 'safe';
          resultEl.textContent = `🟢 AN TOÀN (${pct}%)`;
        }
      }

      // ── Hiển thị lý do ──
      if (reasonsEl && reason) {
        reasonsEl.innerHTML = `<div class="reason-badge">• ${reason}</div>`;
      }

    } catch (e) {
      // Lỗi thường gặp: tab đã đóng, trang không cho inject script
      if (resultEl) {
        resultEl.className = 'error';
        resultEl.textContent = '⚠️ Lỗi: ' + e.message;
      }
    }
  });

  // ── Nút Settings ──
  // Mở trang options.html trong tab mới
  // Phải đặt ngoài chrome.tabs.query để không bị callback delay
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    // chrome.runtime.openOptionsPage() mở options.html đã khai báo trong manifest
    chrome.runtime.openOptionsPage();
  });
});
