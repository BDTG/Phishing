// ============================================================
// domain_age_checker.js
// Kiểm tra tuổi đời tên miền (domain age) qua RDAP API
// RDAP = Registration Data Access Protocol (hiện đại hơn WHOIS)
// Miễn phí, không cần API key, trả về JSON
// ============================================================

/**
 * Fetch domain age từ RDAP API sử dụng chiến thuật Waterfall (Dự phòng động)
 * @param {string} domain - Domain cần kiểm tra
 */
async function getDomainAge(domain) {
  if (!domain || domain.includes('localhost') || /^\d/.test(domain)) {
    return { ageDays: -1, createdDate: null, error: 'Not applicable' };
  }

  const parts = domain.split('.');
  let baseDomain = domain;

  if (parts.length > 2) {
    if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
      baseDomain = parts.slice(-3).join('.');
    } else {
      baseDomain = parts.slice(-2).join('.');
    }
  }

  const specialPlatforms = ['github.io', 'vercel.app', 'netlify.app', 'pages.dev', 'surge.sh'];
  for (const platform of specialPlatforms) {
    if (domain.endsWith('.' + platform)) {
      baseDomain = platform;
      break;
    }
  }

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
  };

  const tld = baseDomain.split('.').pop();
  
  // CHIẾN THUẬT WATERFALL: Danh sách các API sẽ thử tuần tự
  const fallbackApis = [
    ...(rdapServers[tld] ? [rdapServers[tld] + baseDomain] : []), // Ưu tiên server chính hãng nếu có
    `https://rdap.org/domain/${baseDomain}`,                      // Dự phòng 1: rdap.org
    `https://www.rdap.net/domain/${baseDomain}`                   // Dự phòng 2: rdap.net
  ];

  let lastError = 'No API worked';

  for (const rdapUrl of fallbackApis) {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'fetchDomainAge', rdapUrl }, (res) => {
          resolve(res || { success: false, error: 'Background disconnect' });
        });
      });

      if (!response.success) {
        lastError = response.error;
        continue; // Nếu lỗi (VD: 404), thử API tiếp theo trong danh sách Waterfall
      }

      const data = response.data;
      const events = data.events || [];
      let createdDate = null;

      for (const event of events) {
        if (event.eventAction === 'registration' || event.eventAction === 'creation') {
          createdDate = event.eventDate;
          break;
        }
      }

      if (!createdDate) {
        lastError = 'No creation date found';
        continue; // Thử API tiếp theo
      }

      const createdTime = new Date(createdDate).getTime();
      const nowTime = Date.now();
      const ageDays = Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24));

      return { ageDays, createdDate, error: null };

    } catch (e) {
      if (e.name === 'AbortError') return { ageDays: -1, createdDate: null, error: 'Timeout' };
      lastError = e.message;
    }
  }

  // Nếu thử qua tất cả các API mà vẫn thất bại
  return { ageDays: -1, createdDate: null, error: lastError };
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
