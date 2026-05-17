import os
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

print("="*60)
print("🤖 HUẤN LUYỆN MÔ HÌNH CONTENT-BASED (SUBMODEL 2)")
print("="*60)

# 1. Định nghĩa đường dẫn
DATA_ROOT = os.path.join(os.path.dirname(__file__), '..', 'data')
DATA_PROC = os.path.join(DATA_ROOT, 'processed')
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
EXT_MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'extension', 'models')

# 2. Đọc Dataset
data_path = os.path.join(DATA_PROC, 'html_features_poc.csv')
if not os.path.exists(data_path):
    print(f"Lỗi: Không tìm thấy {data_path}. Hãy chạy 07_extract_html_features_poc.py trước.")
    exit()

df = pd.read_csv(data_path)
print(f"Đã nạp {len(df)} mẫu dữ liệu DOM.")

# Tách Features (X) và Label (y)
X = df.drop(['url', 'label'], axis=1)
y = df['label']

# (Vì đây là POC mẫu nhỏ nên ta lấy dữ liệu train = test luôn để demo code chạy)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Định nghĩa Mô hình
model = xgb.XGBClassifier(
    n_estimators=100, 
    max_depth=3, 
    learning_rate=0.1,
    random_state=42
)

# 4. Huấn luyện
print("Đang huấn luyện mô hình XGBoost cho HTML DOM...")
model.fit(X_train, y_train)

# 5. Đánh giá
y_pred = model.predict(X_test)
print(f"Độ chính xác (Accuracy): {accuracy_score(y_test, y_pred) * 100:.2f}%")

# 6. Lưu Master Model
os.makedirs(MODEL_DIR, exist_ok=True)
master_model_path = os.path.join(MODEL_DIR, 'content_xgboost_model.json')
model.save_model(master_model_path)
print(f"Đã lưu Master Model: {master_model_path}")

# 7. Xuất ra file JSON cho Chrome Extension (Deployment)
os.makedirs(EXT_MODEL_DIR, exist_ok=True)
ext_model_path = os.path.join(EXT_MODEL_DIR, 'content_xgboost_model.json')
model.save_model(ext_model_path)

file_size = os.path.getsize(ext_model_path) / 1024
print(f"Đã cập nhật Extension Model: {ext_model_path} ({file_size:.2f} KB)")

print("\n🎉 HOÀN TẤT!")
print("="*60)
