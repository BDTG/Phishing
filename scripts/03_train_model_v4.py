# ============================================================
# 03_train_model_v4.py
# Train XGBoost v4 với 39 features (FULL URL) + SMOTE
# ============================================================
# Input:  data/processed/features_v4.csv
# Output: models/xgboost_model_v4.json
# ============================================================

import os          # Xử lý đường dẫn file/folder
import json        # Lưu model dưới dạng JSON
import time        # Đo thời gian train
import shutil      # Để copy file model sang Extension
import pandas as pd # Xử lý dataset
import numpy as np  # Xử lý array
from sklearn.model_selection import train_test_split # Chia train/test set
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, confusion_matrix # Metrics
from xgboost import XGBClassifier # Model XGBoost
from imblearn.over_sampling import SMOTE # Cân bằng dữ liệu

# Đường dẫn thư mục
DATA_ROOT = os.path.join(os.path.dirname(__file__), '..', 'data')
DATA_PROC = os.path.join(DATA_ROOT, 'processed')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
EXT_MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'extension', 'models')

IN_CSV    = os.path.join(DATA_PROC, 'features_v4.csv')
OUT_MODEL = os.path.join(MODEL_DIR, 'xgboost_model_v4.json')

# Tạo thư mục models nếu chưa có
os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("🚀 TRAIN XGBOOST V4 — 39 FEATURES (SMOTE + DEPLOY)")
print("=" * 60)

# Kiểm tra file input
if not os.path.exists(IN_CSV):
    print(f"LỖI: Không tìm thấy {IN_CSV}")
    print("Hãy chạy 02_feature_extraction_v3.py trước!")
    exit(1)

# Đọc dataset
df = pd.read_csv(IN_CSV)
print(f"Đã load: {len(df):,} URLs, {df.shape[1]-1} features")

# Tách features (X) và label (y)
feature_cols = [c for c in df.columns if c != 'label']
X = df[feature_cols].values
y = df['label'].values

# Chia train/test split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain (Gốc): {len(X_train):,} | Test: {len(X_test):,}")

# ──────────────────────────────────────────────────────────────
# CÂN BẰNG DỮ LIỆU (SMOTE)
# ──────────────────────────────────────────────────────────────
print("Đang áp dụng SMOTE để cân bằng dữ liệu...")
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"Train (Sau SMOTE): {len(X_train_res):,} (Phishing: {(y_train_res==1).sum():,}, Legit: {(y_train_res==0).sum():,})")

# ──────────────────────────────────────────────────────────────
# HUẤN LUYỆN (TRAINING)
# ──────────────────────────────────────────────────────────────
print("\nĐang huấn luyện XGBoost...")
start = time.time()

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.01,
    subsample=0.7,
    colsample_bytree=0.6,
    min_child_weight=1,
    reg_alpha=1,
    reg_lambda=1,
    gamma=0.3,
    random_state=42,
    eval_metric='logloss',
)

model.fit(X_train_res, y_train_res)
train_time = time.time() - start
print(f"Train xong trong {train_time:.2f}s")

# ──────────────────────────────────────────────────────────────
# ĐÁNH GIÁ (EVALUATION)
# ──────────────────────────────────────────────────────────────
print("\nĐánh giá trên test set...")
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred)
auc  = roc_auc_score(y_test, y_prob)

print(f"-> Accuracy: {acc*100:.2f}%")
print(f"-> F1-Score: {f1:.4f}")
print(f"-> ROC-AUC : {auc:.4f}")

# ──────────────────────────────────────────────────────────────
# LƯU & DEPLOY MODEL
# ──────────────────────────────────────────────────────────────
print(f"\nĐang lưu model → {OUT_MODEL}...")
model.save_model(OUT_MODEL)

# Tự động DEPLOY sang Extension
os.makedirs(EXT_MODEL_DIR, exist_ok=True)
ext_model_path = os.path.join(EXT_MODEL_DIR, 'xgboost_model_v4.json')
shutil.copy(OUT_MODEL, ext_model_path)
print(f"🚀 Đã DEPLOY sang Extension: {ext_model_path}")

# Lưu feature names
feat_names_file = os.path.join(DATA_PROC, 'feature_names_v4.json')
with open(feat_names_file, 'w') as f:
    json.dump(feature_cols, f, indent=2)
shutil.copy(feat_names_file, os.path.join(EXT_MODEL_DIR, 'feature_names_v4.json'))

print(f"\n✓ Hoàn tất quy trình huấn luyện!")
