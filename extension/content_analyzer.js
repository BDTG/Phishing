// ============================================================
// content_analyzer.js — Phân tích nội dung trang (DOM)
// ============================================================
// File này chạy trên mỗi trang web để phân tích HTML/DOM
// Phát hiện các dấu hiệu phishing từ nội dung trang:
//   - Form mật khẩu
//   - Form gửi dữ liệu sang domain khác
//   - Brand mismatch (trang giả danh thương hiệu)
//   - iframe ẩn
//   - Yêu cầu thông tin thẻ tín dụng
// ============================================================

// Danh sách thương hiệu cần bảo vệ
// Phải khớp với BRAND_NAMES trong xgboost_predictor.js
const BRAND_NAMES = [
  'paypal', 'google', 'amazon', 'apple', 'microsoft', 'facebook', 'netflix',
  'instagram', 'twitter', 'linkedin', 'youtube',
  'vietcombank', 'techcombank', 'mbbank', 'bidv', 'agribank',
  'momo', 'zalopay', 'visa', 'mastercard',
  'fitgirl', 'fitgirl-repack', 'fitgirlrepack',
];

// Official domains của các brand
// Dùng để kiểm tra brand mismatch
const BRAND_OFFICIAL_DOMAINS = {
  'fitgirl': ['fitgirl-repacks.site'],
  'paypal': ['paypal.com'],
  'google': ['google.com', 'google.com.vn'],
  'apple': ['apple.com'],
  'microsoft': ['microsoft.com'],
  'facebook': ['facebook.com'],
  'amazon': ['amazon.com'],
};

/**
 * Kiểm tra trang có form mật khẩu không
 * → Trang hợp lệ thường không yêu cầu login ngay khi vào
 * → Phishing sites thường có form mật khẩu để đánh cắp thông tin
 * @returns {boolean} True nếu có input[type="password"]
 */
function hasPasswordForm() {
  // Query tất cả input có type="password"
  const inputs = document.querySelectorAll('input[type="password"]');
  // Nếu có ít nhất 1 → trả về true
  return inputs.length > 0;
}

/**
 * Kiểm tra form action trỏ sang domain khác
 * → Kỹ thuật phishing phổ biến: form submit dữ liệu sang server khác
 * → Ví dụ: Trang giả mạo PayPal nhưng form action trỏ đến server của attacker
 * @returns {boolean} True nếu có form action khác domain hiện tại
 */
function hasExternalFormAction() {
  // Query tất cả form có attribute action
  const forms = document.querySelectorAll('form[action]');
  // Lấy hostname hiện tại (bỏ www.)
  const currentHost = location.hostname.replace(/^www\./, '');

  // Duyệt qua từng form
  for (const form of forms) {
    try {
      // Parse action URL (có thể là relative hoặc absolute)
      const actionHost = new URL(form.action, location.href).hostname.replace(/^www\./, '');
      // Nếu action host khác current host → external form
      if (actionHost && actionHost !== currentHost) return true;
    } catch (e) {
      // Bỏ qua nếu không parse được URL
    }
  }
  return false;
}

/**
 * Kiểm tra brand mismatch
 * → Trang giả danh thương hiệu nhưng domain không phải của thương hiệu đó
 * → VD: Trang nói là "PayPal" nhưng domain là "paypal-secure-login.xyz"
 * → Chỉ kiểm tra tiêu đề trang và heading h1/h2
 * → Không quét toàn bộ body để tránh false positive
 * @returns {boolean} True nếu phát hiện brand mismatch
 */
