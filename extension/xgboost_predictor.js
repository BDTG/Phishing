// ============================================================
// xgboost_predictor.js — Engine dự đoán phishing chính
// ============================================================
// File này chứa logic phân tích URL và đưa ra quyết định
// Kiến trúc: 3-Layer + 3-Tier Threshold
// ============================================================

// Biến toàn cục lưu model XGBoost đã load
// null = chưa load, object = đã load
let xgbModel = null;

// Biến toàn cục lưu danh sách Tranco Top 30K
// null = chưa load, Set = đã load
let trancoTop30k = null;

/**
 * Load model XGBoost từ file JSON
 * Ưu tiên model v2 (38 features), fallback về v1 nếu không có
 * @async
 * @returns {Promise<void>}
 */
async function loadModel() {
  // Nếu model đã load rồi → không load lại (cache)
  if (xgbModel) return;

  try {
    // Load model v4 (39 features, xử lý URL full path + IP logic mới)
    const url = chrome.runtime.getURL('models/xgboost_model_v4.json');
    const resp = await fetch(url);
    xgbModel = await resp.json();
    xgbModel.version = 'v4';
  } catch (e) {
    // Fallback về model v1 (30 features, original)
    const url = chrome.runtime.getURL('models/xgboost_model_tuned.json');
    const resp = await fetch(url);
    xgbModel = await resp.json();
    xgbModel.version = 'v1';
  }
}

/**
 * Load danh sách Tranco Top 30K domains
 * Dùng để whitelist các site phổ biến → ZERO false positives
 * @async
 * @returns {Promise<Set>} Set chứa 30,000 domains phổ biến nhất
 */
async function loadTrancoTop30k() {
  // Nếu đã load rồi → return cache
  if (trancoTop30k) return trancoTop30k;

  try {
    const url = chrome.runtime.getURL('data/tranco_top30k.json');
    const resp = await fetch(url);
    const data = await resp.json();
    // Chuyển array thành Set để lookup O(1)
    trancoTop30k = new Set(data.domains.map(d => d.toLowerCase()));
    return trancoTop30k;
  } catch (e) {
    // Nếu load lỗi → return Set rỗng (không whitelist gì cả)
    trancoTop30k = new Set();
    return trancoTop30k;
  }
}

/**
 * Duyệt cây quyết định XGBoost để tìm leaf value
 * @param {Object} tree - Object chứa thông tin 1 cây quyết định
 * @param {number[]} features - Array 38 đặc trưng trích xuất từ URL
 * @returns {number} Giá trị leaf node (dùng để tính margin)
 */
function traverseTree(tree, features) {
  const leftChildren = tree.left_children;
  const rightChildren = tree.right_children;
  const splitIndices = tree.split_indices;
  const splitConditions = tree.split_conditions;
  const baseWeights = tree.base_weights;

  // Bắt đầu từ root node (index = 0)
  let node = 0;

  // Duyệt từ root xuống leaf
  // left_children[node] === -1 → node này là leaf
  while (leftChildren[node] !== -1) {
    const featureIdx = splitIndices[node]; // Index feature cần so sánh
    const threshold = splitConditions[node]; // Threshold so sánh
    // Nếu feature value < threshold → đi sang left child
    // Ngược lại → đi sang right child
    node = features[featureIdx] < threshold
      ? leftChildren[node]
      : rightChildren[node];
  }

  // Trả về giá trị của leaf node
  return baseWeights[node];
}

/**
 * Hàm sigmoid: chuyển margin thành xác suất [0, 1]
 * P(phishing) = 1 / (1 + e^(-margin))
 * @param {number} x - Margin (tổng leaf values của tất cả trees)
 * @returns {number} Xác suất phishing từ 0 đến 1
 */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// ============================================================
// BRAND IMPERSONATION DETECTION
// ============================================================
// Danh sách thương hiệu cần bảo vệ
// Mỗi brand có: officialDomains (domain chính thức) + keywords (từ khóa nhận diện)
// ============================================================

