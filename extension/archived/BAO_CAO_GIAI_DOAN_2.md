# BÁO CÁO GIAI ĐOẠN 2 — RETRAIN MODEL V2

## Kết quả

### Model Performance Comparison

| Metric | Model v1 (30f) | Model v2 (38f) | Thay đổi |
|--------|---------------|---------------|----------|
| Accuracy | 99.28% | **99.35%** | +0.07% ✅ |
| F1 Score | 0.9927 | **0.9935** | +0.0008 ✅ |
| ROC AUC | 0.9981 | **0.9982** | +0.0001 ✅ |
| FPR | 0.10% | 0.10% | = |
| FNR | 1.35% | **1.20%** | -0.15% ✅ |
| Model size | 402.4 KB | 418.9 KB | +16.5 KB |
| Train time | ~2s | **0.94s** | -50% ✅ |

### Top Features Quan Trọng

| Rank | Feature | Importance | Ghi chú |
|------|---------|-----------|---------|
| 1 | num_slashes | 29.11% | Feature cũ |
| 2 | path_length | 27.04% | Feature cũ |
| 3 | path_depth | 26.75% | Feature cũ |
| 4 | path_entropy | 4.86% | Feature cũ |
| 5 | num_digits_in_path | 2.38% | Feature cũ |
| 6 | has_https | 2.21% | Feature cũ |
| 7 | domain_length | 2.12% | Feature cũ |
| 8 | url_length | 1.51% | Feature cũ |
| ... | ... | ... | |
| 13 | min_levenshtein_to_official | **0.22%** | **Feature mới** ✅ |

### Test Brand Impersonation

| URL | Model v2 Score | Kết quả |
|-----|---------------|---------|
| fitgirl-repack.com | 23.3% | ❌ SAFE (đúng là fake) |
| fitgirlrepacks.org | 17.8% | ❌ SAFE |
| fitgirl-repack.net | 18.0% | ❌ SAFE |
| fitgirlrepackz.com | 24.4% | ❌ SAFE |
| fitgirl-repacks.xyz | 32.4% | ❌ SAFE |
| fitgirl-repacks.site (official) | 27.3% | ✅ SAFE (đúng) |

## Nhận xét

### Ưu điểm
1. **Model v2 cải thiện nhẹ** về accuracy (99.35% vs 99.28%) và giảm FNR
2. **8 features mới hoạt động** — `min_levenshtein_to_official` được model chọn làm feature quan trọng thứ 13
3. **Train nhanh hơn** 50% so với model cũ
4. **Model size vẫn nhỏ** (419 KB < 1 MB limit)

### Hạn chế
1. **Model v2 KHÔNG phát hiện được brand impersonation** — vì training data không có các samples fake sites
2. Các fake Fitgirl sites vẫn bị đánh là SAFE (23-32%)
3. Cần phải **augment training data** với brand impersonation samples để model học được pattern này

## Giải pháp

### Hiện tại extension vẫn hoạt động tốt nhờ:
- **Brand impersonation detection** (rule-based) trong `xgboost_predictor.js`
- **Levenshtein distance** check cho typosquatting
- **Suspicious TLD** rules

→ Extension detect 100% fake sites (24/24) nhờ rule-based layer, KHÔNG phải nhờ ML model

### Khuyến nghị cho tương lai:
1. **Thu thập brand impersonation samples** (ít nhất 500-1000 URLs)
2. **Augment dataset** với các URLs giả mạo thương hiệu
3. **Retrain model** với dataset đã augment
4. Model sẽ học được pattern brand impersonation từ data

## Files đã tạo

| File | Mô tả |
|------|-------|
| `code/02_feature_extraction_v2.py` | Extract 38 features |
| `code/03_retrain_model_v2.py` | Retrain XGBoost v2 |
| `code/data/features_v2.csv` | Dataset 38 features (20K URLs) |
| `code/data/xgboost_model_v2.json` | Model mới 419 KB |
| `code/data/feature_names_v2.json` | 38 feature names |
| `extension/feature_extractor_v2.js` | JS extractor 38 features |
| `extension/models/xgboost_model_v2.json` | Copy model vào extension |
| `extension/test_model_v2.py` | Test script cho model v2 |

## Kết luận

- **Model v2 tốt hơn model v1** về mặt thống kê (accuracy cao hơn, FNR thấp hơn)
- **Nhưng KHÔNG giải quyết được vấn đề brand impersonation** vì thiếu data
- **Extension vẫn hoạt động 100%** nhờ rule-based brand detection layer
- → **GIAI ĐOẠN 2 hoàn thành** — model đã được retrain và sẵn sàng sử dụng
