// ============================================================
// popup.js — Script xử lý popup extension
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    const url = tab ? tab.url : '';

    const urlEl      = document.getElementById('url-display');
    const resultEl   = document.getElementById('result');
    const barWrapEl  = document.getElementById('prob-bar-wrap');
    const barEl      = document.getElementById('prob-bar');
    const barLabelEl = document.getElementById('prob-label');
    const reasonsEl  = document.getElementById('reasons');
    const xaiBtn     = document.getElementById('xai-toggle-btn');
    const xaiBox     = document.getElementById('technical-details');

    if (!url || !url.startsWith('http')) {
      if (urlEl) urlEl.textContent = url || '(trang đặc biệt)';
      if (resultEl) {
        resultEl.className = 'error';
        resultEl.textContent = '⚠️ Không phân tích được trang này';
      }
      return;
    }

    try {
      const u = new URL(url);
      const pathShort = u.pathname.length > 40 ? u.pathname.substring(0, 40) + '…' : u.pathname;
      if (urlEl) urlEl.textContent = u.hostname + pathShort;
    } catch {
      if (urlEl) urlEl.textContent = url.substring(0, 60) + '…';
    }

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

      if (!mlResult) {
        if (resultEl) {
          resultEl.className = 'error';
          resultEl.innerHTML = '<div class="icon">⚠️</div><div>Không thể phân tích trang này</div>';
        }
        return;
      }

      const { probability: prob, tier, reason, debugData } = mlResult;
      const pct = (prob * 100).toFixed(1);

      if (barWrapEl) barWrapEl.style.display = 'block';
      if (barEl) {
        barEl.style.width = pct + '%';
        barEl.style.background = tier === 'block' ? '#ef4444' : tier === 'warning' ? '#f59e0b' : '#22c55e';
      }
      if (barLabelEl) barLabelEl.textContent = `${pct}%`;

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

      if (reasonsEl && reason) {
        // Tách các lý do để hiển thị đẹp hơn
        const reasonItems = reason.split(' | ');
        reasonsEl.innerHTML = reasonItems.map(r => `<div class="reason-badge">${r}</div>`).join('');
      }

      // ── RENDER CHI TIẾT KỸ THUẬT (XAI) ──
      if (debugData && xaiBtn && xaiBox) {
        xaiBtn.style.display = 'block';
        
        let html = '<div style="margin-bottom:12px; color:#facc15; font-weight:bold;">--- HÀNH TRÌNH RA QUYẾT ĐỊNH ---</div>';
        
        // 1. Duyệt qua các lớp
        for (const [layer, info] of Object.entries(debugData.layers)) {
          html += `<div class="xai-layer">
            <span class="xai-label">[${layer}]</span> <span class="xai-val">${info.result}</span><br/>
            <small style="color:#94a3b8">${info.details}</small>
          </div>`;
        }

        // 2. Đặc trưng URL
        if (debugData.features.url && debugData.features.url.length > 0) {
          html += '<div style="margin:12px 0 6px; color:#facc15; font-weight:bold;">--- 39 ĐẶC TRƯNG URL (MODEL 1) ---</div>';
          const f = debugData.features.url;
          html += `<div class="xai-group">
            • URL Length: ${f[0]} | Dots: ${f[1]} | Hyphens: ${f[2]}<br/>
            • Entropy: ${f[9].toFixed(3)} | Digits: ${f[5]}<br/>
            • Suspicious TLD: ${f[15]} | Phish Keyword: ${f[25]}<br/>
            • Min Levenshtein: ${f[33]} | Brand Dist: ${f[34]}
          </div>`;
        }

        // 3. Đặc trưng HTML
        if (debugData.features.html && debugData.features.html.length > 0) {
          html += '<div style="margin:12px 0 6px; color:#facc15; font-weight:bold;">--- 6 ĐẶC TRƯNG HTML (MODEL 2) ---</div>';
          const h = debugData.features.html;
          html += `<div class="xai-group">
            • Password Inputs: ${h[0]}<br/>
            • Hidden IFrames: ${h[1]}<br/>
            • External Forms: ${h[2]}<br/>
            • Script Ratio: ${(h[3]*100).toFixed(2)}%<br/>
            • Malware Links: ${h[4]}<br/>
            • Social Eng Words: ${h[5]}
          </div>`;
        }

        xaiBox.innerHTML = html;
        
        xaiBtn.addEventListener('click', () => {
          const isHidden = xaiBox.style.display === 'none' || xaiBox.style.display === '';
          xaiBox.style.display = isHidden ? 'block' : 'none';
          xaiBtn.textContent = isHidden ? '🔼 Đóng chi tiết kỹ thuật' : '🔍 Xem chi tiết kỹ thuật (AI Inside)';
        });
      }

    } catch (e) {
      if (resultEl) {
        resultEl.className = 'error';
        if (e.message.includes('error page') || e.message.includes('Cannot access')) {
          resultEl.innerHTML = '<div class="icon">⚠️</div><div>Trang web đã sập hoặc không thể truy cập.</div>';
        } else {
          resultEl.textContent = '⚠️ Lỗi: ' + e.message;
        }
      }
    }
  });

  document.getElementById('settings-btn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});