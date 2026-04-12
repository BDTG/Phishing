# ============================================================
# 03_train_model_v4.py
# Train XGBoost v4 với 39 features (FULL URL)
# ============================================================
# Input:  data/features_v4.csv
# Output: data/xgboost_model_v4.json
# ============================================================

import os          # Xử lý đường dẫn file/folder
import json        # Lưu model dưới dạng JSON
import time        # Đo thời gian train
import pandas as pd # Xử lý dataset
import numpy as np  # Xử lý array
from sklearn.model_selection import train_test_split # Chia train/test set
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix # Metrics
from xgboost import XGBClassifier # Model XGBoost

# Đường dẫn thư mục data và file input/output
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
IN_CSV   = os.path.join(DATA_DIR, 'features_v4.csv')
OUT_MODEL = os.path.join(DATA_DIR, 'xgboost_model_v4.json')

print("=" * 60)
print("  Train XGBoost v4 — 39 features (FULL URL)")
print("=" * 60)

# Kiểm tra file input có tồn tại không
if not os.path.exists(IN_CSV):
    print(f"LỖI: Không tìm thấy {IN_CSV}")
    print("Hãy chạy 02_feature_extraction_v3.py trước!")
    exit(1)

# Đọc dataset
df = pd.read_csv(IN_CSV)
print(f"Đã load: {len(df):,} URLs, {df.shape[1]-1} features")

# Tách features (X) và label (y)
feature_cols = [c for c in df.columns if c != 'label'] # Tất cả cột trừ 'label'
X = df[feature_cols].values # Features array
y = df['label'].values      # Labels array

print(f"Features: {len(feature_cols)}")
print(f"Phishing: {y.sum():,} ({y.sum()/len(y)*100:.1f}%)")
print(f"Legit:    {(y==0).sum():,} ({(y==0).sum()/len(y)*100:.1f}%)")

# Chia train/test split (80/20)
# stratify=y → giữ tỷ lệ phishing/legit bằng nhau trong 2 tập
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {len(X_train):,} | Test: {len(X_test):,}")

# ──────────────────────────────────────────────────────────────
# TRAIN XGBoost với hyperparameters tuned
# ──────────────────────────────────────────────────────────────
print("\nĐang train XGBoost v4...")
start = time.time() # Bắt đầu đếm thời gian

model = XGBClassifier(
    n_estimators=300,        # Số cây quyết định
    max_depth=5,             # Độ sâu tối đa của mỗi cây
    learning_rate=0.01,      # Tốc độ học
    subsample=0.7,           # Tỷ lệ mẫu cho mỗi cây
    colsample_bytree=0.6,    # Tỷ lệ features cho mỗi cây
    min_child_weight=1,      # Trọng lượng tối thiểu leaf node
    reg_alpha=1,             # L1 regularization
    reg_lambda=1,            # L2 regularization
    gamma=0.3,               # Minimum loss reduction
    random_state=42,         # Seed
    eval_metric='logloss',   # Metric
)

model.fit(X_train, y_train) # Train model
train_time = time.time() - start # Kết thúc đếm thời gian
print(f"Train xong trong {train_time:.2f}s")

# ──────────────────────────────────────────────────────────────
# EVALUATE trên test set
# ──────────────────────────────────────────────────────────────
print("\nĐánh giá trên test set...")
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred)
auc  = roc_auc_score(y_test, y_prob)
cm   = confusion_matrix(y_test, y_pred)

tp, tn = cm[1][1], cm[0][0]
fp, fn = cm[0][1], cm[1][0]
fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
fnr = fn / (fn + tp) if (fn + tp) > 0 else 0

# In bảng so sánh 4 versions
print(f"\n{'Model':20s}  Accuracy   F1      ROC_AUC   FPR%   FNR%   Time_s")
print(f"{'XGBoost v1 (30f)':20s}  99.28%   0.9927  0.9981    0.10   1.35   ~2.0")
print(f"{'XGBoost v3 (38f)':20s}  99.51%   0.9952  0.9968    0.05   0.90   0.50")
print(f"{'XGBoost v4 (39f)':20s}  {acc*100:.2f}%   {f1:.4f}  {auc:.4f}    {fpr*100:.2f}   {fnr*100:.2f}   {train_time:.3f}")

# ──────────────────────────────────────────────────────────────
# FEATURE IMPORTANCE
# ──────────────────────────────────────────────────────────────
print(f"\nTop 15 features quan trọng nhất:")
importances = model.feature_importances_
feat_imp = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
for i, (name, imp) in enumerate(feat_imp[:15]):
    bar = '█' * int(imp * 100)
    print(f"  {i+1:2d}. {name:35s}  {imp:.4f}  {bar}")

# ──────────────────────────────────────────────────────────────
# SAVE MODEL
# ──────────────────────────────────────────────────────────────
print(f"\nĐang lưu model → {OUT_MODEL}...")
model.save_model(OUT_MODEL)

model_size = os.path.getsize(OUT_MODEL)
print(f"Model size: {model_size / 1024:.1f} KB ({model_size:,} bytes)")

# Lưu feature names
feat_names_file = os.path.join(DATA_DIR, 'feature_names_v4.json')
with open(feat_names_file, 'w') as f:
    json.dump(feature_cols, f, indent=2)
print(f"Feature names → {feat_names_file}")

print(f"\n✓ Hoàn tất!")