const BRANDS_CONFIG = {
  paypal: {
    officialDomains: ['paypal.com', 'www.paypal.com'],
    keywords: ['paypal'],
  },
  google: {
    officialDomains: ['google.com', 'www.google.com', 'google.com.vn'],
    keywords: ['google'],
  },
  microsoft: {
    officialDomains: ['microsoft.com', 'www.microsoft.com'],
    keywords: ['microsoft'],
  },
  apple: {
    officialDomains: ['apple.com', 'www.apple.com'],
    keywords: ['apple'],
  },
  facebook: {
    officialDomains: ['facebook.com', 'www.facebook.com'],
    keywords: ['facebook'],
  },
  amazon: {
    officialDomains: ['amazon.com', 'www.amazon.com'],
    keywords: ['amazon'],
  },
  fitgirl: {
    officialDomains: ['fitgirl-repacks.site', 'www.fitgirl-repacks.site'],
    keywords: ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
  },
};

/**
 * Tính khoảng cách Levenshtein giữa 2 string
 * Levenshtein distance = số lần insert/delete/replace để biến a thành b
 * Ví dụ: "kitten" → "sitting" = 3 (k→s, e→i, +g)
 * @param {string} a - String thứ nhất
 * @param {string} b - String thứ hai
 * @returns {number} Khoảng cách Levenshtein
 */
function levenshteinDistance(a, b) {
  // Tạo ma trận (b.length + 1) × (a.length + 1)
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  // Fill ma trận theo dynamic programming
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]; // Ký tự giống nhau → không cần operation
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Replace
          matrix[i][j - 1] + 1,     // Insert
          matrix[i - 1][j] + 1      // Delete
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Kiểm tra typosquatting — domain giả mạo gần giống domain thật
 * @param {string} hostname - Domain cần kiểm tra
 * @param {string} officialDomain - Domain chính thức
 * @param {number} threshold - Khoảng cách Levenshtein tối đa (mặc định = 3)
 * @returns {boolean} True nếu là typosquatting
 */
function isTyposquatting(hostname, officialDomain, threshold = 3) {
  const hostBase = hostname.split('.')[0]; // Phần trước dấu chấm đầu tiên
  const officialBase = officialDomain.split('.')[0];

  // Bỏ qua domain quá ngắn (dễ false positive)
  if (hostBase.length < 4 || officialBase.length < 4) return false;

  // Tính khoảng cách Levenshtein
  const distance = levenshteinDistance(hostBase, officialBase);

  // Nếu distance <= threshold VÀ khác domain gốc → typosquatting
  return distance <= threshold && distance > 0 && hostBase !== officialBase;
}

/**
 * Kiểm tra brand impersonation — domain giả mạo thương hiệu
 * @param {string} urlStr - URL cần kiểm tra
 * @returns {Object} { isImpersonation: boolean, probability: number, reason: string }
 */
