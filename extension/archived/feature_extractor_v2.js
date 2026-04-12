// feature_extractor.js
// Trích xuất 38 đặc trưng từ URL — phải khớp đúng thứ tự với Python 02_feature_extraction_v2.py
//
// 30 features cũ + 8 features mới cho brand impersonation
//
// Thứ tự 38 feature:
// 0:url_length  1:num_dots  2:num_hyphens  3:num_underscores  4:num_slashes
// 5:num_special_chars  6:digit_ratio  7:letter_ratio  8:has_port  9:url_entropy
// 10:domain_length  11:num_subdomains  12:has_ip_address  13:has_at_symbol
// 14:has_double_slash_redirect  15:tld_suspicious  16:has_hyphen_in_domain
// 17:subdomain_depth  18:path_length  19:num_query_params  20:has_fragment
// 21:path_depth  22:has_hex_encoding  23:num_digits_in_path  24:path_entropy
// 25:has_phishing_keywords  26:has_brand_keywords  27:has_https
// 28:has_login_words  29:suspicious_tld
// 30:brand_in_domain  31:is_official_domain  32:is_brand_impersonation
// 33:min_levenshtein_to_official  34:is_typosquatting  35:brand_mismatch_score
// 36:has_phishing_keywords_enhanced  37:combined_suspicious_score

// ============================================================
// BRAND CONFIG (phải khớp với Python)
// ============================================================
const BRANDS_TO_PROTECT = {
  fitgirl: {
    officialDomains: ['fitgirl-repacks.site'],
    keywords: ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
  },
  paypal: {
    officialDomains: ['paypal.com'],
    keywords: ['paypal'],
  },
  google: {
    officialDomains: ['google.com', 'google.com.vn'],
    keywords: ['google'],
  },
  microsoft: {
    officialDomains: ['microsoft.com'],
    keywords: ['microsoft'],
  },
  apple: {
    officialDomains: ['apple.com'],
    keywords: ['apple'],
  },
  facebook: {
    officialDomains: ['facebook.com'],
    keywords: ['facebook'],
  },
  amazon: {
    officialDomains: ['amazon.com'],
    keywords: ['amazon'],
  },
};

// ============================================================
// HELPER: Levenshtein Distance
// ============================================================
function levenshteinDistance(a, b) {
  if (a.length < b.length) return levenshteinDistance(b, a);
  if (b.length === 0) return a.length;
  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const currRow = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const insertions = prevRow[j + 1] + 1;
      const deletions = currRow[j] + 1;
      const substitutions = prevRow[j] + (a[i] !== b[j] ? 1 : 0);
      currRow.push(Math.min(insertions, deletions, substitutions));
    }
    prevRow = currRow;
  }
  return prevRow[prevRow.length - 1];
}

