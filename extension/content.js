// ============================================================
// content.js — Script chạy trên mỗi trang web
// ============================================================
// File này được inject vào mọi trang web (http/https)
// Nhiệm vụ:
//   1. Gọi predictPhishing() để phân tích URL
//   2. Gọi analyzeContent() để phân tích DOM
//   3. Hiển thị banner cảnh báo nếu phát hiện phishing
//   4. Cập nhật icon extension theo trạng thái
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
  // Kiểm tra xem banner đã tồn tại chưa
  if (document.getElementById('phishing-detector-banner')) return;

  try {
    // ──────────────────────────────────────────────────────────
    // NGUỒN 1: XGBoost ML — Dự đoán từ URL
    // ──────────────────────────────────────────────────────────
    // predictPhishing() trả về object:
    //   { probability: 0.85, tier: 'block', reason: '...', isPhishing: true }
    const mlResult = await predictPhishing(url);
    const { probability: mlProb, tier, reason, isPhishing } = mlResult;

    // ──────────────────────────────────────────────────────────
    // DOMAIN AGE CHECK — Kiểm tra tuổi domain qua RDAP API
    // ──────────────────────────────────────────────────────────
    // Chạy song song, không block UI
    // Chỉ check nếu không phải IP, localhost
    let domainAgeInfo = null;
    try {
      // Parse hostname từ URL
      const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();

      // Bỏ qua IP addresses và localhost
      // Regex /^\d/ kiểm tra ký tự đầu có phải số không
      if (!/^\d/.test(hostname) && hostname !== 'localhost') {
        // getDomainAge() query RDAP API
        // Trả về: { ageDays: 365, createdDate: '2020-01-01', error: null }
        domainAgeInfo = await getDomainAge(hostname);
      }
    } catch (e) {
      // Bỏ qua nếu không check được (RDAP timeout, network error...)
      console.debug('[DomainAge] Error:', e.message);
    }
// ──────────────────────────────────────────────────────────
// NGUỒN 2: Content Analysis — Phân tích DOM
// ──────────────────────────────────────────────────────────
// Chỉ chạy khi ML probability > 0.1
// → Domain whitelist (0.01) sẽ bỏ qua → tránh false positive
// analyzeContent() trả về: { score: 0.6, warnings: ['Có form mật khẩu'] }
const contentResult = (typeof analyzeContent === 'function' && mlProb > 0.1)
  ? analyzeContent()
  : { score: 0, warnings: [] };

// ──────────────────────────────────────────────────────────
// FUSION — Kết hợp ML + Content
// ──────────────────────────────────────────────────────────
// Lấy giá trị cao hơn giữa ML (đã bao gồm Domain Age + Harmless logic) và Content
let finalProb = Math.max(mlProb, contentResult.score);
let finalTier = tier;
let finalReason = reason;

    // Nếu Content Analysis phát hiện rủi ro cực cao → ép lên Block
    if (contentResult.score >= 0.85 && finalTier !== 'block') {
      finalTier = 'block';
      finalReason = contentResult.warnings[0] || 'Phát hiện dấu hiệu lừa đảo trực tiếp trên trang';
    } else if (contentResult.score >= 0.60 && finalTier === 'safe') {
      // Nếu Content có rủi ro trung bình mà ML báo safe → nâng lên Warning
      finalTier = 'warning';
      finalReason = contentResult.warnings[0] || 'Phát hiện dấu hiệu bất thường từ nội dung trang';
    }

    // Có nên hiển thị cảnh báo không?
    const shouldAlert = finalTier !== 'safe';

    // ──────────────────────────────────────────────────────────
    // CẬP NHẬT ICON EXTENSION
    // ──────────────────────────────────────────────────────────
    // Gửi message cho background script để cập nhật icon trên toolbar
    // Message format: { type: 'updateIcon', tier: 'safe'|'warning'|'block' }
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
      // Warning tier — màu cam
      warning: {
        bg: '#f57c00',          // Background cam đậm
        border: '#ff9800',      // Viền cam sáng
        icon: '⚠️',              // Icon cảnh báo
        title: 'CẢNH BÁO: Trang này có dấu hiệu bất thường',
      },
      // Block tier — màu đỏ đậm
      block: {
        bg: '#b71c1c',          // Background đỏ đậm
        border: '#ff1744',      // Viền đỏ sáng
        icon: '🚫',              // Icon cấm
        title: 'NGUY HIỂM: Trang này có thể là lừa đảo (phishing)!',
      },
    };

    // Lấy config tương ứng với tier
    const cfg = tierConfig[finalTier];

    // CSS inline cho banner
    // position: fixed → luôn hiển thị trên cùng
    // z-index: max → nằm trên mọi element khác
    banner.style.cssText = [
      'position:fixed',            // Cố định trên màn hình
      'top:0', 'left:0', 'right:0', // Full width ở top
      'z-index:2147483647',        // Max z-index (2^31 - 1)
      `background:${cfg.bg}`,      // Màu background theo tier
      `border-bottom:3px solid ${cfg.border}`, // Viền dưới
      'color:#fff',                // Chữ trắng
      'padding:14px 20px',         // Padding
      'font-family:Arial,sans-serif', // Font Arial
      'font-size:14px',            // Cỡ chữ 14px
      'display:flex',              // Flexbox layout
      'flex-direction:column',     // Xếp dọc
      'gap:8px',                   // Khoảng cách giữa các phần
      'box-shadow:0 4px 12px rgba(0,0,0,0.5)', // Đổ bóng
      'line-height:1.5',           // Chiều cao dòng
    ].join(';');

    // ──────────────────────────────────────────────────────────
    // THU THẬP LÝ DO PHÁT HIỆN
    // ──────────────────────────────────────────────────────────
    const allReasons = [];

    // Lý do từ ML prediction (sau khi đã qua bộ lọc Fusion)
    if (finalReason) allReasons.push(finalReason);

    // Lý do từ Content Analysis
    if (contentResult.warnings.length > 0) {
      allReasons.push(...contentResult.warnings);
    }

    // Lý do từ Domain Age
    if (domainAgeInfo && domainAgeInfo.error === null) {
      // assessDomainAgeRisk() trả về { score, reason, riskLevel }
      const ageRisk = assessDomainAgeRisk(domainAgeInfo.ageDays);
      allReasons.push(`Tuổi domain: ${domainAgeInfo.ageDays} ngày — ${ageRisk.reason}`);
    } else if (domainAgeInfo && domainAgeInfo.error && finalTier !== 'safe') {
      // Chỉ hiển thị lỗi domain age khi site đã bị đánh dấu rủi ro
      allReasons.push(`⚠ Không kiểm tra được tuổi domain: ${domainAgeInfo.error}`);
    }

    // ──────────────────────────────────────────────────────────
    // HTML: HEADER
    // ──────────────────────────────────────────────────────────
    const headerHTML =
      `<div style="display:flex;justify-content:space-between;align-items:center">` +
        // Icon + tiêu đề
        `<span style="font-weight:bold;font-size:15px">${cfg.icon} ${cfg.title}</span>` +
        // Badge hiển thị xác suất
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
          // Label "Lý do phát hiện:"
          `<div style="font-weight:bold;margin-bottom:4px;font-size:11px;text-transform:uppercase;opacity:0.8">` +
            `Lý do phát hiện:` +
          `</div>` +
          // Danh sách lý do với bullet points
          allReasons.map(r => `<div style="margin:3px 0">• ${r}</div>`).join('') +
        `</div>`;
    }

    // ──────────────────────────────────────────────────────────
    // HTML: NÚT BẤM
    // ──────────────────────────────────────────────────────────
    let actionsHTML = '';
    if (finalTier === 'warning') {
      // Warning tier: có nút "Bỏ qua" và "Báo cáo an toàn"
      actionsHTML =
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
          `<span style="font-size:10px;opacity:0.6">Phát hiện bởi Phishing Detector Extension</span>` +
          `<div style="display:flex;gap:8px">` +
            `<button id="phishing-dismiss-btn" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;padding:4px 14px;cursor:pointer;border-radius:4px;font-size:12px">Bỏ qua</button>` +
            `<button id="phishing-report-btn" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:4px 14px;cursor:pointer;border-radius:4px;font-size:12px">Báo cáo an toàn</button>` +
          `</div>` +
        `</div>`;
    } else {
      // Block tier: chỉ có nút "Đóng"
      actionsHTML =
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
          `<span style="font-size:10px;opacity:0.6">Phát hiện bởi Phishing Detector Extension</span>` +
          `<button id="phishing-dismiss-btn" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;padding:4px 14px;cursor:pointer;border-radius:4px;font-size:12px">Đóng</button>` +
        `</div>`;
    }

    // Gắn HTML vào banner
    banner.innerHTML = headerHTML + reasonsHTML + actionsHTML;

    // Chèn banner vào đầu trang (prepend)
    document.documentElement.prepend(banner);

    // ──────────────────────────────────────────────────────────
    // EVENT HANDLERS: Nút bấm
    // ──────────────────────────────────────────────────────────
    // Nút "Đóng" / "Bỏ qua" — xóa banner
    document.getElementById('phishing-dismiss-btn')?.addEventListener('click', () => banner.remove());

    // Nút "Báo cáo an toàn" — log false positive
    document.getElementById('phishing-report-btn')?.addEventListener('click', () => {
      // Log thông tin báo cáo vào console
      // Sau này có thể gửi về server để retrain model
      const report = { url, timestamp: Date.now(), action: 'report_safe', tier: finalTier };
      console.log('[PhishingDetector] False positive report:', report);
      alert('Cảm ơn báo cáo của bạn! Extension sẽ cải thiện độ chính xác.');
      banner.remove();
    });

  } catch (e) {
    // Xử lý lỗi — không hiển thị lỗi với người dùng
    console.debug('[PhishingDetector] Error:', e);
  }
})();