function checkBrandImpersonation(urlStr) {
  let hostname = '';
  try {
    hostname = new URL(urlStr).hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    return { isImpersonation: false, probability: 0, reason: '' };
  }

  // ── BƯỚC 1: Check exact keyword match ──
  for (const [brandName, brandInfo] of Object.entries(BRANDS_CONFIG)) {
    // Kiểm tra hostname có chứa keyword của brand không
    const brandInHostname = brandInfo.keywords.some(kw =>
      hostname.includes(kw.toLowerCase())
    );
    if (!brandInHostname) continue;

    // Kiểm tra có phải official domain HOẶC subdomain của official domain không
    const isOfficial = brandInfo.officialDomains.some(od => {
      const officialHost = od.toLowerCase().replace(/^www\./, '');
      return hostname === officialHost
        || hostname === 'www.' + officialHost
        || hostname.endsWith('.' + officialHost); // subdomain chính thức
    });

    if (isOfficial) {
      return { isImpersonation: false, probability: 0.01, reason: 'Official domain' };
    }

    // Typosquatting check
    let isTyposquatted = false;
    for (const od of brandInfo.officialDomains) {
      const officialHost = od.toLowerCase().replace(/^www\./, '');
      if (isTyposquatting(hostname, officialHost, 3)) {
        isTyposquatted = true;
        break;
      }
    }

    if (isTyposquatted) {
      return {
        isImpersonation: true,
        probability: 0.90,
        reason: `Typosquatting "${brandName}"`,
      };
    }

    return {
      isImpersonation: true,
      probability: 0.85,
      reason: `Brand impersonation "${brandName}"`,
    };
  }

  // ── BƯỚC 2: Fuzzy domain matching ──
  // So sánh với TẤT CẢ official domains (phát hiện case như paypa1.com, goggle.com)
  const hostBase = hostname.split('.')[0];
  if (hostBase.length >= 4) {
    for (const [brandName, brandInfo] of Object.entries(BRANDS_CONFIG)) {
      for (const od of brandInfo.officialDomains) {
        const officialHost = od.toLowerCase().replace(/^www\./, '');
        const officialBase = officialHost.split('.')[0];

        // Bỏ qua nếu đã là official domain hoặc subdomain
        if (hostname === officialHost || hostname.endsWith('.' + officialHost)) continue;

        // Check fuzzy match với threshold=3
        const distance = levenshteinDistance(hostBase, officialBase);
        if (distance >= 1 && distance <= 3) {
          return {
            isImpersonation: true,
            probability: distance <= 2 ? 0.90 : 0.85,
            reason: `Typosquatting "${brandName}" (distance=${distance})`,
          };
        }
      }
    }
  }

  return { isImpersonation: false, probability: 0, reason: '' };
}

// ============================================================
// HELPER FUNCTIONS — IP, Homograph, URL Decoding
// ============================================================

/**
 * Kiểm tra hostname có phải là địa chỉ IP không
 * @param {string} hostname - Hostname cần kiểm tra
 * @returns {boolean} True nếu là IP address
 */
function isIPAddress(hostname) {
  const ipv4Regex = /^\d{1,3}(\.\d{1,3}){3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  return ipv4Regex.test(hostname) || (hostname.includes(':') && ipv6Regex.test(hostname));
}

/**
 * Kiểm tra có phải Private/Local IP (RFC 1918 + loopback)
 * @param {string} hostname - Hostname cần kiểm tra
 * @returns {boolean} True nếu là private/local IP
 */
function isPrivateOrLocalIP(hostname) {
  const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|localhost$)/;
  return privateIPRegex.test(hostname);
}

/**
 * Phát hiện Homograph/IDN attack — hostname chứa ký tự không thuộc Latin cơ bản
 * @param {string} hostname - Hostname cần kiểm tra
 * @returns {boolean} True nếu chứa ký tự không phải Latin
 */
function isHomographSuspicious(hostname) {
  const latinOnlyRegex = /^[a-zA-Z0-9.-]+$/;
  return !latinOnlyRegex.test(hostname);
}

/**
 * Decode URL hoàn toàn — chống double/triple encoding
 * @param {string} urlStr - URL cần decode
 * @returns {string} URL đã decode hoàn toàn
 */
function safeDecodeURL(urlStr) {
  let decoded = urlStr;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch (e) {
      break;
    }
  }
  return decoded;
}

// ============================================================
// SAFE DOMAINS (WHITELIST CỤ THỂ)
// ============================================================

