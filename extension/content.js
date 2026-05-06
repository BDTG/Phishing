// ============================================================
// content.js — Script chạy trên mỗi trang web
// ============================================================
// File này được inject vào mọi trang web (http/https)
// Nhiệm vụ:
//   1. Gọi predictPhishing() để phân tích URL (đã bao gồm quét DOM và Domain Age)
//   2. Hiển thị banner cảnh báo nếu phát hiện phishing
//   3. Cập nhật icon extension theo trạng thái
// ============================================================

// IIFE (Immediately Invoked Function Expression) để tránh污染 global scope
// async vì cần await predictPhishing()
(async () => {
  // Lấy URL của trang hiện tại từ window.location
  const url = window.location.href;

  // Chỉ xử lý các URL bắt đầu bằng http hoặc https
  // Bỏ qua chrome://, file://, about:blank...
  if (!url.startsWith('http')) return;

  // Tránh chạy nhiều lần trên cùng 1 trang
  if (document.getElementById('phishing-detector-banner')) return;

  try {
    // ──────────────────────────────────────────────────────────
    // GỌI ENGINE DỰ ĐOÁN (Đã bao gồm ML + Content + Domain Age)
    // ──────────────────────────────────────────────────────────
    const mlResult = await predictPhishing(url);
    const { probability: finalProb, tier: finalTier, reason: finalReason, isPhishing } = mlResult;

    // Có nên hiển thị cảnh báo không?
    const shouldAlert = finalTier !== 'safe';

    // ──────────────────────────────────────────────────────────
    // CẬP NHẬT ICON EXTENSION
    // ──────────────────────────────────────────────────────────
    // Gửi message cho background script để cập nhật icon trên toolbar
    chrome.runtime.sendMessage({ type: 'updateIcon', tier: finalTier }).catch(() => {});

    // Nếu an toàn → không hiển thị banner
    if (!shouldAlert) return;

    // ──────────────────────────────────────────────────────────
    // XÂY DỰNG BANNER CẢNH BÁO
    // ──────────────────────────────────────────────────────────
    const banner = document.createElement('div');
    banner.id = 'phishing-detector-banner';

    // Cấu hình màu sắc theo tier
    const tierConfig = {
      warning: {
        bg: '#f57c00',          
        border: '#ff9800',      
        icon: '⚠️',              
        title: 'CẢNH BÁO: Trang này có dấu hiệu bất thường',
      },
      block: {
        bg: '#b71c1c',          
        border: '#ff1744',      
        icon: '🚫',              
        title: 'NGUY HIỂM: Trang này có thể là lừa đảo (phishing)!',
      },
    };

    const cfg = tierConfig[finalTier];

    // CSS inline cho banner
    banner.style.cssText = [
      'position:fixed',            
      'top:0', 'left:0', 'right:0', 
      'z-index:2147483647',        
      `background:${cfg.bg}`,      
      `border-bottom:3px solid ${cfg.border}`, 
      'color:#fff',                
      'padding:14px 20px',         
      'font-family:Arial,sans-serif', 
      'font-size:14px',            
      'display:flex',              
      'flex-direction:column',     
      'gap:8px',                   
      'box-shadow:0 4px 12px rgba(0,0,0,0.5)', 
      'line-height:1.5',           
    ].join(';');

    // ──────────────────────────────────────────────────────────
    // THU THẬP LÝ DO PHÁT HIỆN
    // ──────────────────────────────────────────────────────────
    const allReasons = [];
    if (finalReason) {
      // Split the reason string mapped by predictor to create bullet points
      const splitReasons = finalReason.split(' | ');
      allReasons.push(...splitReasons);
    }

    // ──────────────────────────────────────────────────────────
    // HTML: HEADER
    // ──────────────────────────────────────────────────────────
    const headerHTML =
      `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<span style="font-weight:bold;font-size:15px">${cfg.icon} ${cfg.title}</span>` +
        `<span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:12px;font-size:13px;white-space:nowrap">` +
          `${(finalProb * 100).toFixed(1)}%` +
        `</span>` +
      `</div>`;

    // ──────────────────────────────────────────────────────────
    // HTML: DANH SÁCH LÝ DO
    // ──────────────────────────────────────────────────────────
    let reasonsHTML = '';
    if (allReasons.length > 0) {
      reasonsHTML =
        `<div style="font-size:12px;font-weight:normal;background:rgba(0,0,0,0.15);` +
        `padding:8px 12px;border-radius:6px">` +
          `<div style="font-weight:bold;margin-bottom:4px;font-size:11px;text-transform:uppercase;opacity:0.8">` +
            `Lý do phát hiện:` +
          `</div>` +
          allReasons.map(r => `<div style="margin:3px 0">• ${r}</div>`).join('') +
        `</div>`;
    }

    // ──────────────────────────────────────────────────────────
    // HTML: NÚT BẤM
    // ──────────────────────────────────────────────────────────
    let actionsHTML = '';
    if (finalTier === 'warning') {
      actionsHTML =
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
          `<span style="font-size:10px;opacity:0.6">Phát hiện bởi Phishing Detector Extension</span>` +
          `<div style="display:flex;gap:8px">` +
            `<button id="phishing-dismiss-btn" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;padding:4px 14px;cursor:pointer;border-radius:4px;font-size:12px">Bỏ qua</button>` +
            `<button id="phishing-report-btn" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:4px 14px;cursor:pointer;border-radius:4px;font-size:12px">Báo cáo an toàn</button>` +
          `</div>` +
        `</div>`;
    } else {
      actionsHTML =
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
          `<span style="font-size:10px;opacity:0.6">Phát hiện bởi Phishing Detector Extension</span>` +
          `<button id="phishing-dismiss-btn" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;padding:4px 14px;cursor:pointer;border-radius:4px;font-size:12px">Đóng</button>` +
        `</div>`;
    }

    // Gắn HTML vào banner
    banner.innerHTML = headerHTML + reasonsHTML + actionsHTML;
    document.documentElement.prepend(banner);

    // ──────────────────────────────────────────────────────────
    // EVENT HANDLERS: Nút bấm
    // ──────────────────────────────────────────────────────────
    document.getElementById('phishing-dismiss-btn')?.addEventListener('click', () => banner.remove());
    document.getElementById('phishing-report-btn')?.addEventListener('click', () => {
      const report = { url, timestamp: Date.now(), action: 'report_safe', tier: finalTier };
      console.log('[PhishingDetector] False positive report:', report);
      alert('Cảm ơn báo cáo của bạn! Extension sẽ cải thiện độ chính xác.');
      banner.remove();
    });

  } catch (e) {
    console.debug('[PhishingDetector] Error:', e);
  }
})();
