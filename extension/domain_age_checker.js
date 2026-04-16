// ============================================================
// domain_age_checker.js
// Kiểm tra tuổi đời tên miền (domain age) qua RDAP API
// RDAP = Registration Data Access Protocol (hiện đại hơn WHOIS)
// Miễn phí, không cần API key, trả về JSON
// ============================================================

/**
 * Fetch domain age từ RDAP API
 * @param {string} domain - Domain cần kiểm tra (vd: "google.com")
 * @returns {Promise<{ageDays: number, createdDate: string|null, error: string|null}>}
 *   ageDays: Số ngày tuổi của domain
 *   createdDate: Ngày tạo domain (ISO format)
 *   error: Lỗi nếu có (null nếu thành công)
 */
async function getDomainAge(domain) {
  // Kiểm tra domain hợp lệ
  // Bỏ qua localhost và IP addresses
  if (!domain || domain.includes('localhost') || /^\d/.test(domain)) {
    return { ageDays: -1, createdDate: null, error: 'Not applicable' };
  }

  // ── BƯỚC 1: Lấy base domain (bỏ subdomain) ──
  // Ví dụ: "mail.google.com" → "google.com"
  //        "www.google.com" → "google.com"
  const parts = domain.split('.');
  let baseDomain = domain;

  if (parts.length > 2) {
    // Xử lý các trường hợp đặc biệt: .com.vn, .co.uk, .github.io...
    // Nếu phần thứ 2 từ cuối dài ≤ 3 ký tự → có thể là country code TLD
    if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
      baseDomain = parts.slice(-3).join('.'); // Lấy 3 phần cuối
    } else {
      baseDomain = parts.slice(-2).join('.'); // Lấy 2 phần cuối
    }
  }

  // Xử lý đặc biệt: github.io, vercel.app, netlify.app...
  // Đây là các platform hosting, không cần check age
  const specialPlatforms = ['github.io', 'vercel.app', 'netlify.app', 'pages.dev', 'surge.sh'];
  for (const platform of specialPlatforms) {
    if (domain.endsWith('.' + platform)) {
      baseDomain = platform;
      break;
    }
  }

  // ── BƯỚC 2: Chọn RDAP server theo TLD ──
  // Mỗi TLD có RDAP server khác nhau
  const rdapServers = {
    'com': 'https://rdap.verisign.com/com/v1/domain/',
    'net': 'https://rdap.verisign.com/net/v1/domain/',
    'org': 'https://rdap.org/domain/',
    'info': 'https://rdap.afilias.net/rdap/info/domain/',
    'xyz': 'https://rdap.centralnic.com/xyz/domain/',
    'io': 'https://rdap.nic.io/domain/',
    'eu': 'https://rdap.eu/domain/',
    'online': 'https://rdap.centralnic.com/online/domain/',
    'site': 'https://rdap.centralnic.com/site/domain/',
    'vn': 'https://rdap.vnnic.vn/v1/domain/',
    'com.vn': 'https://rdap.vnnic.vn/v1/domain/',
    // Fallback: rdap.org tự động redirect đến server đúng
    'default': 'https://rdap.org/domain/',
  };

  // Lấy TLD của domain
  const tld = baseDomain.split('.').pop();

  // Chọn RDAP server: ưu tiên theo TLD, fallback về default
  const rdapUrl = (rdapServers[tld] || rdapServers['default']) + baseDomain;

  // ── BƯỚC 3: Fetch RDAP API qua Background Script (để tránh CORS) ──
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'fetchDomainAge', rdapUrl }, (res) => {
        resolve(res || { success: false, error: 'Background disconnect' });
      });
    });

    if (!response.success) {
      return { ageDays: -1, createdDate: null, error: response.error };
    }

    const data = response.data;

    // ── BƯỚC 4: Tìm event "registration" hoặc "creation" ──
    // RDAP response có dạng:
    // {
    //   "events": [
    //     { "eventAction": "registration", "eventDate": "2000-01-01T00:00:00Z" },
    //     { "eventAction": "last changed", "eventDate": "2024-01-01T00:00:00Z" }
    //   ]
    // }
    const events = data.events || [];
    let createdDate = null;

    for (const event of events) {
      if (event.eventAction === 'registration' ||
          event.eventAction === 'creation') {
        createdDate = event.eventDate;
        break;
      }
    }

    // Nếu không tìm thấy ngày tạo → return error
    if (!createdDate) {
      return { ageDays: -1, createdDate: null, error: 'No creation date found' };
    }

    // ── BƯỚC 5: Tính tuổi domain ──
    const createdTime = new Date(createdDate).getTime();
    const nowTime = Date.now();
    const ageDays = Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24));

    return { ageDays, createdDate, error: null };

  } catch (e) {
    // Xử lý lỗi timeout
    if (e.name === 'AbortError') {
      return { ageDays: -1, createdDate: null, error: 'Timeout' };
    }
    // Các lỗi khác (network, parse...)
    return { ageDays: -1, createdDate: null, error: e.message };
  }
}

/**
 * Đánh giá rủi ro dựa trên tuổi đời domain
 * Domain càng trẻ → rủi ro càng cao
 * @param {number} ageDays - Tuổi domain (số ngày)
 * @returns {{score: number, reason: string, riskLevel: string}}
 *   score: Mức độ rủi ro (0.05 - 0.90)
 *   reason: Lý do bằng tiếng Việt
 *   riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
 */
function assessDomainAgeRisk(ageDays) {
  // Không thể xác định tuổi domain
  if (ageDays < 0) {
    return {
      score: 0.5,
      reason: 'Không kiểm tra được tuổi domain',
      riskLevel: 'unknown',
    };
  }

  // Domain rất trẻ (< 7 ngày) → RẤT NGHI NGỜ
  // Phishing sites thường chỉ sống vài ngày
  if (ageDays < 7) {
    return {
      score: 0.90,
      reason: `Domain MỚI TẠO (${ageDays} ngày) — RẤT NGHI NGỜ`,
      riskLevel: 'critical',
    };
  }

  // Domain trẻ (< 30 ngày) → CẢNH BÁO
  if (ageDays < 30) {
    return {
      score: 0.75,
      reason: `Domain trẻ (${ageDays} ngày) — CẢNH BÁO`,
      riskLevel: 'high',
    };
  }

  // Domain khá trẻ (< 90 ngày) → THẬN TRỌNG
  if (ageDays < 90) {
    return {
      score: 0.55,
      reason: `Domain khá trẻ (${ageDays} ngày) — THẬN TRỌNG`,
      riskLevel: 'medium',
    };
  }

  // Domain dưới 1 năm → ÍT NGHI NGỜ
  if (ageDays < 365) {
    return {
      score: 0.35,
      reason: `Domain ${ageDays} ngày — ÍT NGHI NGỜ`,
      riskLevel: 'low',
    };
  }

  // Domain lâu năm (> 1 năm) → UY TÍN
  return {
    score: 0.05,
    reason: `Domain lâu năm (${ageDays} ngày) — UY TÍN`,
    riskLevel: 'safe',
  };
}
