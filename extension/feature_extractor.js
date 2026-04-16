// ============================================================
// feature_extractor.js
// Trích xuất 39 đặc trưng từ URL
// Thứ tự 39 feature phải KHỚP CHÍNH XÁC với Python training v4
// ============================================================
// 0:url_length          1:num_dots            2:num_hyphens
// 3:num_underscores     4:num_slashes         5:num_special_chars
// 6:digit_ratio         7:letter_ratio        8:has_port
// 9:url_entropy         10:domain_length      11:num_subdomains
// 12:has_ip_address     13:has_at_symbol      14:has_double_slash_redirect
// 15:tld_suspicious     16:has_hyphen_in_domain  17:subdomain_depth
// 18:path_length        19:num_query_params   20:has_fragment
// 21:path_depth         22:has_hex_encoding   23:num_digits_in_path
// 24:path_entropy       25:has_phishing_keywords  26:has_brand_keywords
// 27:has_https          28:has_login_words    29:suspicious_tld
// 30:brand_in_domain    31:is_official_domain 32:is_brand_impersonation
// 33:min_levenshtein    34:is_typosquatting   35:brand_mismatch_score
// 36:has_phishing_keywords_enhanced  37:combined_suspicious_score
// 38:is_bare_domain
// ============================================================

/**
 * Trích xuất 39 đặc trưng từ URL
 * @param {string} urlStr - URL cần trích xuất features
 * @returns {number[]} Array 39 số đặc trưng
 */
