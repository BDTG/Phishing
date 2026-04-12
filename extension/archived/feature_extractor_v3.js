// feature_extractor_v3.js
// Trích xuất 39 đặc trưng từ FULL URL (có path, query, fragment)
// Khắc phục vấn đề: path features luôn = 0 trong v2
//
// Thứ tự 39 feature:
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
// 36:has_phishing_keywords_enhanced  37:combined_suspicious_score  38:is_bare_domain

function extractFeatures(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch (e) { return new Array(39).fill(0); }

  // DÙNG FULL URL — không strip path
  const full     = urlStr;
  const fullOrig = urlStr.toLowerCase();
  const hostname = u.hostname.replace(/^www\./, '');
  const path     = u.pathname || '';
  const query    = u.search || '';
  const fragment = u.hash || '';

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
  const BRAND_KW    = ['paypal','google','amazon','apple','microsoft','facebook','netflix',
                        'instagram','twitter','linkedin','youtube','chase','wellsfargo',
                        'bankofamerica','citibank','fitgirl','vietcombank','techcombank',
                        'mbbank','bidv','agribank','momo','zalopay'];
  const LOGIN_KW    = ['signin','logon','authenticate','login','log-in','sign-in'];
  const SUSP_TLDS   = new Set(['.xyz','.tk','.pw','.cc','.top','.club','.online',
                                '.site','.icu','.gq','.ml','.cf','.ga']);

  const digits  = (full.match(/\d/g) || []).length;
  const letters = (full.match(/[a-zA-Z]/g) || []).length;
  const pure    = hostname.replace(/:\d+$/, '');
  const parts   = pure.split('.');
  const tld     = parts.length ? '.' + parts[parts.length - 1] : '';
  const suspTLD = SUSP_TLDS.has(tld.toLowerCase());

  return [
    // 0-9: FULL URL (có path)
    full.length,
    (full.match(/\./g) || []).length,
    (full.match(/-/g) || []).length,
    (full.match(/_/g) || []).length,
    (full.match(/\//g) || []).length,
    full.split('').filter(c => !/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]/.test(c)).length,
    full.length > 0 ? digits / full.length : 0,
    full.length > 0 ? letters / full.length : 0,
    (u.port && u.port !== '80' && u.port !== '443') ? 1 : 0,
    entropy(full),

    // 10-17: Domain
    pure.length,
    Math.max(parts.length - 2, 0),
    /^\d{1,3}(\.\d{1,3}){3}$/.test(pure) ? 1 : 0,
    full.includes('@') ? 1 : 0,
    (path.indexOf('//') > 0) ? 1 : 0,
    suspTLD ? 1 : 0,
    pure.includes('-') ? 1 : 0,
    Math.max(parts.length - 2, 0),

    // 18-24: Path/Query — GIÁ TRỊ THỰC (KHÔNG còn = 0)
    path.length,
    query ? (query.match(/&/g) || []).length + 1 : 0,
    fragment ? 1 : 0,
    (path.match(/\//g) || []).length,
    /%[0-9A-Fa-f]{2}/.test(full) ? 1 : 0,
    (path.match(/\d/g) || []).length,
    entropy(path),

    // 25-29: Keywords — kiểm tra trên FULL URL
    PHISHING_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    BRAND_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    u.protocol === 'https:' ? 1 : 0,
    LOGIN_KW.some(kw => fullOrig.includes(kw)) ? 1 : 0,
    suspTLD ? 1 : 0,

    // 30-37: Brand impersonation (giữ nguyên)
    0, 0, 0, 0, 0, 0, 0, 0,

    // 38: is_bare_domain
    (path.length === 0 && query.length === 0 && fragment.length === 0) ? 1 : 0,
  ];
}
