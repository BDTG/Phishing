// ============================================================
// brands_config.js
// Cấu hình danh sách thương hiệu cần bảo vệ
// File này được dùng bởi cả xgboost_predictor.js và content_analyzer.js
// ============================================================

/**
 * Danh sách thương hiệu dễ bị giả mạo
 * Mỗi brand có:
 *   - officialDomains: Domain chính thức của brand
 *   - keywords: Từ khóa để nhận diện brand trong hostname
 *
 * Để thêm brand mới:
 *   1. Thêm entry vào object này
 *   2. Cập nhật SAFE_DOMAINS trong xgboost_predictor.js
 *   3. Cập nhật BRAND_OFFICIAL_DOMAINS trong content_analyzer.js
 */
// Tên biến PHẢI là SHARED_BRANDS_CONFIG để các module khác nhận diện được
// xgboost_predictor.js dùng: (typeof SHARED_BRANDS_CONFIG !== 'undefined') ? SHARED_BRANDS_CONFIG : {}
// content_analyzer.js dùng: SHARED_BRAND_NAMES, SHARED_BRAND_OFFICIAL_DOMAINS
const SHARED_BRANDS_CONFIG = {
  // PayPal — dịch vụ thanh toán trực tuyến
  paypal: {
    officialDomains: ['paypal.com', 'www.paypal.com'],
    keywords: ['paypal'],
  },

  // Google — công ty công nghệ
  google: {
    officialDomains: ['google.com', 'www.google.com', 'google.com.vn'],
    keywords: ['google'],
  },

  // Microsoft — công ty công nghệ
  microsoft: {
    officialDomains: ['microsoft.com', 'www.microsoft.com'],
    keywords: ['microsoft'],
  },

  // Apple — công ty công nghệ
  apple: {
    officialDomains: ['apple.com', 'www.apple.com'],
    keywords: ['apple'],
  },

  // Facebook — mạng xã hội
  facebook: {
    officialDomains: ['facebook.com', 'www.facebook.com'],
    keywords: ['facebook'],
  },

  // Amazon — thương mại điện tử
  amazon: {
    officialDomains: ['amazon.com', 'www.amazon.com'],
    keywords: ['amazon'],
  },

  // Netflix — dịch vụ streaming
  netflix: {
    officialDomains: ['netflix.com', 'www.netflix.com'],
    keywords: ['netflix'],
  },

  // Instagram — mạng xã hội
  instagram: {
    officialDomains: ['instagram.com', 'www.instagram.com'],
    keywords: ['instagram'],
  },

  // Twitter/X — mạng xã hội
  twitter: {
    officialDomains: ['twitter.com', 'www.twitter.com', 'x.com'],
    keywords: ['twitter'],
  },

  // LinkedIn — mạng xã hội nghề nghiệp
  linkedin: {
    officialDomains: ['linkedin.com', 'www.linkedin.com'],
    keywords: ['linkedin'],
  },

  // YouTube — dịch vụ video
  youtube: {
    officialDomains: ['youtube.com', 'www.youtube.com'],
    keywords: ['youtube'],
  },

  // Fitgirl Repack — trang download game (dễ bị giả mạo nhất)
  fitgirl: {
    officialDomains: ['fitgirl-repacks.site', 'www.fitgirl-repacks.site'],
    keywords: ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
  },

  // Vietcombank — ngân hàng
  vietcombank: {
    officialDomains: ['vietcombank.com.vn', 'www.vietcombank.com.vn'],
    keywords: ['vietcombank'],
  },

  // Techcombank — ngân hàng
  techcombank: {
    officialDomains: ['techcombank.com.vn', 'www.techcombank.com.vn'],
    keywords: ['techcombank'],
  },

  // MBBank — ngân hàng
  mbbank: {
    officialDomains: ['mbbank.com.vn', 'www.mbbank.com.vn'],
    keywords: ['mbbank'],
  },

  // BIDV — ngân hàng
  bidv: {
    officialDomains: ['bidv.com.vn', 'www.bidv.com.vn'],
    keywords: ['bidv'],
  },

  // Agribank — ngân hàng
  agribank: {
    officialDomains: ['agribank.com.vn', 'www.agribank.com.vn'],
    keywords: ['agribank'],
  },

  // MoMo — ví điện tử
  momo: {
    officialDomains: ['momo.vn', 'www.momo.vn'],
    keywords: ['momo'],
  },

  // ZaloPay — ví điện tử
  zalopay: {
    officialDomains: ['zalopay.vn', 'www.zalopay.vn'],
    keywords: ['zalopay'],
  },
};

// Auto-generate SHARED_BRAND_NAMES (flat list) từ config
// Dùng trong content_analyzer.js để check brand trong DOM text
const SHARED_BRAND_NAMES = Object.entries(SHARED_BRANDS_CONFIG)
  .flatMap(([, info]) => info.keywords);

// Auto-generate SHARED_BRAND_OFFICIAL_DOMAINS (map brand → domains)
// Dùng trong content_analyzer.js để kiểm tra brand impersonation
const SHARED_BRAND_OFFICIAL_DOMAINS = Object.fromEntries(
  Object.entries(SHARED_BRANDS_CONFIG).map(([brand, info]) => [brand, info.officialDomains])
);

// Export cho Node.js (dùng khi chạy script bên ngoài extension)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SHARED_BRANDS_CONFIG, SHARED_BRAND_NAMES, SHARED_BRAND_OFFICIAL_DOMAINS };
}
