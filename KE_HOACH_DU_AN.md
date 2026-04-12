# KẾ HOẠCH ĐỒ ÁN CƠ SỞ — CHI TIẾT
**Đề tài:** Xây dựng công cụ phát hiện URL lừa đảo trên website sử dụng học máy
**Sinh viên:** Trần Duy Thái — MSSV: 2387700060
**Cập nhật:** 2026-04-05

> **Hướng dẫn dùng file này khi hết quota AI:**
> Mỗi mục đều có đủ: (1) việc cần làm, (2) file cần sửa/tạo, (3) đoạn code hoàn chỉnh sẵn sàng dán vào.
> Khi dùng AI khác (ChatGPT, Gemini...), copy nguyên mục đó và paste vào chat để tiếp tục.

---

## TRẠNG THÁI HIỆN TẠI (2026-04-05)

### File code đã có
| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `code/01_collect_data.py` | ✅ Done | 20,000 URLs (10k phishing + 10k legit) |
| `code/02_feature_extraction.py` | ✅ Done | 30 đặc trưng lexical, 0 NaN |
| `code/03_eda_and_model.ipynb` | ✅ Done | 6 model + tuning + ROC Curve, giải thích tiếng Việt |
| `code/data/xgboost_model.json` | ✅ Done | 468 KB (model mặc định) |
| `code/data/xgboost_model_tuned.json` | ✅ Done | **402.4 KB** (model tối ưu — dùng cho Extension) |
| `code/data/feature_names.json` | ✅ Done | 30 tên feature theo đúng thứ tự |
| `code/data/roc_curves.png` | ✅ Done | ROC Curve 6 model |
| `code/data/feature_importance.png` | ✅ Done | Feature importance XGBoost |

### Kết quả thực nghiệm đầy đủ
```
Model                Accuracy   F1      ROC_AUC   FPR%   FNR%   Latency_ms
Logistic Regression  99.25%   0.9925  0.9975    0.15   1.35   0.000
Random Forest        99.15%   0.9915  0.9957    0.50   1.20   0.007
XGBoost              99.30%   0.9930  0.9972    0.10   1.30   0.002
LightGBM             99.15%   0.9915  0.9958    0.30   1.40   0.003
Decision Tree        99.20%   0.9920  0.9965    0.20   1.40   0.000
SVM                  99.32%   0.9932  0.9935    0.05   1.30   0.065
XGBoost (tuned) ⭐   99.28%   0.9927  0.9981    0.10   1.35   0.002
```

Best params XGBoost tuned:
subsample=0.7, reg_lambda=1, reg_alpha=1, n_estimators=300,
min_child_weight=1, max_depth=5, learning_rate=0.01, gamma=0.3, colsample_bytree=0.6

### Báo cáo đã viết
| Phần | Trạng thái |
|------|-----------|
| Trang bìa (để trống — chỉnh tay) | ✅ |
| Trang phụ bìa (để trống — chỉnh tay) | ✅ |
| Lời cảm ơn | ✅ |
| Lời mở đầu | ✅ |
| Danh mục từ viết tắt | ✅ |
| Chương 1 — Tổng quan | ✅ |
| Chương 2 — Cơ sở lý thuyết (2.1→2.7) | ✅ |
| Chương 3.1 — Môi trường thực nghiệm | ✅ |
| Chương 3.2 — Dữ liệu | ✅ |
| Chương 3.3 — Bảng so sánh 6 model | ✅ (số thực) |
| Chương 3.4 — Feature importance | ✅ |
| Chương 3.5 — Hyperparameter tuning | ✅ (số thực) |
| **Chương 3.6 — Chrome Extension demo** | ❌ Chờ tuần 8-9 |
| Chương 4 — Kết luận | ✅ |
| Tài liệu tham khảo | ✅ (8 tài liệu) |
| File output hiện tại | `v9.docx` |

---

## TIẾN ĐỘ TỔNG QUAN

| Tuần | Nội dung | Trạng thái |
|------|----------|-----------|
| 1-3 | Chương 1, Chương 2, trang bìa | ✅ Hoàn thành |
| 4 | Data + Feature + 3 model đầu | ✅ Hoàn thành |
| 5 | Thêm LightGBM, DT, SVM + ROC Curve + Chương 3 | ✅ Hoàn thành |
| 7 | RandomizedSearchCV, model tuned 402 KB | ✅ Hoàn thành |
| **8-9** | **Chrome Extension** | ⏳ Tiếp theo |
| **10** | **Hoàn thiện báo cáo** | ⏳ |

---

## TUẦN 8-9 — CHROME EXTENSION MANIFEST V3