const SAFE_DOMAINS = new Set([
  'google.com','www.google.com','google.com.vn',
  'facebook.com','www.facebook.com',
  'amazon.com','www.amazon.com',
  'microsoft.com','www.microsoft.com',
  'apple.com','www.apple.com',
  'netflix.com','www.netflix.com',
  'youtube.com','www.youtube.com',
  'instagram.com','www.instagram.com',
  'twitter.com','www.twitter.com','x.com',
  'linkedin.com','www.linkedin.com',
  'paypal.com','www.paypal.com',
  'github.com','www.github.com',
  'wikipedia.org','www.wikipedia.org',
  'yahoo.com','www.yahoo.com',
  'bing.com','www.bing.com',
  'reddit.com','www.reddit.com',
  'claude.ai','chat.openai.com',
  'fitgirl-repacks.site','www.fitgirl-repacks.site',
  'kwindu.eu', 'linux-gaming.kwindu.eu',
  'rin.ru', 'cs.rin.ru',
  // Đại học HUTECH
  'hutech.edu.vn','www.hutech.edu.vn','e-graduate.hutech.edu.vn',
  'portal.hutech.edu.vn','tuyensinh.hutech.edu.vn',
]);

/**
 * Kiểm tra có phải subdomain của domain an toàn không
 * @param {string} hostname - Hostname cần kiểm tra
 * @returns {boolean} True nếu là subdomain của platform uy tín
 */
function isSubdomainOfSafe(hostname) {
  const safeParents = [
    'google.com', 'google.com.vn', 'facebook.com', 'microsoft.com', 'apple.com',
    'github.io', 'vercel.app', 'netlify.app', 'pages.dev', 'surge.sh',
  ];
  for (const parent of safeParents) {
    if (hostname === parent || hostname.endsWith('.' + parent)) return true;
  }
  return false;
}

// Auto-populate official domains từ BRANDS_CONFIG vào SAFE_DOMAINS
(function autoPopulateSafeDomains() {
  for (const brandInfo of Object.values(BRANDS_CONFIG)) {
    for (const domain of brandInfo.officialDomains) {
      SAFE_DOMAINS.add(domain.toLowerCase());
    }
  }
})();

// ============================================================
// SUSPICIOUS TLDs — Danh sách TLD thường dùng cho phishing
// ============================================================

const SUSP_TLDS_SET = new Set([
  '.xyz','.tk','.pw','.cc','.top','.club','.online',
  '.site','.icu','.gq','.ml','.cf','.ga',
]);

const REPUTABLE_TLDS = new Set([
  '.gov', '.edu', '.vn', '.eu', '.org', '.mil', '.int', '.ru'
]);

const PHISHING_KW_LIST = [
  'login','verify','account','update','secure','banking',
  'confirm','password','credential','wallet','payment','signin',
];

// ============================================================
// PREDICT WITH 3-LAYER + 3-TIER
// ============================================================

/**
 * Kiểm tra xem trang web có hoàn toàn "vô hại" không?
 * Một trang không có ô nhập liệu (input) và không có form thì không thể thu thập dữ liệu.
 */
