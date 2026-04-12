# BÁO CÁO KIỂM THỬ EXTENSION PHISHING DETECTOR

**Đồ Án Cơ Sở - Phát hiện URL lừa đảo bằng XGBoost ML**

**Ngày kiểm thử:** 08/04/2026

**Người thực hiện kiểm thử:** [Tên của bạn]

---

## MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Phương pháp kiểm thử](#2-phương-pháp-kiểm-thử)
3. [Kết quả kiểm thử tổng quát](#3-kết-quả-kiểm-thử-tổng-quát)
4. [Vấn đề phát hiện: False Negatives nghiêm trọng](#4-vấn-đề-phát-hiện-false-negatives-nghiêm-trọng)
5. [Vấn đề phát hiện: Site chính chủ bị đánh dấu sai](#5-vấn-đề-phát-hiện-site-chính-chủ-bị-đánh-dấu-sai)
6. [Phân tích nguyên nhân](#6-phân-tích-nguyên-nhân)
7. [Đề xuất cải tiến](#7-đề-xuất-cải-tiến)
8. [Phụ lục - Chi tiết kết quả test](#8-phụ-lục---chi-tiết-kết-quả-test)

---

## 1. TỔNG QUAN

### 1.1 Mục đích báo cáo

Báo cáo này ghi nhận kết quả kiểm thử extension **Phishing URL Detector** sử dụng mô hình XGBoost để phát hiện URL lừa đảo. Mục tiêu là đánh giá độ chính xác thực tế của extension khi đối mặt với các trang web giả mạo thương hiệu (brand impersonation).

### 1.2 Phạm vi kiểm thử

- **19 URL phishing mẫu** (đã biết, có thương hiệu lớn)
- **25 URL an toàn** (các trang uy tín đã biết)
- **24 URL giả mạo Fitgirl Repack** (mirror sites, fake sites chứa virus)
- **1 URL chính chủ Fitgirl Repack**: `https://fitgirl-repacks.site/`

### 1.3 Công cụ kiểm thử

- Script Python sử dụng model XGBoost từ file `xgboost_model_tuned.json`
- Tái tạo chính xác logic predict từ `xgboost_predictor.js`
- Các file test: `test_fitgirl_correct.py`, `single_test_run.py`

---

## 2. PHƯƠNG PHÁP KIỂM THỬ

### 2.1 Cơ chế detect hiện tại của extension

Extension sử dụng **2 lớp phát hiện**:

**Lớp 1 - URL-based ML (XGBoost):**
- Trích xuất 30 đặc trưng từ URL
- Dự đoán xác suất phishing [0%, 100%]
- Threshold: ≥ 50% → phishing

**Lớp 2 - Content Analysis (DOM):**
- Kiểm tra form mật khẩu
- Kiểm tra external form action
- Kiểm tra brand impersonation (với brand lớn)
- Kiểm tra iframe ẩn
- Kiểm tra yêu cầu thẻ tín dụng

**Quyết định cuối cùng:**
```
final_prob = max(ml_prob, content_score)

Cảnh báo nếu:
  - final_prob >= 80%  HOẶC
  - (ml_prob >= 50% VÀ content_score >= 20%)
```

### 2.2 Cơ chế rule-based bổ sung

Trong `xgboost_predictor.js`, các URL có **Suspicious TLD** được auto-flag:

**Suspicious TLDs:**
`.xyz`, `.tk`, `.pw`, `.cc`, `.top`, `.club`, `.online`, `.site`, `.icu`, `.gq`, `.ml`, `.cf`, `.ga`, `.vip`, `.pro`, `.website`, `.games`

**Rule:**
- Suspicious TLD + phishing keywords → **97%** probability
- Suspicious TLD không có keywords → **75-82%** probability

---

## 3. KẾT QUẢ KIỂM THỬ TỔNG QUÁT

### 3.1 Test với URL phishing mẫu và URL an toàn

| Nhóm URL | Số lượng | Phát hiện đúng | Tỷ lệ |
|----------|----------|----------------|-------|
| Phishing URLs (brand lớn) | 19 | 19 | **100%** ✅ |
| Safe URLs (Google, Facebook...) | 25 | 25 | **100%** ✅ |

**Nhận xét:** Extension hoạt động tốt với các URL phishing có thương hiệu lớn (PayPal, Google, Amazon, Vietcombank...) vì các URL này:
- Dùng suspicious TLD (`.xyz`, `.tk`, `.cf`...)
- Có phishing keywords (login, verify, secure, account...)

### 3.2 Test với Fitgirl Repack (vấn đề phát hiện)

| URL | Kết quả mong đợi | Kết quả thực tế | Đúng/Sai |
|-----|------------------|-----------------|----------|
| `fitgirl-repacks.site` (chính chủ) | SAFE | **PHISHING 75%** | ❌ SAI |
| 12 fake sites (.com, .org, .net) | PHISHING | **SAFE 5-8%** | ❌ SAI |
| 12 fake sites (.xyz, .tk, .cc...) | PHISHING | PHISHING 75% | ✅ ĐÚNG |

---

## 4. VẤN ĐỀ PHÁT HIỆN: FALSE NEGATIVES NGHIÊM TRỌNG

### 4.1 Mô tả vấn đề

**12 trang web giả mạo Fitgirl Repack KHÔNG bị phát hiện**, mặc dù đây là các trang fake chứa virus. Người dùng sẽ không được cảnh báo khi truy cập các trang này.

### 4.2 Chi tiết 12 trang fake bị bỏ sót

| STT | URL Fake | Score | Lý do bị bỏ sót |
|-----|----------|-------|-----------------|
| 1 | `https://fitgirl-repack.com` | **7.0%** | Dùng .com - TLD phổ thông |
| 2 | `https://fitgirlrepacks.org` | **6.0%** | Dùng .org - TLD phổ thông |
| 3 | `https://fitgirlrepacks.co` | **5.1%** | Dùng .co - gần .com |
| 4 | `https://fitgirlrepacksite.com` | **7.5%** | Dùng .com, thêm từ "site" |
| 5 | `https://fitgirlrepacks.in` | **5.1%** | Dùng .in - TLD phổ thông |
| 6 | `https://fitgirl-repacks.to` | **5.7%** | Dùng .to - TLD phổ thông |
| 7 | `https://fitgirl-repack.net` | **5.7%** | Dùng .net - TLD phổ thông |
| 8 | `https://fitgirl-repack.org` | **5.7%** | Dùng .org - TLD phổ thông |
| 9 | `https://fitgirltorrent.com` | **6.0%** | Dùng .com, thêm "torrent" |
| 10 | `https://fitgirlrepackz.com` | **7.7%** | Dùng .com, thay 's' bằng 'z' |
| 11 | `https://fitgirl-repacks.us` | **5.7%** | Dùng .us - TLD phổ thông |
| 12 | `https://fitgirl-repacks.in` | **5.7%** | Dùng .in - TLD phổ thông |

### 4.3 Mức độ nghiêm trọng

**🔴 CAO** - Các trang này:
- Giả mạo thương hiệu Fitgirl Repack nổi tiếng
- Thường chứa malware, virus, adware
- Dùng TLD phổ thông (.com, .org, .net) nên **trông rất uy tín**
- Người dùng dễ nhầm lẫn khi search Google
- Extension KHÔNG cảnh báo → người dùng tin tưởng vào trang fake

### 4.4 Tại sao bị bỏ sót

Cơ chế hiện tại chỉ dựa vào **Suspicious TLD detection**:
- Nếu URL có TLD đáng ngờ (`.xyz`, `.tk`, `.cc`...) → auto flag là phishing
- Nếu URL có TLD phổ thông (`.com`, `.org`, `.net`) → KHÔNG kiểm tra gì thêm

→ Các trang fake dùng TLD phổ thông **hoàn toàn thoát khỏi bộ lọc**.

---

## 5. VẤN ĐỀ PHÁT HIỆN: SITE CHÍNH CHỦ BỊ ĐÁNH DẤU SAI

### 5.1 Mô tả vấn đề

Trang chính chủ **`https://fitgirl-repacks.site/`** bị extension đánh dấu là **PHISHING 75%** chỉ vì dùng TLD `.site` (nằm trong danh sách suspicious TLDs).

### 5.2 Tác động

- **False Positive**: Trang hợp pháp bị đánh dấu sai
- Người dùng nhận được cảnh báo không chính xác
- Giảm độ tin cậy của extension
- Có thể phải update whitelist thường xuyên khi các trang uy tín đổi domain

---

## 6. PHÂN TÍCH NGUYÊN NHÂN

### 6.1 Nguyên nhân gốc rễ

Extension thiếu cơ chế **Brand Impersonation Detection** - khả năng phát hiện khi ai đó giả mạo thương hiệu bằng cách:

1. Dùng tên thương hiệu trong domain (nhưng không phải domain chính thức)
2. Biến tấu tên domain (thêm/bớt ký tự, thay thế chữ)
3. Dùng TLD phổ thông để trông uy tín hơn

### 6.2 So sánh cơ chế hiện tại vs cơ chế cần có

| Yếu tố | Hiện tại | Cần có |
|--------|----------|--------|
| **Phát hiện qua TLD** | ✅ Có (chỉ suspicious TLD) | ✅ Giữ nguyên |
| **Phát hiện qua keywords** | ✅ Có (phishing keywords) | ✅ Giữ nguyên |
| **Phát hiện brand impersonation** | ❌ KHÔNG | ✅ CẦN THÊM |
| **Whitelist domain chính chủ** | ❌ KHÔNG | ✅ CẦN THÊM |
| **Typosquatting detection** | ❌ KHÔNG | ✅ CẦN THÊM |

### 6.3 Ví dụ cụ thể

**Fitgirl Repack:**
- Domain chính chủ: `fitgirl-repacks.site`
- Fake sites: `fitgirl-repack.com`, `fitgirlrepacks.org`, `fitgirltorrent.com`...

**Cơ chế hiện tại:**
- Không có trong whitelist → không được ưu tiên
- `.site` là suspicious TLD → bị flag là phishing (false positive)
- Các fake sites dùng `.com`, `.org` → không suspicious TLD → không bị flag (false negative)

**Cơ chế cần có:**
- Biết `fitgirl-repacks.site` là domain chính chủ → whitelist
- Phát hiện bất kỳ domain nào chứa "fitgirl" nhưng KHÔNG phải domain chính chủ → flag là brand impersonation

---

## 7. ĐỀ XUẤT CẢI TIẾN

### 7.1 Cải tiến 1: Whitelist domain chính chủ

**File cần sửa:** `xgboost_predictor.js`

**Nội dung:** Thêm domain chính chủ của các thương hiệu vào whitelist, không chỉ các brand lớn.

```javascript
const BRAND_OFFICIAL_DOMAINS = new Set([
  // Các brand lớn (đã có)
  'google.com', 'facebook.com', 'amazon.com', ...
  
  // Thêm domain chính chủ của các thương hiệu khác
  'fitgirl-repacks.site',
  // Các brand khác nếu có trong dataset
]);
```

### 7.2 Cải tiến 2: Brand Impersonation Detection

**File cần sửa:** `xgboost_predictor.js` + `content_analyzer.js`

**Nội dung:** Thêm cơ chế phát hiện brand impersonation.

```javascript
// Danh sách thương hiệu dễ bị giả mạo
const BRANDS_TO_PROTECT = {
  'fitgirl': {
    officialDomains: ['fitgirl-repacks.site'],
    keywords: ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
  },
  // Thêm brand khác ở đây
};

function checkBrandImpersonation(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  
  for (const [brandName, brandInfo] of Object.entries(BRANDS_TO_PROTECT)) {
    // Kiểm tra URL có chứa brand keyword không
    const brandInUrl = brandInfo.keywords.some(kw => hostname.includes(kw));
    
    if (!brandInUrl) continue;
    
    // Kiểm tra có phải domain chính chủ không
    const isOfficial = brandInfo.officialDomains.some(
      od => hostname === od || hostname === 'www.' + od
    );
    
    // Nếu có brand keyword nhưng KHÔNG phải official domain
    // → Brand impersonation → Flag là phishing
    if (!isOfficial) {
      return {
        isImpersonation: true,
        probability: 0.85,  // Score cao
        reason: `Brand impersonation: "${brandName}"`
      };
    }
  }
  
  return { isImpersonation: false, probability: 0, reason: '' };
}
```

### 7.3 Cải tiến 3: Typosquatting Detection

**Nội dung:** Phát hiện các biến thể của domain (thêm/bớt ký tự, thay thế chữ).

```javascript
function isTyposquatting(hostname, officialDomain) {
  const officialBase = officialDomain.split('.')[0];
  const hostBase = hostname.split('.')[0];
  
  // Nếu bắt đầu bằng tên chính chủ nhưng có thêm ký tự
  if (hostBase.startsWith(officialBase) && hostBase !== officialBase) {
    return true;
  }
  
  // Tính Levenshtein distance
  const distance = levenshteinDistance(hostBase, officialBase);
  if (distance <= 2 && hostBase.length > 5) {
    return true;  // Gần giống tên chính chủ
  }
  
  return false;
}
```

### 7.4 Cải tiến 4: Content Analysis cho brand impersonation

**File cần sửa:** `content_analyzer.js`

**Nội dung:** Thêm kiểm tra brand impersonation vào phân tích DOM.

```javascript
function hasBrandImpersonation() {
  // Kiểm tra nếu trang có form mật khẩu HOẶC yêu cầu thông tin cá nhân
  const hasForm = hasPasswordForm() || document.querySelectorAll('form').length > 0;
  
  if (!hasForm) return false;
  
  const hostname = location.hostname.toLowerCase();
  
  for (const [brandName, brandInfo] of Object.entries(BRANDS_TO_PROTECT)) {
    const brandInHostname = brandInfo.keywords.some(kw => hostname.includes(kw));
    const isOfficial = brandInfo.officialDomains.some(
      od => hostname === od || hostname === 'www.' + od
    );
    
    if (brandInHostname && !isOfficial) {
      return true;
    }
  }
  
  return false;
}
```

### 7.5 Cấu trúc đề xuất cho dữ liệu brand

Tạo file riêng `brands_config.json` để dễ cập nhật:

```json
{
  "fitgirl": {
    "official_domains": ["fitgirl-repacks.site"],
    "keywords": ["fitgirl", "fitgirl-repack", "fitgirlrepack"],
    "description": "Trang download game repack nổi tiếng"
  }
}
```

### 7.6 Thứ tự ưu tiên implement

| Ưu tiên | Cải tiến | Mức độ quan trọng | Độ phức tạp |
|---------|----------|-------------------|-------------|
| **1** | Whitelist domain chính chủ | 🔴 Cao | Thấp |
| **2** | Brand Impersonation Detection | 🔴 Cao | Trung bình |
| **3** | Content Analysis update | 🟡 Trung bình | Thấp |
| **4** | Typosquatting Detection | 🟡 Trung bình | Cao |

---

## 8. PHỤ LỤC - CHI TIẾT KẾT QUẢ TEST

### 8.1 Test với Known Phishing URLs (19 URLs)

**Kết quả: 19/19 phát hiện đúng (100%)**

| URL | Score | Kết quả |
|-----|-------|---------|
| paypal-verify-account.xyz/login | 97% | ✅ PHISHING |
| secure-banking-update.tk/verify | 97% | ✅ PHISHING |
| amazon-account-suspended.cf/login | 97% | ✅ PHISHING |
| microsoft-security-alert.gq/verify | 97% | ✅ PHISHING |
| apple-id-locked.ml/update | 97% | ✅ PHISHING |
| facebook-security-check.tk/login | 97% | ✅ PHISHING |
| netflix-payment-failed.xyz/update | 97% | ✅ PHISHING |
| google-account-recovery.pw/verify | 97% | ✅ PHISHING |
| instagram-copyright-violation.tk/login | 97% | ✅ PHISHING |
| twitter-verify-identity.cf/confirm | 97% | ✅ PHISHING |
| vietcombank-secure.xyz/login | 97% | ✅ PHISHING |
| techcombank-update.tk/verify | 97% | ✅ PHISHING |
| mbbank-security.cf/login | 97% | ✅ PHISHING |
| bidv-account-update.gq/verify | 97% | ✅ PHISHING |
| agribank-security.ml/update | 97% | ✅ PHISHING |
| momo-verify-account.tk/login | 97% | ✅ PHISHING |
| zalopay-security.cf/update | 97% | ✅ PHISHING |
| visa-secure-payment.xyz/verify | 97% | ✅ PHISHING |
| mastercard-alert.tk/confirm | 97% | ✅ PHISHING |

### 8.2 Test với Known Safe URLs (25 URLs)

**Kết quả: 25/25 đánh đúng là SAFE (100%)**

| URL | Score | Kết quả |
|-----|-------|---------|
| google.com | 2.97% | ✅ SAFE |
| facebook.com | 2.97% | ✅ SAFE |
| amazon.com | 2.97% | ✅ SAFE |
| microsoft.com | 2.98% | ✅ SAFE |
| paypal.com | 2.97% | ✅ SAFE |
| vietcombank.com.vn | 14.22% | ✅ SAFE |
| techcombank.com.vn | 14.21% | ✅ SAFE |
| fitgirl-repacks.se | 5.72% | ✅ SAFE (lúc đó tưởng là official) |

### 8.3 Test với Fitgirl Repack Fake Sites (24 URLs)

**Kết quả: 12/24 phát hiện đúng (50%) - 12 trang bị bỏ sót**

#### 12 trang PHISHING bị bỏ sót (FALSE NEGATIVES):

| URL | Score | TLD | Lý do bị bỏ sót |
|-----|-------|-----|-----------------|
| fitgirl-repack.com | 7.0% | .com | TLD phổ thông |
| fitgirlrepacks.org | 6.0% | .org | TLD phổ thông |
| fitgirlrepacks.co | 5.1% | .co | Gần .com |
| fitgirlrepacksite.com | 7.5% | .com | TLD phổ thông |
| fitgirlrepacks.in | 5.1% | .in | TLD phổ thông |
| fitgirl-repacks.to | 5.7% | .to | TLD phổ thông |
| fitgirl-repack.net | 5.7% | .net | TLD phổ thông |
| fitgirl-repack.org | 5.7% | .org | TLD phổ thông |
| fitgirltorrent.com | 6.0% | .com | TLD phổ thông |
| fitgirlrepackz.com | 7.7% | .com | TLD phổ thông |
| fitgirl-repacks.us | 5.7% | .us | TLD phổ thông |
| fitgirl-repacks.in | 5.7% | .in | TLD phổ thông |

#### 12 trang PHISHING phát hiện đúng:

| URL | Score | TLD | Lý do phát hiện |
|-----|-------|-----|-----------------|
| fitgirl-repack.site | 75% | .site | Suspicious TLD |
| fitgirl-repacks.website | 75% | .website | Suspicious TLD |
| fitgirlrepack.games | 75% | .games | Suspicious TLD |
| fitgirl.cc | 75% | .cc | Suspicious TLD |
| fitgirl-repacks.cc | 75% | .cc | Suspicious TLD |
| ww9.fitgirl-repacks.xyz | 75% | .xyz | Suspicious TLD |
| fitgirl-repacks.xyz | 75% | .xyz | Suspicious TLD |
| fitgirlpack.site | 75% | .site | Suspicious TLD |
| fitgirlrepacks.pro | 75% | .pro | Suspicious TLD |
| fitgirl-repacks.vip | 75% | .vip | Suspicious TLD |
| fitgirl-repacks.theproxy.vip | 75% | .vip | Suspicious TLD |
| fitgirlrepack.games | 75% | .games | Suspicious TLD |

#### Trang chính chủ bị đánh dấu sai (FALSE POSITIVE):

| URL | Score | Kết quả mong đợi | Kết quả thực tế |
|-----|-------|------------------|-----------------|
| fitgirl-repacks.site/ | 75% | SAFE | ❌ PHISHING |

### 8.4 Công thức tính accuracy

```
Accuracy = (True Positives + True Negatives) / Total × 100

Với Fitgirl test:
- True Positives (phishing phát hiện đúng): 12
- True Negatives (safe đánh đúng): 0
- False Positives (safe đánh là phishing): 1 (site chính chủ)
- False Negatives (phishing bỏ sót): 12

Accuracy = (12 + 0) / 25 × 100 = 48%
```

---

## KẾT LUẬN

Extension hoạt động tốt với phishing URLs có thương hiệu lớn dùng suspicious TLDs, nhưng **thất bại trong việc phát hiện brand impersonation** khi attacker dùng TLD phổ thông (.com, .org, .net).

**Vấn đề cấp bách nhất:**
1. 12 trang fake Fitgirl chứa virus không bị phát hiện
2. Trang chính chủ bị đánh dấu sai là phishing

**Khuyến nghị:** Implement Brand Impersonation Detection theo mục 7.2 để giải quyết cả 2 vấn đề trên.

---

**Tệp đính kèm:**
- `test_fitgirl_correct.py` - Script kiểm thử
- `single_test_run.py` - Script test tổng quát
- `test_results_single.json` - Kết quả test chi tiết dạng JSON

---

*Báo cáo được tạo ngày 08/04/2026*