function hasBrandMismatch() {
  // Chỉ có nghĩa khi trang đang thu thập mật khẩu
  // Trang thông tin đề cập đến thương hiệu (tin tức, hướng dẫn) không phải phishing
  if (document.querySelectorAll('input[type="password"]').length === 0) return false;

  // Lấy hostname hiện tại
  const hostname = location.hostname.toLowerCase().replace(/^www\./, '');

  // Chỉ lấy title + h1 + h2 (nơi trang giả mạo thường đặt tên thương hiệu)
  const headings = Array.from(document.querySelectorAll('h1, h2'))
    .map(h => h.innerText || h.textContent || '')
    .join(' ');
  const prominentText = (document.title + ' ' + headings).toLowerCase();

  // Kiểm tra từng brand
  for (const brand of BRAND_NAMES) {
    const brandInProminent = prominentText.includes(brand);
    const brandInDomain = hostname.includes(brand);

    // Thương hiệu trong heading + form mật khẩu + domain không phải của brand
    // → Kết hợp 3 tín hiệu → rất chắc là phishing
    if (brandInProminent && !brandInDomain) return true;
  }
  return false;
}

/**
 * Kiểm tra brand impersonation trực tiếp từ hostname
 * → Phát hiện khi domain chứa tên thương hiệu nhưng KHÔNG phải domain chính thức
 * → KHÔNG cần form mật khẩu — chỉ cần hostname là đủ
 * @returns {boolean} True nếu phát hiện brand impersonation
 */
function hasBrandImpersonation() {
  const hostname = location.hostname.toLowerCase().replace(/^www\./, '');

  // Duyệt qua từng brand trong config
  for (const [brandName, officialDomains] of Object.entries(BRAND_OFFICIAL_DOMAINS)) {
    // Kiểm tra hostname có chứa brand keyword không
    const brandKeywords = [brandName, brandName.replace(/-/g, ''), brandName.replace(/\s/g, '-')];
    const brandInHostname = brandKeywords.some(kw => hostname.includes(kw.toLowerCase()));

    if (!brandInHostname) continue;

    // Kiểm tra có phải domain chính chủ không
    const isOfficial = officialDomains.some(od =>
      hostname === od.toLowerCase() || hostname.endsWith('.' + od.toLowerCase())
    );

    // Có brand keyword nhưng KHÔNG phải official domain → Brand impersonation
    if (!isOfficial) return true;
  }

  return false;
}

/**
 * Kiểm tra có iframe ẩn không
 * → Kỹ thuật clickjacking / form injection
 * → iframe ẩn có thể load nội dung độc hại mà user không thấy
 * → BỎ QUA iframe từ các domain tin cậy (Google, YouTube, Facebook...)
 * @returns {boolean} True nếu phát hiện iframe ẩn đáng ngờ
 */
