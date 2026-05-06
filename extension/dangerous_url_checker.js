// ============================================================
// dangerous_url_checker.js
// Kiểm tra URL có nằm trong danh sách nguy hiểm đã biết không
// Load từ dangerous_urls.json (120+ URLs + wildcards)
// ============================================================

// Biến toàn cục lưu danh sách dangerous URLs
// null = chưa load, Set = đã load
let dangerousUrlList = null;

// Biến toàn cục lưu wildcard patterns
// Ví dụ: "*.free-robux-generator.*"
let dangerousUrlWildcards = [];

// Flag đánh dấu đã load xong chưa
let dangerousUrlsLoaded = false;

/**
 * Load danh sách dangerous URLs từ JSON file
 * @async
 * @returns {Promise<boolean>} True nếu load thành công
 */
async function loadDangerousUrls() {
  // Nếu đã load rồi → không load lại (cache)
  if (dangerousUrlsLoaded) return true;

  // Khởi tạo Set rỗng nếu chưa có
  if (dangerousUrlList === null) dangerousUrlList = new Set();

  try {
    // Lấy đường dẫn absolute đến file JSON trong extension package
    const url = chrome.runtime.getURL('data/dangerous_urls.json');

    // Fetch file JSON
    const resp = await fetch(url);

    // Nếu fetch lỗi (404, network error...) → log warning và return false
    if (!resp.ok) {
      console.warn('[DangerousURL] Failed to load dangerous_urls.json:', resp.status);
      dangerousUrlsLoaded = true; // Đánh dấu đã thử load (dù fail)
      return false;
    }

    // Parse JSON
    const data = await resp.json();

    // Chuyển array URLs thành Set để lookup O(1)
    // toLowerCase() để case-insensitive matching
    dangerousUrlList = new Set((data.urls || []).map(u => u.toLowerCase()));

    // Lưu wildcard patterns
    dangerousUrlWildcards = data.wildcards || [];

    // ── TÍCH HỢP DYNAMIC BLACKLIST TỪ PHISHING.ARMY ──
    try {
      const dynamicResp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'fetchDynamicBlacklist' }, resolve);
      });
      
      if (dynamicResp && dynamicResp.success && Array.isArray(dynamicResp.data)) {
        // Gộp hàng nghìn domain từ Cloud vào Set hiện tại
        dynamicResp.data.forEach(domain => dangerousUrlList.add(domain));
        console.log(`[DangerousURL] Đã tải thành công Danh sách đen Động từ ${dynamicResp.source} (${dynamicResp.data.length} tên miền)`);
      } else if (dynamicResp && dynamicResp.error) {
        console.warn('[DangerousURL] Lỗi tải Danh sách đen Động:', dynamicResp.error);
      }
    } catch (e) {
      console.warn('[DangerousURL] Mất kết nối tới Background Script khi tải Danh sách đen Động', e);
    }

    // Đánh dấu đã load thành công
    dangerousUrlsLoaded = true;
    return true;

  } catch (e) {
    // Log warning nếu có lỗi
    console.warn('[DangerousURL] Error loading dangerous_urls.json:', e.message);
    dangerousUrlsLoaded = true; // Đánh dấu đã thử load
    return false;
  }
}

/**
 * Kiểm tra hostname có trùng với dangerous URL không
 * Bao gồm cả exact match và wildcard matching
 * @param {string} hostname - Hostname cần kiểm tra
 * @returns {Object} { isDangerous: boolean, reason: string }
 */
function isDangerousUrl(hostname) {
  // Nếu chưa load được list → bỏ qua, không block nhầm
  // Đây là fallback an toàn
  if (!dangerousUrlsLoaded || !dangerousUrlList) {
    return { isDangerous: false, reason: '' };
  }

  // Normalize hostname
  const h = (hostname || '').toLowerCase();
  if (!h) return { isDangerous: false, reason: '' };

  // ── CHECK 1: Exact match ──
  // Kiểm tra xem hostname có trong Set dangerous URLs không
  // O(1) lookup nhờ Set
  if (dangerousUrlList.has(h)) {
    return {
      isDangerous: true,
      reason: 'URL nằm trong danh sách nguy hiểm đã biết',
    };
  }

  // ── CHECK 2: Wildcard match ──
  // Kiểm tra xem hostname có khớp với pattern nào không
  // Ví dụ: "*.free-robux-generator.*" khớp với "free-robux-generator.xyz"
  for (const pattern of dangerousUrlWildcards) {
    // Chuyển wildcard pattern thành regex
    // * → [^.]+ (một hoặc nhiều ký tự không phải dấu chấm)
    // . → \. (escape dấu chấm)
    const regexPattern = pattern
      .toLowerCase()
      .replace(/\./g, '\\.')   // Escape dấu chấm
      .replace(/\*/g, '[^.]+'); // * → [^.]+

    try {
      // Tạo RegExp object
      const regex = new RegExp('^' + regexPattern + '$');

      // Test hostname với regex
      if (regex.test(h)) {
        return {
          isDangerous: true,
          reason: `URL khớp pattern nguy hiểm: ${pattern}`,
        };
      }
    } catch (e) {
      // Bỏ qua pattern lỗi (regex không hợp lệ)
      console.warn('[DangerousURL] Invalid pattern:', pattern, e);
    }
  }

  // Nếu không match gì → an toàn
  return { isDangerous: false, reason: '' };
}