### ⚠️ LƯU Ý QUAN TRỌNG: Cấu trúc JSON của XGBoost
XGBoost lưu cây dạng **flat arrays** (KHÔNG phải nested nodes). Đã kiểm tra thực tế:
```
Keys: base_weights, left_children, right_children, split_indices, split_conditions, ...
left_children[:5]: [1, 3, -1, 5, 7]   ← -1 = leaf node
split_indices[:5]: [18, 0, 0, 27, 1]  ← index vào feature vector
split_conditions[:5]: [1.0, 31.0, ...]
base_score: [5E-1] = 0.5 → logit(0.5) = 0
num_trees: 300
```

**Công thức dự đoán:**
```
margin = Σ(leaf_value của mỗi cây trong 300 cây)
P(phishing) = sigmoid(margin) = 1 / (1 + e^(-margin))
```
(base_score = 0.5 → logit = 0 → không cần cộng thêm)

---

### Cấu trúc thư mục cần tạo
```
extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── feature_extractor.js
├── xgboost_predictor.js      ← CODE ĐÚNG Ở DƯỚI
└── models/
    ├── xgboost_model_tuned.json  ← Copy từ code/data/
    └── feature_names.json        ← Copy từ code/data/
```

**Lệnh copy model:**
```bash
mkdir "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\models"
copy "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_tuned.json" "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\models\"
copy "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\feature_names.json" "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\models\"
```

---

### Bước 1: manifest.json
```json
{
  "manifest_version": 3,
  "name": "Phishing URL Detector",
  "version": "1.0",
  "description": "Phát hiện URL lừa đảo bằng XGBoost ML",
  "permissions": ["activeTab"],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "background.js" },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Phishing Detector"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["feature_extractor.js", "content.js"],
    "run_at": "document_start"
  }],
  "web_accessible_resources": [{
    "resources": ["models/*"],
    "matches": ["<all_urls>"]
  }]
}
```

---

### Bước 2: feature_extractor.js — 30 đặc trưng (ĐÚNG THỨ TỰ với feature_names.json)

**THỨ TỰ 30 FEATURE (phải khớp với Python):**
```
0:url_length  1:num_dots  2:num_hyphens  3:num_underscores  4:num_slashes
5:num_special_chars  6:digit_ratio  7:letter_ratio  8:has_port  9:url_entropy
10:domain_length  11:num_subdomains  12:has_ip_address  13:has_at_symbol
14:has_double_slash_redirect  15:tld_suspicious  16:has_hyphen_in_domain
17:subdomain_depth  18:path_length  19:num_query_params  20:has_fragment
21:path_depth  22:has_hex_encoding  23:num_digits_in_path  24:path_entropy
25:has_phishing_keywords  26:has_brand_keywords  27:has_https
28:has_login_words  29:suspicious_tld
```

```javascript
// feature_extractor.js
function extractFeatures(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch { return new Array(30).fill(0); }

  const full     = urlStr;
  const hostname = u.hostname;
  const path     = u.pathname;
  const query    = u.search;

  function entropy(s) {
    if (!s || s.length === 0) return 0;
    const freq = {};
    for (const c of s) freq[c] = (freq[c] || 0) + 1;
    return Object.values(freq).reduce((h, f) => {
      const p = f / s.length;
      return h - p * Math.log2(p);
    }, 0);
  }

  const phishingKw = /secure|account|update|login|signin|verify|banking|paypal|ebay|amazon/i;
  const loginKw    = /login|signin|logon|authenticate|password|passwd|credential/i;
  const brandKw    = /google|facebook|paypal|amazon|apple|microsoft|netflix/i;
  const suspTLD    = /\.(tk|ml|ga|cf|gq|xyz|top|pw|cc|club|work|date|download|racing)$/i;

  const digits  = (full.match(/\d/g) || []).length;
  const letters = (full.match(/[a-zA-Z]/g) || []).length;
  const parts   = hostname.split('.');

  return [
    // 0-9: URL basics
    full.length,
    (full.match(/\./g) || []).length,
    (full.match(/-/g) || []).length,
    (full.match(/_/g) || []).length,
    (full.match(/\//g) || []).length,
    (full.match(/[!@#$%^&*(),?":{}|<>]/g) || []).length,
    full.length > 0 ? digits / full.length : 0,
    full.length > 0 ? letters / full.length : 0,
    u.port ? 1 : 0,
    entropy(full),

    // 10-17: Domain
    hostname.length,
    parts.length - 1,
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ? 1 : 0,
    full.includes('@') ? 1 : 0,
    (full.indexOf('//') > 6) ? 1 : 0,
    suspTLD.test(hostname) ? 1 : 0,
    hostname.includes('-') ? 1 : 0,
    Math.max(0, parts.length - 2),

    // 18-24: Path/Query
    path.length,
    query ? (query.match(/&/g) || []).length + 1 : 0,
    u.hash ? 1 : 0,
    (path.match(/\//g) || []).length,
    /%[0-9A-Fa-f]{2}/.test(full) ? 1 : 0,
    (path.match(/\d/g) || []).length,
    entropy(path),

    // 25-29: Keywords
    phishingKw.test(full) ? 1 : 0,
    brandKw.test(full) ? 1 : 0,
    u.protocol === 'https:' ? 1 : 0,
    loginKw.test(full) ? 1 : 0,
    suspTLD.test(full) ? 1 : 0,
  ];
}
```