function hasHiddenIframe() {
  // Danh sách domain tin cậy — iframe của họ không phải phishing
  const trustedIframeDomains = [
    'google.com', 'google.com.vn', 'youtube.com', 'ytimg.com', 'gstatic.com', 'ggpht.com',
    'facebook.com', 'fbcdn.net',
    'twitter.com', 'twimg.com', 'x.com',
    'instagram.com',
    'linkedin.com',
    'amazon.com', 'aws.amazon.com', 'media-amazon.com',
    'microsoft.com', 'azure.com', 'msn.com', 'bing.com',
    'apple.com', 'icloud.com',
    'github.com', 'githubusercontent.com',
    'stackoverflow.com', 'cdn.sstatic.net',
    'reddit.com', 'redd.it',
    'tiktok.com',
    'netflix.com', 'nflxext.com',
    'wikipedia.org', 'wikimedia.org', 'wiktionary.org',
    'goo.gl', 't.co', 'bit.ly',
    'anthropic.com', 'claude.ai', 'claudeusercontent.com',
    'openai.com', 'chatgpt.com', 'oaistatic.com',
    'hutech.edu.vn',
    'spotify.com', 'scdn.co',
    'twitch.tv', 'jtvnw.net',
    'discord.com', 'discordapp.com',
    'pinterest.com', 'pinimg.com',
    'medium.com', 'miro.medium.com',
    'cloudflare.com', 'cloudflarestream.com',
    'vimeo.com', 'player.vimeo.com',
    'dailymotion.com',
    'yahoo.com', 'yimg.com',
    'snapchat.com',
    'whatsapp.com',
    'telegram.org',
    'zoom.us', 'zoomgov.com',
    'slack.com',
    'dropbox.com',
    'notion.so', 'notion.new',
    'figma.com',
    'canva.com',
    'paypal.com', 'paypalobjects.com',
    'stripe.com', 'js.stripe.com',
    'shopee.vn', 'lazada.vn', 'tiki.vn',
    // Wiki/Fandom — có nhiều iframe ads hợp lệ
    'fandom.com', 'wikia.com', 'nocookie.net',
    // Ad networks lớn — iframe của họ là quảng cáo thông thường
    'doubleclick.net', 'googlesyndication.com', 'googletagmanager.com',
    'google-analytics.com', 'googleadservices.com',
    'amazon-adsystem.com', 'criteo.com', 'taboola.com', 'outbrain.com',
    // CAPTCHA — iframe ẩn là cách hoạt động bình thường
    'recaptcha.net', 'hcaptcha.com',
  ];

  // Query tất cả iframe trên trang
  const iframes = document.querySelectorAll('iframe');

  // Duyệt qua từng iframe
  for (const f of iframes) {
    // Lấy computed style của iframe
    const style = window.getComputedStyle(f);

    // Kiểm tra các dấu hiệu ẩn
    const isHidden = style.display === 'none' ||
                     style.visibility === 'hidden' ||
                     style.opacity === '0' ||
                     f.width === '0' ||
                     f.height === '0';

    // Nếu không ẩn → bỏ qua
    if (!isHidden) continue;

    // Kiểm tra src của iframe
    const src = f.src || f.getAttribute('src') || '';
    if (src) {
      try {
        // Parse domain của iframe src
        const iframeDomain = new URL(src).hostname.toLowerCase().replace(/^www\./, '');

        // Nếu domain nằm trong trusted list → bỏ qua
        if (trustedIframeDomains.some(d => iframeDomain === d || iframeDomain.endsWith('.' + d))) {
          continue;
        }
      } catch (e) {
        // Không parse được URL → tiếp tục kiểm tra
      }
    }

    // Nếu không có src hoặc src không tin cậy → xem như đáng ngờ
    return true;
  }

  return false;
}

/**
 * Kiểm tra trang yêu cầu thông tin thẻ tín dụng
 * → Yêu cầu CÓ form trên trang
 * → Tránh false positive với trang thông tin chỉ nhắc đến thẻ/thanh toán
 * @returns {boolean} True nếu phát hiện yêu cầu thẻ tín dụng
 */
function hasCreditCardRequest() {
  // Phải có form chứa input nhập liệu (text/password/number/tel) thì mới có rủi ro thu thập thẻ
  const forms = document.querySelectorAll('form');
  if (forms.length === 0) return false;
  
  let hasTextInput = false;
  for (const form of forms) {
    if (form.querySelector('input[type="text"], input[type="password"], input[type="number"], input[type="tel"]')) {
      hasTextInput = true;
      break;
    }
  }
  if (!hasTextInput) return false;

  // Lấy text content của body
  const text = document.body ? document.body.innerText.toLowerCase() : '';

  // Danh sách keywords liên quan đến thẻ tín dụng
  const keywords = [
    'credit card', 'card number', 'cvv', 'expiry', 'expire', 'billing',
    'số thẻ', 'mã cvv', 'ngày hết hạn', 'thông tin thanh toán',
  ];

  // Kiểm tra có keyword nào trong text không
  return keywords.some(kw => text.includes(kw));
}

/**
 * Phân tích nội dung văn bản (Content-based Analysis) - Nâng cấp Regex & Co-occurrence
 * Quét toàn bộ text hiển thị trên trang để tìm các thủ đoạn thao túng tâm lý (Social Engineering)
 * @returns {boolean} True nếu văn bản chứa cấu trúc ngữ nghĩa đe dọa/yêu cầu
 */
