# BÁO CÁO CẢI TIẾN EXTENSION — PHASE 2
## Đồ Án Cơ Sở — Trần Duy Thái (MSSV: 2387700060)
**Ngày:** 08/04/2026

---

## 1. CẢI TIẾN ĐÃ IMPLEMENT

### 1.1 Dangerous URL Blacklist Layer

**File mới:**
- `extension/data/dangerous_urls.json` — 120+ URLs nguy hiểm + 6 wildcard patterns
- `extension/dangerous_url_checker.js` — Load và check dangerous URLs
- `extension/feature_extractor_v3.js` — Extract features từ FULL URL (có path)

**Cập nhật:**
- `manifest.json` — Thêm `dangerous_url_checker.js` vào content_scripts
- `background.js` — Inject thêm dangerous URL checker
- `xgboost_predictor.js` — Thêm Layer 1b: Dangerous URL Blacklist

**Cách hoạt động:**
```
Layer 0: IP/Homograph/Decode
Layer 1a: Whitelist (SAFE_DOMAINS)
Layer 1a-sub: Safe platforms (github.io, vercel.app...)
Layer 1b: Dangerous URL Blacklist ← MỚI
  → Nếu hostname ∈ dangerous_urls.json → BLOCK 0.98
  → Wildcard matching: *.free-robux-generator.*
Layer 1c: Tranco Top 30K
Layer 2: Brand Impersonation
Layer 3: Suspicious TLD + ML Model
Layer 4: Content Analysis (DOM)
Layer 5: Domain Age (RDAP)
```

**120+ URLs trong blacklist bao gồm:**
- 30 phishing patterns đã biết (paypal-verify, secure-banking...)
- 30 brand typosquatting (paypa1, goggle, faceb00k...)
- 30 fake/crypto wallet phishing (metamask, trustwallet, binance...)
- 30 free generator scams (free-robux, free-vbucks, steam-free...)
- 6 wildcard patterns (*.free-robux-generator.*, *.wallet-verify.*)

### 1.2 Full URL Feature Extraction (v3)

**Vấn đề cũ:** Feature extraction dùng "bare domain" → path features luôn = 0 → ML bỏ lỡ 57% feature importance.

**Giải pháp mới:** `feature_extractor_v3.js` extract từ FULL URL (có path, query, fragment).

**So sánh:**
| Feature | v2 (bare domain) | v3 (full URL) |
|---------|-----------------|---------------|
| path_length | 0 | Giá trị thực |
| path_depth | 0 | Giá trị thực |
| path_entropy | 0 | Giá trị thực |
| num_slashes | 2 | Giá trị thực (≥2) |
| url_length | ~30 | Giá trị thực (≥30) |

**Lưu ý:** Feature v3 cần retrain model với dataset mới để ML học được patterns từ path. Hiện tại extension vẫn dùng model v2 (trained trên bare domain) → feature v3 chưa có hiệu quả tối ưu.

---

## 2. KẾT QUẢ KIỂM THỬ

### Massive Test — 250 URLs, 12 Groups

| Nhóm | Kết quả | Ghi chú |
|------|---------|---------|
| Official domains (50) | **50/50 (100%)** | ✅ |
| Official subdomains (20) | **19/20 (95%)** | 1 lỗi: raw.githubusercontent.com |
| Safe platforms (15) | **15/15 (100%)** | ✅ |
| HUTECH (10) | **10/10 (100%)** | ✅ |
| Fitgirl fakes (25) | **25/25 (100%)** | ✅ |
| Brand typosquatting (30) | **30/30 (100%)** | ✅ |
| Known phishing (30) | **30/30 (100%)** | ✅ |
| Adversarial/Edge (20) | **20/20 (100%)** | ✅ |
| Safe long-path (15) | **15/15 (100%)** | ✅ |
| Suspicious but safe (10) | **10/10 (100%)** | ✅ |
| Anti-phishing pages (10) | **10/10 (100%)** | ✅ |
| News sites (15) | **15/15 (100%)** | ✅ |
| **TỔNG** | **249/250 (99.6%)** | ⭐ |

### So sánh trước/sau cải tiến