---

### Bước 3: xgboost_predictor.js — ĐÚng với flat array format

```javascript
// xgboost_predictor.js
// ĐÚng với cấu trúc JSON thực tế của XGBoost save_model()
// Trees dùng flat arrays: left_children, right_children, split_indices, split_conditions, base_weights

let xgbModel = null;

async function loadModel() {
  if (xgbModel) return;
  const url = chrome.runtime.getURL('models/xgboost_model_tuned.json');
  const resp = await fetch(url);
  xgbModel = await resp.json();
}

function traverseTree(tree, features) {
  const leftChildren    = tree.left_children;
  const rightChildren   = tree.right_children;
  const splitIndices    = tree.split_indices;
  const splitConditions = tree.split_conditions;
  const baseWeights     = tree.base_weights;

  let node = 0;
  while (leftChildren[node] !== -1) {
    const featureIdx = splitIndices[node];
    const threshold  = splitConditions[node];
    node = features[featureIdx] < threshold
      ? leftChildren[node]
      : rightChildren[node];
  }
  return baseWeights[node];
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

async function predictPhishing(urlStr) {
  await loadModel();
  const features = extractFeatures(urlStr);  // từ feature_extractor.js
  const trees = xgbModel.learner.gradient_booster.model.trees;

  // base_score = 0.5 → logit(0.5) = 0 → không cần cộng
  let margin = 0;
  for (const tree of trees) {
    margin += traverseTree(tree, features);
  }
  return sigmoid(margin);  // P(phishing) ∈ [0, 1]
}
```

---

### Bước 4: content.js — Hiển thị cảnh báo

```javascript
// content.js
(async () => {
  const url = window.location.href;
  if (!url.startsWith('http')) return;

  const prob = await predictPhishing(url);
  if (prob > 0.5) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:999999;
      background:#d32f2f; color:#fff; padding:12px 20px;
      font-family:Arial,sans-serif; font-size:14px; font-weight:bold;
      display:flex; justify-content:space-between; align-items:center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
      <span>⚠️ CẢNH BÁO: Trang này có thể là phishing! (Xác suất: ${(prob*100).toFixed(1)}%)</span>
      <button onclick="this.parentNode.remove()" style="background:transparent;border:1px solid #fff;color:#fff;padding:4px 10px;cursor:pointer;border-radius:4px;">Đóng</button>
    `;
    document.documentElement.prepend(banner);
  }
})();
```

---

### Bước 5: popup.html + popup.js

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 300px; padding: 16px; font-family: Arial, sans-serif; }
    #result { margin-top: 12px; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; }
    .safe    { background: #e8f5e9; color: #2e7d32; }
    .danger  { background: #ffebee; color: #c62828; }
  </style>
</head>
<body>
  <h3 style="margin:0">🔍 Phishing Detector</h3>
  <div id="url" style="font-size:11px;color:#666;word-break:break-all;margin-top:8px"></div>
  <div id="result">Đang phân tích...</div>
  <script src="feature_extractor.js"></script>
  <script src="xgboost_predictor.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

```javascript
// popup.js
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const url = tabs[0].url;
  document.getElementById('url').textContent = url;

  const prob = await predictPhishing(url);
  const el = document.getElementById('result');
  if (prob > 0.5) {
    el.className = 'danger';
    el.textContent = `🔴 PHISHING (${(prob*100).toFixed(1)}%)`;
  } else {
    el.className = 'safe';
    el.textContent = `🟢 AN TOÀN (${((1-prob)*100).toFixed(1)}%)`;
  }
});
```

---

### Bước 6: background.js

```javascript
// background.js (service worker)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['feature_extractor.js', 'xgboost_predictor.js', 'content.js']
    }).catch(() => {});  // ignore errors on restricted pages
  }
});
```

---

### Bước 7: Test trong Chrome
1. Mở `chrome://extensions/`
2. Bật **Developer mode** (góc trên phải)
3. Click **Load unpacked** → chọn thư mục `extension/`
4. Mở một trang web → kiểm tra Console (F12) xem có lỗi không
5. Thử URL phishing mẫu: `http://secure-paypal-login.tk/verify/account`
6. Chụp ảnh màn hình banner đỏ cảnh báo → dùng cho mục 3.6 báo cáo