function extractFeatures(urlStr) {
  // Parse URL, nếu lỗi trả về array toàn 0
  let u;
  try { u = new URL(urlStr); } catch (e) { return new Array(39).fill(0); }

  // Normalize hostname: bỏ www. prefix
  const hostname = u.hostname.replace(/^www\./, '');

  // Bare domain: scheme + hostname (không path, không query)
  // Dùng bare domain để tránh bias từ path dài của URL hợp lệ
  const bare = u.protocol + '//' + hostname;

  // Full URL gốc (có path, query) — dùng cho keyword check
  const fullOrig = urlStr.toLowerCase();

  // Hàm tính entropy Shannon của string
  // Entropy cao = nhiều ký tự đa dạng (ngẫu nhiên)
  // Entropy thấp = ít ký tự đa dạng (có pattern)
  function entropy(s) {
    if (!s || s.length === 0) return 0;
    const freq = {};
    for (const c of s) freq[c] = (freq[c] || 0) + 1;
    return Object.values(freq).reduce((h, f) => {
      const p = f / s.length;
      return h - p * Math.log2(p);
    }, 0);
  }

  // Danh sách từ khóa phishing
  const PHISHING_KW = [
    'login','verify','account','update','secure','banking','confirm',
    'password','credential','wallet','payment','webscr','ebayisapi','signin'
  ];

  // Danh sách từ khóa brand
  const BRAND_KW = [
    'paypal','google','amazon','apple','microsoft','facebook','netflix',
    'instagram','twitter','linkedin','youtube','chase','wellsfargo',
    'bankofamerica','citibank'
  ];

  // Danh sách từ khóa login
  const LOGIN_KW = ['signin','logon','authenticate','login','log-in','sign-in'];

  // Danh sách TLD đáng ngờ
  const SUSP_TLDS = new Set([
    '.xyz','.tk','.pw','.cc','.top','.club','.online',
    '.site','.icu','.gq','.ml','.cf','.ga'
  ]);

  // Đếm số chữ số và chữ cái trong bare domain
  const digits = (bare.match(/\d/g) || []).length;
  const letters = (bare.match(/[a-zA-Z]/g) || []).length;

  // Tách hostname thành các phần (domain, subdomain, TLD)
  const parts = hostname.split('.');

  // Lấy TLD (ví dụ: ".com", ".xyz")
  const tld = parts.length ? '.' + parts[parts.length - 1] : '';

  // Kiểm tra TLD có trong danh sách suspicious không
  const suspTLD = SUSP_TLDS.has(tld.toLowerCase());

  // ──────────────────────────────────────────────────────────
  // GROUP 1 (0-9): URL cơ bản — dùng bare domain
  // ──────────────────────────────────────────────────────────
  const features0_9 = [
    // 0: Độ dài URL
    bare.length,
    // 1: Số dấu chấm
    (bare.match(/\./g) || []).length,
    // 2: Số dấu gạch ngang
    (bare.match(/-/g) || []).length,
    // 3: Số dấu gạch dưới
    (bare.match(/_/g) || []).length,
    // 4: Số dấu slash
    (bare.match(/\//g) || []).length,
    // 5: Số ký tự đặc biệt (không thuộc set hợp lệ)
    bare.split('').filter(c => !/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]/.test(c)).length,
    // 6: Tỷ lệ chữ số / độ dài URL
    bare.length > 0 ? digits / bare.length : 0,
    // 7: Tỷ lệ chữ cái / độ dài URL
    bare.length > 0 ? letters / bare.length : 0,
    // 8: Có port custom không? (không phải 80 hoặc 443)
    (u.port && u.port !== '80' && u.port !== '443') ? 1 : 0,
    // 9: Entropy Shannon của URL
    entropy(bare),
  ];

  // ──────────────────────────────────────────────────────────
  // GROUP 2 (10-17): Domain
  // ──────────────────────────────────────────────────────────
  const features10_17 = [
    // 10: Độ dài domain
    hostname.length,
    // 11: Số subdomains (parts - 2 vì có domain + TLD)
    Math.max(parts.length - 2, 0),
    // 12: Có phải IP address không? (IPv4)
    // Chỉ đánh dấu 1 cho Public IP, bỏ qua LAN/Localhost
    (function(h) {
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return 0;
      const p = h.split('.').map(Number);
      if (p[0] === 10) return 0; // 10.0.0.0/8
      if (p[0] === 172 && (p[1] >= 16 && p[1] <= 31)) return 0; // 172.16.0.0/12
      if (p[0] === 192 && p[1] === 168) return 0; // 192.168.0.0/16
      if (p[0] === 127) return 0; // 127.0.0.0/8
      if (p[0] === 0) return 0; // 0.0.0.0/8
      return 1;
    })(hostname),
    // 13: Có ký tự @ trong URL không? (dùng để giấu URL thật)
    urlStr.includes('@') ? 1 : 0,
    // 14: Có double slash redirect không? (// sau domain)
    // bare domain nên luôn = 0
    0,
    // 15: TLD có đáng ngờ không?
    suspTLD ? 1 : 0,
    // 16: Domain có dấu gạch ngang không?
    hostname.includes('-') ? 1 : 0,
    // 17: Độ sâu subdomain (alias của num_subdomains)
    Math.max(parts.length - 2, 0),
  ];

  // ──────────────────────────────────────────────────────────
  // GROUP 3 (18-24): Path/Query — dùng FULL URL (giống Python)
  // ──────────────────────────────────────────────────────────
  const path = u.pathname || '';
  const queryStr = u.search || '';
  const fragment = u.hash || '';

  // Đếm số query params (ví dụ: ?a=1&b=2 → 2 params)
  const queryParams = queryStr
    ? queryStr.replace(/^\?/, '').split('&').filter(s => s.length > 0).length
    : 0;

  // Đếm số chữ số trong path
  const digitsInPath = (path.match(/\d/g) || []).length;

  const features18_24 = [
    // 18: path_length — độ dài path
    path.length,
    // 19: num_query_params — số tham số query
    queryParams,
    // 20: has_fragment — có fragment (#...) không?
    fragment.length > 0 ? 1 : 0,
    // 21: path_depth — số dấu / trong path (độ sâu thư mục)
    (path.match(/\//g) || []).length,
    // 22: has_hex_encoding — có %xx encoding trong path không?
    path.includes('%') ? 1 : 0,
    // 23: num_digits_in_path — số chữ số trong path
    digitsInPath,
    // 24: path_entropy — entropy Shannon của path
    entropy(path),
  ];

  // ──────────────────────────────────────────────────────────
  // GROUP 4 (25-29): Keywords — kiểm tra trên FULL URL
  // ──────────────────────────────────────────────────────────
  const features25_29 = [
    // 25: Có từ khóa phishing trong URL không?
    PHISHING_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    // 26: Có từ khóa brand trong URL không?
    BRAND_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    // 27: Có dùng HTTPS không?
    u.protocol === 'https:' ? 1 : 0,
    // 28: Có từ khóa login trong URL không?
    LOGIN_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    // 29: TLD có đáng ngờ không? (alias của tld_suspicious)
    suspTLD ? 1 : 0,
  ];

  // ──────────────────────────────────────────────────────────
  // GROUP 5 (30-37): Brand Impersonation
  // ──────────────────────────────────────────────────────────
  // Danh sách tất cả brand keywords
  const allBrandKws = [
    'paypal','google','amazon','apple','microsoft','facebook','netflix',
    'instagram','twitter','linkedin','youtube','fitgirl','vietcombank',
    'techcombank','mbbank','bidv','agribank','momo','zalopay',
  ];

  // 30: brand_in_domain — domain có chứa brand keyword không?
  const brandInDomain = allBrandKws.some(kw => hostname.includes(kw)) ? 1 : 0;

  // 31: is_official_domain — có phải domain chính chủ không?
  const officialDomains = [
    'paypal.com','google.com','google.com.vn','amazon.com','microsoft.com',
    'apple.com','facebook.com','netflix.com','instagram.com','twitter.com',
    'x.com','linkedin.com','youtube.com','fitgirl-repacks.site',
    'vietcombank.com.vn','techcombank.com.vn','mbbank.com.vn',
    'bidv.com.vn','agribank.com.vn','momo.vn','zalopay.vn',
  ];
  const isOfficialDomain = officialDomains.some(od => {
    const lowOD = od.toLowerCase();
    return hostname === lowOD || hostname.endsWith('.' + lowOD);
  }) ? 1 : 0;

  // 32: is_brand_impersonation — có brand keyword nhưng không phải official?
  const isBrandImpersonation = (brandInDomain && !isOfficialDomain) ? 1 : 0;

  // 33-34: Levenshtein distance đến official domains
  let minLevenshtein = 999;
  for (const od of officialDomains) {
    const officialHost = od.toLowerCase().replace(/^www\./, '');
    const hostBase = hostname.split('.')[0];
    const officialBase = officialHost.split('.')[0];
    if (hostBase.length >= 4 && officialBase.length >= 4) {
      const dist = levenshteinDistance(hostBase, officialBase);
      minLevenshtein = Math.min(minLevenshtein, dist);
    }
  }
  const minLev = minLevenshtein < 999 ? minLevenshtein : 0;

  // 34: is_typosquatting — Levenshtein <= 2?
  const isTyposquatting = (minLev <= 2 && minLev > 0) ? 1 : 0;

  // 35: brand_mismatch_score — số brand keywords trong domain (cap ở 5)
  const brandMismatchScore = Math.min(
    allBrandKws.filter(kw => hostname.includes(kw)).length, 5
  );

  // 36: has_phishing_keywords_enhanced — phishing KW hoặc brand impersonation
  const hasPhishingKw = PHISHING_KW.some(kw => fullOrig.includes(kw));
  const hasPhishingKeywordsEnhanced = (hasPhishingKw || isBrandImpersonation) ? 1 : 0;

  // 37: combined_suspicious_score — weighted composite score
  let suspScore = 0;
  if (suspTLD) suspScore += 3;
  if (isBrandImpersonation) suspScore += 4;
  if (minLev <= 2 && minLev > 0) suspScore += 3;
  if (hasPhishingKw) suspScore += 2;
  if (brandMismatchScore > 0) suspScore += brandMismatchScore;
  const combinedSuspiciousScore = Math.min(suspScore, 15);

  const features30_37 = [
    brandInDomain, isOfficialDomain, isBrandImpersonation,
    minLev, isTyposquatting, brandMismatchScore,
    hasPhishingKeywordsEnhanced, combinedSuspiciousScore,
  ];

  // 38: is_bare_domain — URL không có path, query, fragment?
  // u.pathname trong JS mặc định là "/" nếu không có path
  const isBareDomain = (path === '/' || path === '') && queryStr === '' && fragment === '' ? 1 : 0;

  // Gộp tất cả features thành array 39 phần tử
  return [
    ...features0_9,
    ...features10_17,
    ...features18_24,
    ...features25_29,
    ...features30_37,
    isBareDomain
  ];
}

/**
 * Tính khoảng cách Levenshtein giữa 2 string
 * @param {string} a - String thứ nhất
 * @param {string} b - String thứ hai
 * @returns {number} Khoảng cách Levenshtein
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
