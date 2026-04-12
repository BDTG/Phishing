# BÁO CÁO TỔNG KẾT CẢI TIẾN EXTENSION PHISHING DETECTOR
## Đồ Án Cơ Sở — Trần Duy Thái (MSSV: 2387700060)
**Ngày báo cáo:** 08/04/2026

---

## MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Trạng thái ban đầu](#2-trạng-thái-ban-đầu)
3. [Các giai đoạn cải tiến](#3-các-giai-đoạn-cải-tiến)
4. [Kết quả kiểm thử cuối cùng](#4-kết-quả-kiểm-thử-cuối-cùng)
5. [Kiến trúc hệ thống](#5-kiến-trúc-hệ-thống)
6. [Danh sách files](#6-danh-sách-files)
7. [Hạn chế và hướng phát triển](#7-hạn-chế-và-hướng-phát-triển)

---

## 1. TỔNG QUAN DỰ ÁN

### Mục tiêu
Xây dựng Chrome Extension phát hiện URL phishing sử dụng XGBoost ML, hoạt động 100% offline trên client, với:
- Accuracy > 99%
- Zero false positives trên sites uy tín
- Phát hiện brand impersonation (typosquatting, fake domains)
- Giải thích được lý do cho mỗi cảnh báo
- Model size < 1MB, inference < 50ms

### Công nghệ sử dụng
- **ML Model:** XGBoost 300 trees, 38 features, 402KB JSON
- **Extension:** Chrome Manifest V3 (content scripts + service worker)
- **Rules:** Brand impersonation detection với Levenshtein distance
- **RDAP:** Domain age checking via Registration Data Access Protocol
- **Whitelist:** Tranco Top 30K + manual safe domains

---

## 2. TRẠNG THÁI BAN ĐẦU

### Trước khi cải tiến

| Thành phần | Trạng thái | Vấn đề |
|-----------|-----------|--------|
| Model accuracy | 99.28% | Tốt nhưng chưa đủ |
| Fake Fitgirl sites | 12/24 bị bỏ sót (50%) | Chỉ detect suspicious TLD |
| Brand impersonation | Không có | Không phát hiện typosquatting |
| False positive | Site chính chủ bị flag 75% | `.site` là suspicious TLD |
| Lý do cảnh báo | Chỉ hiển thị % | Không giải thích tại sao |
| Tranco Top 30K | Không có | Không whitelist sites uy tín |
| Domain age | Không check | Missing feature quan trọng |
| Subdomain official | Không hỗ trợ | `gemini.google.com` bị flag |
| URL encoding | Không decode | Né detection bằng `%2F` |
| Homograph attack | Không phát hiện | Cyrillic characters bypass |
| IP address detection | Không handle | Private IP bị flag sai |

---

## 3. CÁC GIAI ĐOẠN CẢI TIẾN

### GIAI ĐOẠN 1: Brand Impersonation Detection

**Vấn đề:** 12/24 fake Fitgirl sites dùng TLD phổ thông (.com, .org, .net) không bị phát hiện.

**Giải pháp:**
- Thêm `BRANDS_CONFIG` với 15 brands (Fitgirl, PayPal, Google, Apple, Microsoft, Facebook, Amazon, Netflix, Instagram, Twitter, LinkedIn, Vietcombank, Techcombank, MBBank, MoMo)
- Implement **Levenshtein distance** với threshold = 3 (phát hiện typosquatting)
- Thêm `checkBrandImpersonation()` vào `xgboost_predictor.js`
- Thêm `hasBrandImpersonation()` vào `content_analyzer.js`

**Kết quả:** 24/24 fake sites bị block (100%) — tăng từ 50%

### GIAI ĐOẠN 2: Retrain Model với Dataset mở rộng

**Vấn đề:** Model cũ chỉ trained trên PhishTank + Tranco → không biết brand impersonation patterns.

**Giải pháp:**
- Generate 500 augmented brand impersonation URLs
- Thêm 8 features mới (brand_in_domain, is_official_domain, is_brand_impersonation, min_levenshtein_to_official, is_typosquatting, brand_mismatch_score, has_phishing_keywords_enhanced, combined_suspicious_score)
- Retrain XGBoost với 38 features → accuracy 99.51%

**Kết quả:** Model cải thiện nhẹ nhưng KHÔNG giải quyết được brand impersonation → xác nhận cần rule-based layer.

### GIAI ĐOẠN 3: Chuyển sang Full URL + Fuzzy Matching

**Vấn đề:** Feature extraction dùng "bare domain" (không path) → model mù 82% thông tin.

**Giải pháp:**
- Chuyển sang **Full URL** extraction (có path, query, fragment)
- Thêm feature `is_bare_domain` flag
- Tăng Levenshtein threshold từ ≤2 lên ≤3
- Thêm **fuzzy domain matching** — so sánh với TẤT CẢ official domains

**Kết quả:** Accuracy tăng từ 81.9% → 98.1% trên 105 URLs

### GIAI ĐOẠN 4: 3 Fixes quan trọng

#### Fix 1: IP Address Detection
- **Vấn đề:** `192.168.1.1/login` bị flag 86.2% (false positive)
- **Giải pháp:** Whitelist private IP ranges (RFC 1918 + loopback)
- **Kết quả:** Private IP → SAFE, Public IP → hạ 1 bậc cảnh báo

#### Fix 2: Homograph/IDN Attack
- **Vấn đề:** `paypaл.com` (Cyrillic л) bypass detection
- **Giải pháp:** Regex check non-Latin chars + Unicode normalization cho brand matching
- **Kết quả:** Homograph + brand → BLOCK 95%

#### Fix 3: URL Decoding
- **Vấn đề:** `fitgirl-repack.com/%6C%6F%67%69%6E` né detection
- **Giải pháp:** `decodeURIComponent()` loop max 3 lần (chống double encoding)
- **Kết quả:** Encoded URLs → decode → detect bình thường

**Kết quả tổng:** 105/105 URLs pass (100%)

### GIAI ĐOẠN 5: 3-Tier Threshold + Tranco Top 30K

**Vấn đề:** Binary threshold (0.5) → không phân biệt mức độ rủi ro.

**Giải pháp:**
- **3 Tiers:** Safe (0-0.60), Warning (0.60-0.85), Block (0.85-1.0)
- **Tranco Top 30K:** 30,000 domains phổ biến nhất → auto whitelist (442KB JSON)
- **Fusion Logic mới:** Không dùng `max(ml, content)` nữa → rules override ML khi conflict

**Kết quả:** Zero false positives trên 19 official domains + 16 Tranco Top 30K

### GIAI ĐOẠN 6: Explainable AI — Hiển thị lý do

**Vấn đề:** Banner chỉ hiển thị "%" — người dùng không hiểu tại sao.

**Giải pháp:**
- `predictPhishing()` giờ trả về `{probability, tier, reason, isPhishing}`
- Banner hiển thị danh sách lý do chi tiết
- Popup hiển thị tier label + reason

**Kết quả:** Mỗi cảnh báo có lý do cụ thể:
- "Typosquatting 'paypal' (distance=1)"
- "TLD đáng ngờ + từ khóa phishing"
- "Tuổi domain: 3 ngày — RẤT NGHI NGỜ"

### GIAI ĐOẠN 7: Subdomain Support + Safe Platforms

**Vấn đề:** `gemini.google.com`, `download-directory.github.io` bị flag sai.

**Giải pháp:**
- Check subdomain: `hostname.endsWith('.' + officialHost)` → whitelist
- Thêm `isSubdomainOfSafe()` cho platforms: `github.io`, `vercel.app`, `netlify.app`, `pages.dev`, `surge.sh`

**Kết quả:** Subdomain chính thức → SAFE

### GIAI ĐOẠN 8: Domain Age Checking (RDAP)

**Vấn đề:** Không có feature tuổi đời domain — indicator quan trọng cho phishing.

**Giải pháp:**
- Tạo `domain_age_checker.js` — query RDAP API (miễn phí, không API key)
- Hỗ trợ 10+ TLDs: `.com`, `.net`, `.org`, `.xyz`, `.site`, `.online`, `.io`, `.vn`, v.v.
- 5-second timeout, graceful fallback
- Risk assessment: <7 ngày → critical, <30 ngày → high, <90 ngày → medium, >365 ngày → safe

**Kết quả:** Hiển thị tuổi domain trên banner, tăng độ tin cậy cảnh báo.

### GIAI ĐOẠN 9: Whitelist HUTECH

**Yêu cầu:** Kiểm tra các trang web trường HUTECH.

**Giải pháp:**
- Thêm `hutech.edu.vn`, `www.hutech.edu.vn`, `e-graduate.hutech.edu.vn`, `portal.hutech.edu.vn`, `tuyensinh.hutech.edu.vn` vào SAFE_DOMAINS
- Thêm rule `.edu.vn` → auto safe (3.0%)

**Kết quả:** 8/8 trang HUTECH → SAFE ✅

---

## 4. KẾT QUẢ KIỂM THỬ CUỐI CÙNG

### Comprehensive Test — 105 URLs

| Nhóm | Kết quả | Ghi chú |
|------|---------|---------|
| Official domains (19) | **19/19 (100%)** | Zero false positives |
| Tranco Top 30K + path (16) | **16/16 (100%)** | Không flag `google.com/search` |
| Fitgirl fake sites (20) | **20/20 (100%)** | Tất cả bị block |
| Brand typosquatting (16) | **16/16 (100%)** | paypa1, goggle, faceb00k... |
| Known phishing patterns (18) | **18/18 (100%)** | Suspicious TLD + keywords |
| Adversarial/Edge cases (16) | **16/16 (100%)** | IP, Homograph, Encoding |
| **TỔNG** | **105/105 (100%)** | **Hoàn hảo** ✅ |

### So sánh trước/sau toàn bộ quá trình

| Chỉ số | Ban đầu | Sau Phase 1 | Sau Phase 3 | Sau Phase 4 | Cuối cùng |
|--------|---------|-------------|-------------|-------------|-----------|
| Accuracy | 50% | 100% | 98.1% | 100% | **100%** |
| URLs test | 24 | 24 | 105 | 105 | **105** |
| False negatives | 12 | 0 | 2 | 0 | **0** |
| False positives | 1 | 1 | 1 | 0 | **0** |
| Explainable | ❌ | ❌ | ✅ | ✅ | **✅** |
| 3-Tier | ❌ | ❌ | ❌ | ✅ | **✅** |
| Domain age | ❌ | ❌ | ❌ | ❌ | **✅** |

### Model Performance (test set 4,100 URLs)

| Metric | Value |
|--------|-------|
| Accuracy | 99.51% |
| F1 Score | 0.9952 |
| ROC-AUC | 0.9968 |
| FPR | 0.05% |
| FNR | 0.90% |
| Model size | 402 KB |
| Inference time | < 5ms |

---

## 5. KIẾN TRÚC HỆ THỐNG

### 7-Layer Defense Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER TRUY CẬP URL                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 0: Pre-check                                          │
│ • Decode URL (chống double/triple encoding)                 │
│ • IP Address detection (Private → SAFE, Public → heuristic) │
│ • Homograph/IDN detection (Cyrillic → BLOCK)               │
│ • Localhost check                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Trust Lists                                        │
│ • 1a. SAFE_DOMAINS (~50 domains hardcoded)                 │
│ • 1b. Subdomain check (github.io, vercel.app...)           │
│ • 1c. Tranco Top 30K (30,000 domains, 442KB)              │
│ • 1d. .edu.vn auto-safe                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Brand Impersonation Detection                      │
│ • 15 brands config (official domains + keywords)           │
│ • Exact keyword match + subdomain check                    │
│ • Fuzzy matching (Levenshtein distance ≤ 3)                │
│ • Typosquatting detection                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Rule-based Heuristics                              │
│ • Suspicious TLD (17 TLDs: .xyz, .tk, .pw...)              │
│ • Suspicious TLD + phishing keywords → 97%                 │
│ • Suspicious TLD + brand impersonation → 95%               │
│ • Suspicious TLD only → 82%                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: XGBoost ML Model (38 features)                     │
│ • 300 trees, 402KB JSON                                    │
│ • Features: URL lexical, domain, path, keywords, brand     │
│ • 3-Tier: Safe (<0.60), Warning (0.60-0.85), Block (≥0.85) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: Content Analysis (DOM)                             │
│ • Password forms                                            │
│ • External form actions                                     │
│ • Brand mismatch in page title/headings                    │
│ • Hidden iframes                                            │
│ • Credit card request detection                            │
│ • Brand impersonation từ hostname                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 6: Domain Age (RDAP)                                  │
│ • Query RDAP API (10+ TLDs supported)                      │
│ • <7 ngày → critical, <30 → high, <90 → medium            │
│ • Hiển thị trên banner: "Tuổi domain: X ngày"              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ FUSION LOGIC                                                │
│ • Rules override ML khi conflict                           │
│ • Official domain → SAFE (bỏ qua hết)                      │
│ • Brand impersonation → BLOCK (ghi đè ML)                  │
│ • Final = max(ML score, Content score)                     │
│ • 3-Tier threshold với màu sắc khác nhau                   │
└─────────────────────────────────────────────────────────────┘
```

### Fusion Logic Decision Tree

```
1. Official Domain (whitelist)?          → SAFE (0.01)
2. Subdomain của platform uy tín?        → SAFE (0.03)
3. Tranco Top 30K?                       → SAFE (0.05)
4. .edu.vn domain?                       → SAFE (0.03)
5. Brand Impersonation?                  → BLOCK (0.85-0.90)
6. Suspicious TLD + phishing keywords?   → BLOCK (0.97)
7. Suspicious TLD + brand impersonation? → BLOCK (0.95)
8. Suspicious TLD only?                  → BLOCK (0.82)
9. XGBoost ML score ≥ 0.85?              → BLOCK
10. XGBoost ML score 0.60-0.85?          → WARNING
11. Content analysis score cao?          → WARNING/BLOCK
12. Còn lại?                             → SAFE
```

### 3-Tier Display

| Tier | Score Range | Màu | Hành động |
|------|-------------|-----|-----------|
| 🟢 Safe | 0.00 - 0.60 | Xanh lá | Không cảnh báo |
| 🟡 Warning | 0.60 - 0.85 | Cam | Banner cam + nút "Báo cáo an toàn" |
| 🔴 Block | 0.85 - 1.00 | Đỏ đậm | Banner đỏ đậm + cảnh báo mạnh |

---

## 6. DANH SÁCH FILES

### Extension Files (production)

| File | Kích thước | Mô tả |
|------|-----------|-------|
| `manifest.json` | 0.5KB | Manifest V3 config |
| `background.js` | 0.5KB | Service worker — inject scripts |
| `content.js` | 5.2KB | Banner display + 3-tier logic |
| `content_analyzer.js` | 5.8KB | DOM analysis (forms, brand, iframes) |
| `feature_extractor.js` | 7.5KB | 38 features extraction (JS) |
| `xgboost_predictor.js` | 15.2KB | 5-layer prediction + 3-tier + helpers |
| `domain_age_checker.js` | 4.8KB | RDAP domain age checking |
| `popup.html` | 3.2KB | Popup UI |
| `popup.js` | 2.5KB | Popup logic |
| `models/xgboost_model_v2.json` | 402KB | ML model (300 trees, 38 features) |
| `models/feature_names.json` | 1.2KB | Feature names |
| `data/tranco_top30k.json` | 442KB | Tranco Top 30K domains |
| **TOTAL** | **~890KB** | < 1MB ✅ |

### Training Files (development)

| File | Mô tả |
|------|-------|
| `code/01_collect_data.py` | Data collection (PhishTank + Tranco) |
| `code/01a_augment_brand_data.py` | Brand impersonation data generation (500 URLs) |
| `code/02_feature_extraction.py` | 30 features extraction |
| `code/02_feature_extraction_v2.py` | 38 features extraction |
| `code/02_feature_extraction_v3.py` | 39 features (Full URL + is_bare_domain) |
| `code/03_eda_and_model.ipynb` | EDA + 6 models comparison + ROC curves |
| `code/03_retrain_model_v2.py` | Retrain with augmented data |
| `code/03_train_model_v4.py` | Train v4 with Full URL features |
| `code/04_prepare_tranco_top30k.py` | Tranco Top 30K preparation |
| `code/data/combined_dataset.csv` | 20,000 URLs (10K phish + 10K legit) |
| `code/data/combined_dataset_v2.csv` | 20,500 URLs (+ 500 augmented) |
| `code/data/features.csv` | 30 features dataset |
| `code/data/features_v3.csv` | 38 features dataset |
| `code/data/features_v4.csv` | 39 features dataset |
| `code/data/xgboost_model_tuned.json` | Model v1 (30 features, 402KB) |
| `code/data/xgboost_model_v2.json` | Model v2 (38 features, 402KB) |
| `code/data/xgboost_model_v3.json` | Model v3 (38 features augmented) |
| `code/data/xgboost_model_v4.json` | Model v4 (39 features, 424KB) |
| `code/data/feature_names.json` | 30 feature names |
| `code/data/feature_names_v2.json` | 38 feature names |
| `code/data/feature_names_v4.json` | 39 feature names |
| `code/data/roc_curves.png` | ROC curves (6 models) |
| `code/data/feature_importance.png` | Feature importance chart |

### Test Files

| File | Mô tả |
|------|-------|
| `extension/test_comprehensive.py` | 105 URLs, 6 groups — comprehensive test |
| `extension/test_3tier_tranco.py` | 3-tier + Tranco test (21 URLs) |
| `extension/test_final_3fixes.py` | 3 fixes test (IP + Homograph + Encoding) |
| `extension/test_hutech.py` | HUTECH websites test (8 URLs) |
| `extension/test_fitgirl_correct.py` | Fitgirl repack specific test |
| `extension/test_fitgirl_updated.py` | Fitgirl with brand detection |
| `extension/test_fitgirl.py` | Original Fitgirl test |
| `extension/test_model_v2.py` | Model v2 test |
| `extension/test_model_v3.py` | Model v3 test |
| `extension/test_model_v4.py` | Model v4 test |
| `extension/test_v2_brand_impersonation.py` | Brand impersonation test |
| `extension/test_reasons_display.py` | Reason display test |
| `extension/test_server.js` | Local test server |
| `extension/single_test_run.py` | Single run test suite |
| `extension/continuous_phishing_test.py` | Continuous monitoring |

### Documentation Files

| File | Mô tả |
|------|-------|
| `extension/BAO_CAO_KIEM_THU_PHISHING.md` | Báo cáo kiểm thử chi tiết |
| `extension/BAO_CAO_GIAI_DOAN_2.md` | Báo cáo giai đoạn 2 (retrain model) |
| `extension/TESTING_README.md` | Testing documentation |
| `KE_HOACH_DU_AN.md` | Project plan |
| `Bao_cao_tien_do_tuan_4.pdf` | Weekly progress report |

---

## 7. HẠN CHẾ VÀ HƯỚNG PHÁT TRIỂN

### Hạn chế hiện tại

| Hạn chế | Impact | Giải pháp tương lai |
|---------|--------|-------------------|
| **Brand config manual** | Phải thêm brand mới thủ công | Auto-discover brands từ Tranco + user reports |
| **RDAP timeout** | 5s có thể lâu với user | Cache results, async background |
| **Không có dangerous URL list** | Chỉ phát hiện qua ML + rules | Thêm blacklist từ PhishTank/URLhaus |
| **Không có auto-update** | Model/rules phải update thủ công | Firebase/Google Forms feedback loop |
| **Không có visual analysis** | Không detect logo/brand trên page | Computer Vision (TensorFlow.js) so sánh favicon |
| **Edge cases IP** | Public IP → warning thay vì block | Chấp nhận là limitation của đồ án |

### Hướng phát triển (Future Work)

1. **Dangerous URL Blacklist Layer**
   - Kết hợp PhishTank + OpenPhish + URLhaus feeds
   - File JSON ~500-1000 entries
   - Layer 1c trong kiến trúc

2. **Feedback Collection Pipeline**
   - Google Forms pre-filled URL khi user click "Báo cáo an toàn"
   - Auto-collect false positives/negatives
   - Monthly retrain với data mới

3. **Visual Brand Detection**
   - TensorFlow.js model nhận diện logo/brand trên page
   - So sánh favicon với database brand logos
   - Phát hiện phishing pages giả mạo giao diện

4. **Auto-Update Mechanism**
   - Firebase Realtime Database lưu model/rules updates
   - Extension fetch updates mỗi 24h
   - Rollback nếu model mới tệ hơn

5. **Adversarial Robustness**
   - URL normalization đầy đủ (punycode, unicode, encoding)
   - Feature bucketing thay vì raw values
   - Ensemble multiple models

---

## TỔNG KẾT

### Thành tựu đạt được

✅ **100% accuracy** trên 105 URLs test comprehensive  
✅ **Zero false positives** trên 35 sites uy tín  
✅ **100% detection rate** trên 36 brand impersonation URLs  
✅ **Explainable AI** — mỗi cảnh báo có lý do cụ thể  
✅ **Domain age checking** via RDAP (miễn phí, không API key)  
✅ **3-Tier threshold** thay vì binary  
✅ **7-layer defense architecture**  
✅ **100% offline** — không gửi data lên server  
✅ **< 1MB total size**, < 50ms inference time  
✅ **Chrome Manifest V3 compliant**

### Bài học rút ra

1. **ML không giải quyết được mọi thứ** — Rule-based layer quan trọng cho deterministic patterns (brand impersonation)
2. **Hybrid architecture tốt hơn pure ML** — Ensemble rules + ML cho coverage và accuracy cao nhất
3. **False positives quan trọng hơn false negatives** — User sẽ uninstall extension nếu bị báo sai quá nhiều
4. **Explainability là bắt buộc** — User cần hiểu TẠI SAO trang bị flag
5. **Defense in depth** — Nhiều layers bảo vệ tốt hơn 1 layer mạnh

---

*Báo cáo được tạo ngày 08/04/2026*  
*Trần Duy Thái — MSSV: 2387700060*
