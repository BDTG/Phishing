import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
import matplotlib.pyplot as plt
import json

print("="*60)
print("📊 BENCHMARK: 39 FEATURES VS REDUCED FEATURE SETS")
print("="*60)

# 1. Load Dataset
DATA_PATH = 'data/processed/features_v4.csv'
if not os.path.exists(DATA_PATH):
    print(f"Error: {DATA_PATH} not found.")
    exit()

df = pd.read_csv(DATA_PATH)
# The CSV doesn't have 'url' column, it only has features and 'label'
X = df.drop(['label'], axis=1)
y = df['label']

# Load feature names to ensure we have exactly 39 and they match
FEATURE_NAMES_PATH = 'extension/models/feature_names_v4.json'
with open(FEATURE_NAMES_PATH, 'r') as f:
    feature_names = json.load(f)

# The CSV columns should already match the 39 features
if len(X.columns) != len(feature_names):
    print(f"Warning: CSV has {len(X.columns)} features but feature_names.json has {len(feature_names)}")
    # Align if necessary
    X = X[feature_names]
else:
    X.columns = feature_names

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

def evaluate_model(features_subset, name):
    X_train_sub = X_train[features_subset]
    X_test_sub = X_test[features_subset]
    
    model = xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
    model.fit(X_train_sub, y_train)
    
    y_pred = model.predict(X_test_sub)
    
    return {
        "name": name,
        "num_features": len(features_subset),
        "accuracy": accuracy_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "model": model
    }

# --- STAGE 1: Full 39 Features ---
print("Training Full Model (39 features)...")
full_results = evaluate_model(feature_names, "Full 39 Features")

# --- STAGE 2: Feature Importance Analysis ---
print("Analyzing Feature Importance...")
importance = full_results['model'].feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importance
}).sort_values(by='importance', ascending=False)

# Save Importance to CSV for report
feature_importance_df.to_csv('data/live_analysis/feature_importance.csv', index=False)

# --- STAGE 3: Benchmarking Reduced Sets ---
benchmarks = [full_results]

# Test Top 30, Top 20, Top 10, Top 5
for n in [30, 20, 15, 10, 5]:
    print(f"Training Reduced Model (Top {n} features)...")
    top_features = feature_importance_df['feature'].head(n).tolist()
    res = evaluate_model(top_features, f"Top {n} Features")
    benchmarks.append(res)

# --- STAGE 4: Summary ---
print("\n" + "="*60)
print(f"{'Model Name':<20} | {'Features':<5} | {'Accuracy':<8} | {'F1-Score':<8}")
print("-" * 60)
for b in benchmarks:
    print(f"{b['name']:<20} | {b['num_features']:<8} | {b['accuracy']:.4f}   | {b['f1']:.4f}")

# Analysis Conclusion
print("\n🔍 KẾT LUẬN CHIẾN THUẬT:")
best_f1 = max(benchmarks, key=lambda x: x['f1'])
if best_f1['num_features'] < 39:
    diff = best_f1['f1'] - full_results['f1']
    if diff > -0.001:
        print(f"✅ BẠN NÊN GIẢM SỐ LƯỢNG ĐẶC TRƯNG.")
        print(f"Model '{best_f1['name']}' đạt hiệu năng tương đương/tốt hơn nhưng nhẹ hơn.")
    else:
        print(f"⚠️ 39 đặc trưng vẫn mang lại độ phủ tốt nhất, nhưng có thể tối ưu về {best_f1['num_features']}.")
else:
    print("✅ 39 đặc trưng là con số tối ưu cho độ chính xác cao nhất hiện tại.")

# Save benchmark data
summary_path = 'data/live_analysis/benchmark_summary.json'
with open(summary_path, 'w') as f:
    json_summary = [{k: v if k != 'model' else None for k, v in b.items()} for b in benchmarks]
    json.dump(json_summary, f, indent=4)

print(f"\nReport saved to: {summary_path}")
print("="*60)