function hasSuspiciousTextContent() {
  const text = document.body ? document.body.innerText.toLowerCase() : '';
  
  if (text.length < 50) return false; // Bỏ qua trang quá ngắn

  // Hacker có thể thay đổi cách hành văn (Ví dụ: "Tài khoản bị khóa", "Khóa tài khoản tạm thời")
  // Nhưng chúng BẮT BUỘC phải dùng kết hợp 2 nhóm từ: Danh từ (Tài sản) + Động từ (Đe dọa/Yêu cầu)
  
  // Nhóm 1: Các danh từ mục tiêu (Subjects) - Dùng \b để bắt đúng từ, không bắt chữ lồng nhau
  const regexSubjects = /\b(tài khoản|account|mật khẩu|password|ví|wallet|thẻ tín dụng|credit card|ngân hàng|bank|thông tin|information)\b/g;
  
  // Nhóm 2: Các động từ đe dọa, hối thúc (Threats/Urgency)
  const regexThreats = /\b(khóa|locked|suspended|xác minh|verify|cập nhật|update|đăng nhập|login|sign in|hết hạn|expired|bất thường|unusual|ngay lập tức|immediately)\b/g;

  // Tìm tất cả các từ khóa xuất hiện trong văn bản
  const subjectMatches = text.match(regexSubjects) || [];
  const threatMatches = text.match(regexThreats) || [];

  // Lọc trùng lặp (Set) để tránh trường hợp 1 từ "login" lặp lại 10 lần làm sai lệch kết quả
  const uniqueSubjects = new Set(subjectMatches).size;
  const uniqueThreats = new Set(threatMatches).size;

  // LOGIC ĐÁNH GIÁ (Co-occurrence): 
  // Bài viết phải nhắc đến TÀI SẢN (>=1 từ) VÀ có hàm ý HỐI THÚC/ĐE DỌA (>=2 từ khác nhau)
  // Hoặc nhắc đến nhiều TÀI SẢN (>=2) và HỐI THÚC (>=1)
  if ((uniqueSubjects >= 1 && uniqueThreats >= 2) || (uniqueSubjects >= 2 && uniqueThreats >= 1)) {
     return true;
  }

  return false;
}

/**
 * Tổng hợp tất cả tín hiệu từ DOM
 * → Trả về điểm bổ sung [0, 1] và danh sách cảnh báo cụ thể
 * @returns {{score: number, warnings: string[]}}
 */
function analyzeContent() {
  const warnings = [];
  let score = 0;

  const currentHost = location.hostname.toLowerCase().replace(/^www\./, '');
  const isOfficialAnyBrand = Object.values(BRAND_OFFICIAL_DOMAINS).some(list =>
    list.some(od => currentHost === od.toLowerCase() || currentHost.endsWith('.' + od.toLowerCase()))
  );

  if (isOfficialAnyBrand) {
    return { score: 0, warnings: [] };
  }

  try {
    // Kiểm tra form mật khẩu
    if (hasPasswordForm()) {
      warnings.push('Có form mật khẩu');
      score += 0.2;
    }

    // Kiểm tra form action external
    if (hasExternalFormAction()) {
      warnings.push('Form gửi dữ liệu sang domain khác');
      score += 0.5;   // Tín hiệu rất mạnh
    }

    // Kiểm tra brand mismatch
    if (hasBrandMismatch()) {
      warnings.push('Giả mạo thương hiệu');
      score += 0.4;
    }

    // Kiểm tra iframe ẩn
    if (hasHiddenIframe()) {
      warnings.push('Có iframe ẩn');
      score += 0.3;
    }

    // Kiểm tra credit card request
    if (hasCreditCardRequest()) {
      warnings.push('Yêu cầu thông tin thẻ tín dụng');
      score += 0.3;
    }
    
    // Kiểm tra văn bản lừa đảo (Content-based)
    if (hasSuspiciousTextContent()) {
      warnings.push('Nội dung trang chứa văn bản thao túng tâm lý (Lừa đảo)');
      score += 0.4;
    }

    // Brand impersonation detection — tín hiệu mạnh, không cần form
    if (hasBrandImpersonation()) {
      warnings.push('Domain giả mạo thương hiệu');
      score += 0.6;   // Score cao vì đây là tín hiệu rất mạnh
    }
  } catch (e) {
    // DOM chưa sẵn sàng → bỏ qua
    console.debug('[ContentAnalyzer] Error:', e);
  }

  // Return kết quả (cap ở 1.0)
  return {
    score: Math.min(score, 1.0),
    warnings,
  };
}
