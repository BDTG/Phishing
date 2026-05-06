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
    if (resultEl) resultEl.innerHTML = '<div class="icon">⏳</div><div>Đang phân tích…</div>';

    try {
      // ── Gọi predictPhishing() từ xgboost_predictor.js ──
      const [{ result: mlResult }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (tabUrl) => {
          if (typeof predictPhishing === 'function') {
            return await predictPhishing(tabUrl);
          }
          return null;
        },
        args: [url],
      });

      // ── Nếu không lấy được kết quả từ content script ──
      if (!mlResult) {
        if (resultEl) {
          resultEl.className = 'error';
          resultEl.innerHTML = '<div class="icon">⚠️</div><div>Không thể phân tích trang này</div>';
        }
        return;
      }

      // ── Unpack kết quả ──
      const { probability: prob, tier, reason } = mlResult;
      const pct = (prob * 100).toFixed(1);

      // ── Hiển thị probability bar ──
      if (barWrapEl) barWrapEl.style.display = 'block';
      if (barEl) {
        barEl.style.width = pct + '%';
        barEl.style.background = tier === 'block' ? '#ef4444'
          : tier === 'warning' ? '#f59e0b' : '#22c55e';
      }
      if (barLabelEl) barLabelEl.textContent = `${pct}%`;

      // ── Hiển thị kết quả chính ──
      if (resultEl) {
        if (tier === 'block') {
          resultEl.className = 'danger';
          resultEl.innerHTML = `<div class="icon">🔴</div><div>NGUY HIỂM (${pct}%)</div>`;
        } else if (tier === 'warning') {
          resultEl.className = 'warning';
          resultEl.innerHTML = `<div class="icon">🟡</div><div>CẢNH BÁO (${pct}%)</div>`;
        } else {
          resultEl.className = 'safe';
          resultEl.innerHTML = `<div class="icon">🟢</div><div>AN TOÀN (${pct}%)</div>`;
        }
      }

      // ── Hiển thị lý do ──
      if (reasonsEl && reason) {
        reasonsEl.innerHTML = `<div class="reason-badge">${reason}</div>`;
      }

    } catch (e) {
      // Lỗi thường gặp: tab đã đóng, trang không cho inject script (trang lỗi DNS, trang cài đặt Chrome...)
      if (resultEl) {
        resultEl.className = 'error';
        
        // Xử lý lỗi đặc thù khi trang web bị sập (Hiển thị trang lỗi nội bộ của Chrome)
        if (e.message.includes('Frame with ID 0 is showing error page') || e.message.includes('Cannot access')) {
          resultEl.innerHTML = '<div class="icon">⚠️</div><div>Trang web đã bị sập hoặc không thể truy cập (Lỗi mạng/DNS).</div>';
          
          // Thêm một đoạn giải thích nhỏ cho người dùng
          if (reasonsEl) {
            reasonsEl.innerHTML = `<div class="reason-badge" style="background:#404040">Không thể phân tích mã nguồn vì trang web không tồn tại.</div>`;
          }
        } else {
          resultEl.textContent = '⚠️ Lỗi: ' + e.message;
        }
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