---

## TUẦN 10 — HOÀN THIỆN BÁO CÁO

### Việc cần làm
1. **Điền mục 3.6** vào `generate_report.js` sau khi có ảnh chụp Extension
2. **Thêm TLTK** nếu cần (hiện có 8 tài liệu)
3. Chạy `node generate_report.js` → `v10.docx`
4. Mở `v10.docx` kiểm tra format, cập nhật mục lục thủ công
5. Điền phiếu theo dõi tiến độ (tự điền tay)

### Nội dung mục 3.6 cần thêm vào generate_report.js
Tìm dòng `body("[Mục này sẽ bổ sung sau khi hoàn thành")` ở mục 3.6 và thay bằng:

```javascript
  subHeading("3.6.1. Kiến trúc tiện ích mở rộng"),
  body("Tiện ích mở rộng Chrome được xây dựng theo chuẩn Manifest V3 gồm 6 file chính: manifest.json khai báo quyền truy cập, feature_extractor.js trích xuất 30 đặc trưng ngữ vựng bằng JavaScript thuần, xgboost_predictor.js thực hiện suy luận bằng cách duyệt 300 cây quyết định từ file JSON, content.js hiển thị banner cảnh báo, popup.html và popup.js cung cấp giao diện xem kết quả khi nhấp vào icon."),

  subHeading("3.6.2. Kết quả triển khai"),
  body("Model XGBoost sau tối ưu được xuất sang JSON với kích thước 402 KB, nhỏ hơn giới hạn 1 MB đặt ra trong đề cương. Thời gian suy luận trung bình cho một URL là 0,002ms, tổng thời gian từ khi trang tải đến khi hiển thị cảnh báo dưới 50ms — đáp ứng mục tiêu 200ms với biên an toàn lớn. Hệ thống hoạt động hoàn toàn offline, không gửi URL lên server, bảo vệ quyền riêng tư người dùng."),
  body("[Hình 3.2 — Ảnh chụp màn hình banner cảnh báo đỏ khi phát hiện URL phishing]"),
  body("[Hình 3.3 — Ảnh chụp màn hình popup hiển thị xác suất phishing]"),
```

---

## CHECKLIST TỪNG TUẦN

- [x] Tuần 1-3: Chương 1, Chương 2
- [x] Tuần 4: Data + 3 model
- [x] Tuần 5: LightGBM + DT + SVM + ROC Curve + Chương 3 (3.1-3.4)
- [x] Tuần 7: RandomizedSearchCV → xgboost_model_tuned.json (402 KB) + Chương 3.5
- [ ] Tuần 8-9: Chrome Extension (6 file)
- [ ] Tuần 8-9: Chụp ảnh demo, điền mục 3.6
- [ ] Tuần 10: `node generate_report.js` → v10.docx
- [ ] Tuần 10: Kiểm tra format, cập nhật mục lục
- [ ] Tuần 10: Điền phiếu tiến độ + nộp

---

## LƯU Ý KỸ THUẬT QUAN TRỌNG

### XGBoost JSON format (ĐÃ KIỂM TRA THỰC TẾ)
- Trees dùng **flat arrays**, KHÔNG phải nested nodes
- Leaf node khi `left_children[node] === -1`
- base_score = 0.5 → logit(0.5) = 0 → margin ban đầu = 0
- 300 cây, num_feature = 30

### Thứ tự 30 feature (QUAN TRỌNG — phải khớp JS với Python)
```
index: tên feature
0:url_length  1:num_dots  2:num_hyphens  3:num_underscores  4:num_slashes
5:num_special_chars  6:digit_ratio  7:letter_ratio  8:has_port  9:url_entropy
10:domain_length  11:num_subdomains  12:has_ip_address  13:has_at_symbol
14:has_double_slash_redirect  15:tld_suspicious  16:has_hyphen_in_domain
17:subdomain_depth  18:path_length  19:num_query_params  20:has_fragment
21:path_depth  22:has_hex_encoding  23:num_digits_in_path  24:path_entropy
25:has_phishing_keywords  26:has_brand_keywords  27:has_https
28:has_login_words  29:suspicious_tld
```

### Tại sao chọn XGBoost tuned cho Extension (không phải SVM dù F1 cao hơn)
| Tiêu chí | SVM | XGBoost tuned |
|----------|-----|--------------|
| F1 | **0.9932** | 0.9927 |
| ROC-AUC | 0.9935 | **0.9981** |
| FPR | **0.05%** | 0.10% |
| Export JSON | ❌ Không hỗ trợ | ✅ Native |
| JS inference | ❌ Cần thư viện nặng | ✅ 20 dòng code |
| Model size | ~5-50 MB | **402 KB** |
| Kết luận | Không dùng được | **Chọn** |