function isPageHarmless() {
  try {
    const inputs = document.querySelectorAll('input, select, textarea');
    const forms = document.querySelectorAll('form');
    const interactableInputs = Array.from(inputs).filter(input => {
      if (input.type === 'hidden') return false;
      const style = window.getComputedStyle(input);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = input.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return interactableInputs.length === 0 && forms.length === 0;
  } catch (e) {
    return false;
  }
}

/**
 * Dự đoán xác suất phishing của URL
 * @param {string} urlStr - URL cần phân tích
 * @returns {Promise<Object>} { probability: number, tier: string, reason: string, isPhishing: boolean }
 */
async function predictPhishing(urlStr) {
  // Decode URL — chống double/triple encoding
  const decodedUrl = safeDecodeURL(urlStr);

  let hostname = '';
  let tld = '';
  try {
    const parsedUrl = new URL(decodedUrl);
    hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    const parts = hostname.split('.');
    tld = parts.length ? '.' + parts[parts.length - 1] : '';
  } catch (e) {
    return { probability: 0, tier: 'safe', reason: 'URL không hợp lệ', isPhishing: false };
  }

  // ── LAYER 0: Localhost + IP Address Detection ──
  if (hostname === 'localhost') {
    return { probability: 0.01, tier: 'safe', reason: 'Mạng nội bộ / Localhost', isPhishing: false };
  }
  if (isIPAddress(hostname)) {
    if (isPrivateOrLocalIP(hostname)) {
      return { probability: 0.01, tier: 'safe', reason: 'Mạng nội bộ / Localhost', isPhishing: false };
    }
  }

  // ── LAYER 0b: Homograph/IDN Detection ──
  if (isHomographSuspicious(hostname)) {
    const allBrandKws = [];
    for (const bi of Object.values(BRANDS_CONFIG)) allBrandKws.push(...bi.keywords);
    const hasBrandKw = allBrandKws.some(kw => hostname.includes(kw.toLowerCase()));

    if (hasBrandKw) {
      return { probability: 0.95, tier: 'block', reason: 'Ký tự không phải Latin nghi ngờ giả mạo (Homograph)', isPhishing: true };
    }
    return { probability: 0.70, tier: 'warning', reason: 'Domain chứa ký tự đặc biệt không thuộc Latin', isPhishing: true };
  }

  // ── LAYER 1: Whitelist cụ thể ──
  const isSafeDomain = Array.from(SAFE_DOMAINS).some(sd => 
    hostname === sd || hostname.endsWith('.' + sd)
  );

  if (isSafeDomain) {
    return { probability: 0.01, tier: 'safe', reason: 'Domain an toàn (whitelist)', isPhishing: false };
  }

  // ── LAYER 1a: Subdomain của platforms uy tín ──
  if (isSubdomainOfSafe(hostname)) {
    return { probability: 0.03, tier: 'safe', reason: 'Subdomain của platform uy tín', isPhishing: false };
  }

  // ── LAYER 1b: Dangerous URL Blacklist ──
  if (typeof loadDangerousUrls === 'function') {
    await loadDangerousUrls();
    const dangerCheck = isDangerousUrl(hostname);
    if (dangerCheck.isDangerous) {
      return { probability: 0.98, tier: 'block', reason: dangerCheck.reason, isPhishing: true };
    }
  }

  // ── LAYER 1c: Tranco Top 30K ──
  const top30k = await loadTrancoTop30k();
  if (top30k.size > 0 && top30k.has(hostname)) {
    return { probability: 0.05, tier: 'safe', reason: 'Domain phổ biến (Tranco Top 30K)', isPhishing: false };
  }

  // ── LAYER 2: Brand Impersonation ──
  const brandCheck = checkBrandImpersonation(decodedUrl);
  if (brandCheck.isImpersonation && brandCheck.reason === 'Official domain') {
    return { probability: brandCheck.probability, tier: 'safe', reason: 'Domain chính chủ', isPhishing: false };
  }

  // ── LAYER 3a: Suspicious TLD Rules ──
  const fullLower = decodedUrl.toLowerCase();
  let tldPenalty = 0;
  if (SUSP_TLDS_SET.has(tld)) {
    const hasPhishKw = PHISHING_KW_LIST.some(kw => fullLower.includes(kw));
    if (hasPhishKw) {
      return { probability: 0.97, tier: 'block', reason: 'TLD đáng ngờ + từ khóa phishing', isPhishing: true };
    }
    if (brandCheck.isImpersonation) {
      return { probability: 0.95, tier: 'block', reason: `Giả mạo thương hiệu + TLD đáng ngờ (${brandCheck.reason})`, isPhishing: true };
    }
    // Không chặn ngay, chỉ đánh dấu để xử lý sau ML model
    tldPenalty = 0.15; 
  }

  // ── LAYER 3b: Brand impersonation với TLD phổ thông ──
  if (brandCheck.isImpersonation) {
    return { probability: brandCheck.probability, tier: 'block', reason: brandCheck.reason, isPhishing: true };
  }

  // ── LAYER 3c: XGBoost ML Model ──
  await loadModel();
  const features = extractFeatures(decodedUrl);
  const trees = xgbModel.learner.gradient_booster.model.trees;

  let margin = 0;
  for (const tree of trees) {
    margin += traverseTree(tree, features);
  }

  let prob = sigmoid(margin);

  // ── POST-PROCESS: Intelligence Layers (IP & Domain Age) ──

  // 1. Kiểm tra tuổi domain để giảm nhẹ xác suất (Penalty Reduction)
  let domainAgeInfo = null;
  let hasReputationBonus = false;

  if (typeof getDomainAge === 'function') {
    domainAgeInfo = await getDomainAge(hostname);
    if (domainAgeInfo && domainAgeInfo.ageDays > 365 && prob > 0.75) {
      // Giảm 35% xác suất rủi ro cho domain > 1 năm
      prob *= 0.65; 
    } 
    // Nếu gặp lỗi Timeout/Network nhưng TLD uy tín (.eu, .vn, .gov...)
    else if (domainAgeInfo && domainAgeInfo.error && REPUTABLE_TLDS.has(tld) && prob > 0.75) {
      // TLD uy tín xứng đáng được giảm mạnh hơn để tránh False Positive (Giảm 25%)
      prob *= 0.75; 
      hasReputationBonus = true;
    }
  }

  // 2. Kiểm tra nội dung trang có "vô hại" không (Negative Signal)
  // Chỉ áp dụng khi ML rủi ro cao nhưng trang hoàn toàn không có form/input
  const isHarmless = isPageHarmless();
  let hasHarmlessBonus = false;

  if (isHarmless && prob > 0.70) {
    // Giảm 70% xác suất rủi ro (Hệ số 0.3)
    prob *= 0.3;
    hasHarmlessBonus = true;
  }

  const isPublicIP = isIPAddress(hostname) && !isPrivateOrLocalIP(hostname);
  let reason, tier, isPhishing;

  if (isPublicIP) {
    if (prob >= 0.85) {
      prob = 0.75; tier = 'warning'; isPhishing = true;
      reason = 'Địa chỉ IP công cộng có dấu hiệu bất thường (đã hạ bậc)';
    } else if (prob >= 0.60) {
      prob = 0.45; tier = 'safe'; isPhishing = false;
      reason = 'Địa chỉ IP công cộng (không đủ rủi ro để cảnh báo)';
    } else {
      tier = 'safe'; isPhishing = false; reason = 'ML model đánh giá an toàn';
    }
  } else {
    // Logic xác định Tier dựa trên xác suất đã qua xử lý
    if (prob >= 0.85) {
      tier = 'block'; isPhishing = true; 
      reason = 'ML model (XGBoost) đánh giá rủi ro cao';
    } else if (prob >= 0.75) {
      tier = 'warning'; isPhishing = true;
      if (domainAgeInfo && domainAgeInfo.ageDays > 365) {
        reason = `Cấu trúc lạ nhưng domain đã tồn tại ${domainAgeInfo.ageDays} ngày (Uy tín trung bình)`;      
      } else if (hasReputationBonus) {
        reason = `ML model báo rủi ro, nhưng TLD (${tld}) có độ tin cậy cơ bản (đã hạ bậc)`;
      } else {
        reason = 'ML model phát hiện dấu hiệu bất thường';
      }
    } else {
      tier = 'safe'; isPhishing = false;
      if (hasHarmlessBonus) {
        reason = 'An toàn: Trang không có chức năng thu thập dữ liệu (Vô hại)';
      } else if (domainAgeInfo && domainAgeInfo.ageDays > 365 && margin > 1.0) {
        reason = `An toàn: Domain lâu năm (${domainAgeInfo.ageDays} ngày) bù trừ cho các dấu hiệu nghi ngờ`;   
      } else if (hasReputationBonus) {
        reason = `An toàn: TLD (${tld}) uy tín giúp giảm thiểu nghi ngờ từ mô hình AI`;
      } else {
        reason = 'ML model đánh giá an toàn';
      }
    }
  }

  return { probability: prob, tier, reason, isPhishing };
  }