| Chỉ số | Ban đầu | Sau Phase 1 | Sau cải tiến |
|--------|---------|-------------|-------------|
| Accuracy | 50% | 100% (24 URLs) | 99.6% (250 URLs) |
| Layers | 1 (ML only) | 5 | **7** |
| Brand protection | 0 brands | 15 brands | **15 brands + 120 URLs blacklist** |
| Domain age check | ❌ | ❌ | ✅ RDAP API |
| Explainable AI | ❌ | ✅ | ✅ + domain age |
| URL decoding | ❌ | ✅ | ✅ |
| Homograph detection | ❌ | ✅ | ✅ + Cyrillic normalization |
| IP detection | ❌ | ✅ | ✅ |
| 3-Tier threshold | ❌ | ✅ | ✅ |

---

## 3. KIẾN TRÚC HIỆN TẠI (7 LAYERS)

```
URL Input
    │
    ▼
┌─────────────────────────────────────────┐
│ LAYER 0: Pre-check                      │
│ • URL Decode (chống double encoding)    │
│ • Localhost/IP detection               │
│ • Homograph/IDN detection              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ LAYER 1: Trust Lists                    │
│ • 1a. SAFE_DOMAINS whitelist           │
│ • 1a-sub. Safe platforms               │
│ • 1b. Dangerous URL Blacklist ← MỚI    │
│ • 1c. Tranco Top 30K                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ LAYER 2: Brand Impersonation            │
│ • 15 brands config                     │
│ • Levenshtein distance ≤ 3             │
│ • Subdomain check                      │
│ • Fuzzy matching                       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ LAYER 3: Heuristics + ML                │
│ • Suspicious TLD rules (17 TLDs)       │
│ • XGBoost ML Model (38 features)       │
│ • Public IP heuristic                  │
│ • 3-Tier threshold (0.78/0.85)         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ LAYER 4: Content Analysis (DOM)         │
│ • Password forms                        │
│ • External form actions                │
│ • Brand mismatch                       │
│ • Hidden iframes                       │
│ • Credit card requests                 │
│ • Brand impersonation                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ LAYER 5: Domain Age (RDAP)              │
│ • Query RDAP API (10+ TLDs)            │
│ • Risk assessment theo tuổi domain     │
│ • Hiển thị trên banner                 │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ FUSION LOGIC                            │
│ • Rules override ML                    │
│ • Official → SAFE                      │
│ • Brand impersonation → BLOCK          │
│ • max(ML, Content) → 3-Tier display    │
└─────────────────────────────────────────┘
```

---

## 4. DANH SÁCH FILES HOÀN CHỈNH

### Extension Files (production)
| File | Size | Mô tả |
|------|------|-------|
| `manifest.json` | 0.5KB | Config |
| `background.js` | 0.6KB | Service worker |
| `content.js` | 5.5KB | 3-tier banner |
| `content_analyzer.js` | 5.8KB | DOM analysis |
| `feature_extractor.js` | 7.5KB | 38 features |
| `feature_extractor_v3.js` | 3.8KB | **MỚI** — Full URL features |
| `xgboost_predictor.js` | 16.5KB | 7-layer prediction |
| `domain_age_checker.js` | 4.8KB | RDAP check |
| `dangerous_url_checker.js` | 1.5KB | **MỚI** — Blacklist check |
| `popup.html` | 3.2KB | Popup UI |
| `popup.js` | 2.5KB | Popup logic |
| `models/xgboost_model_v2.json` | 402KB | ML model |
| `data/tranco_top30k.json` | 442KB | Tranco domains |
| `data/dangerous_urls.json` | 4.2KB | **MỚI** — Blacklist |
| **TOTAL** | **~895KB** | |

---

## 5. HẠN CHẾ CÒN TỒN

| Hạn chế | Impact | Giải pháp |
|---------|--------|-----------|
| `raw.githubusercontent.com` bị flag | Thấp | Thêm vào SAFE_DOMAINS |
| Path features ML chưa tối ưu | Trung bình | Cần retrain model với full URL dataset |
| Không có visual analysis | Trung bình | Future Work — TensorFlow.js logo detection |
| Manual brand config | Thấp | Auto-discovery từ user reports |

---

## 6. FUTURE WORK

1. **Retrain Model v5** — Với full URL features (path có giá trị thực)
2. **Visual Brand Detection** — TensorFlow.js nhận diện logo trên page
3. **Auto-Update Mechanism** — Firebase sync model/rules updates
4. **Feedback Collection** — Google Forms pre-filled cho user reports
5. **Adversarial Training** — Generate adversarial URLs để train model robust hơn

---

*Báo cáo cải tiến Phase 2 — 08/04/2026*
*Trần Duy Thái — MSSV: 2387700060*