// ============================================================
// EXTRACT FEATURES
// ============================================================
function extractFeatures(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch (e) { return new Array(38).fill(0); }

  const hostname = u.hostname.replace(/^www\./, '');
  const bare     = u.protocol + '//' + hostname;
  const fullOrig = urlStr.toLowerCase();

  function entropy(s) {
    if (!s || s.length === 0) return 0;
    const freq = {};
    for (const c of s) freq[c] = (freq[c] || 0) + 1;
    return Object.values(freq).reduce((h, f) => {
      const p = f / s.length;
      return h - p * Math.log2(p);
    }, 0);
  }

  const PHISHING_KW = ['login','verify','account','update','secure','banking','confirm',
                        'password','credential','wallet','payment','webscr','ebayisapi','signin'];
  const LOGIN_KW    = ['signin','logon','authenticate','login','log-in','sign-in'];
  const SUSP_TLDS   = new Set(['.xyz','.tk','.pw','.cc','.top','.club','.online',
                                '.site','.icu','.gq','.ml','.cf','.ga']);

  const digits  = (bare.match(/\d/g) || []).length;
  const letters = (bare.match(/[a-zA-Z]/g) || []).length;
  const parts   = hostname.split('.');
  const tld     = parts.length ? '.' + parts[parts.length - 1] : '';
  const suspTLD = SUSP_TLDS.has(tld.toLowerCase());

  // ── 30 FEATURES CŨ ──
  const features30 = [
    bare.length,
    (bare.match(/\./g) || []).length,
    (bare.match(/-/g) || []).length,
    (bare.match(/_/g) || []).length,
    (bare.match(/\//g) || []).length,
    bare.split('').filter(c => !/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]/.test(c)).length,
    bare.length > 0 ? digits / bare.length : 0,
    bare.length > 0 ? letters / bare.length : 0,
    (u.port && u.port !== '80' && u.port !== '443') ? 1 : 0,
    entropy(bare),
    hostname.length,
    Math.max(parts.length - 2, 0),
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ? 1 : 0,
    urlStr.includes('@') ? 1 : 0,
    0,  // has_double_slash_redirect
    suspTLD ? 1 : 0,
    hostname.includes('-') ? 1 : 0,
    Math.max(parts.length - 2, 0),
    0, 0, 0, 0, 0, 0, 0,  // path features
    PHISHING_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    0,  // has_brand_keywords (sẽ tính ở feature mới)
    u.protocol === 'https:' ? 1 : 0,
    LOGIN_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    suspTLD ? 1 : 0,
  ];

  // ── 8 FEATURES MỚI: BRAND IMPERSONATION ──

  // Thu thập tất cả brand keywords
  const allBrandKws = [];
  for (const brandInfo of Object.values(BRANDS_TO_PROTECT)) {
    allBrandKws.push(...brandInfo.keywords);
  }

  // 30: brand_in_domain
  const brandInDomain = allBrandKws.some(kw => hostname.includes(kw)) ? 1 : 0;

  // 31: is_official_domain
  let isOfficial = false;
  for (const brandInfo of Object.values(BRANDS_TO_PROTECT)) {
    for (const od of brandInfo.officialDomains) {
      const officialHost = od.toLowerCase().replace(/^www\./, '');
      if (hostname === officialHost || hostname === 'www.' + officialHost) {
        isOfficial = true;
        break;
      }
    }
    if (isOfficial) break;
  }
  const isOfficialDomain = isOfficial ? 1 : 0;

  // 32: is_brand_impersonation
  let isImpersonation = false;
  for (const [brandName, brandInfo] of Object.entries(BRANDS_TO_PROTECT)) {
    const brandInHostname = brandInfo.keywords.some(kw => hostname.includes(kw));
    if (!brandInHostname) continue;
    const isOff = brandInfo.officialDomains.some(od => {
      const officialHost = od.toLowerCase().replace(/^www\./, '');
      return hostname === officialHost || hostname === 'www.' + officialHost;
    });
    if (brandInHostname && !isOff) {
      isImpersonation = true;
      break;
    }
  }
  const isBrandImpersonation = isImpersonation ? 1 : 0;

  // 33: min_levenshtein_to_official
  const hostBase = hostname.split('.')[0];
  let minDist = 999;
  if (hostBase.length >= 5) {
    for (const brandInfo of Object.values(BRANDS_TO_PROTECT)) {
      for (const od of brandInfo.officialDomains) {
        const officialBase = od.toLowerCase().replace(/^www\./, '').split('.')[0];
        if (officialBase.length >= 5) {
          const dist = levenshteinDistance(hostBase, officialBase);
          minDist = Math.min(minDist, dist);
        }
      }
    }
  }
  const minLevenshtein = minDist < 999 ? minDist : 0;

  // 34: is_typosquatting
  const isTyposquatting = (minDist <= 2 && minDist > 0) ? 1 : 0;

  // 35: brand_mismatch_score
  let brandCount = 0;
  for (const kw of allBrandKws) {
    if (hostname.includes(kw)) brandCount++;
  }
  const brandMismatchScore = Math.min(brandCount, 5);

  // 36: has_phishing_keywords_enhanced
  const hasPhishKw = PHISHING_KW.some(kw => fullOrig.includes(kw));
  const hasPhishingKeywordsEnhanced = (hasPhishKw || isImpersonation) ? 1 : 0;

  // 37: combined_suspicious_score
  let suspScore = 0;
  if (suspTLD) suspScore += 3;
  if (isImpersonation) suspScore += 4;
  if (minDist <= 2 && minDist > 0) suspScore += 3;
  if (hasPhishKw) suspScore += 2;
  if (brandCount > 0) suspScore += brandCount;
  const combinedSuspiciousScore = Math.min(suspScore, 15);

  // Return tất cả 38 features
  return [
    ...features30,
    brandInDomain,
    isOfficialDomain,
    isBrandImpersonation,
    minLevenshtein,
    isTyposquatting,
    brandMismatchScore,
    hasPhishingKeywordsEnhanced,
    combinedSuspiciousScore,
  ];
}
