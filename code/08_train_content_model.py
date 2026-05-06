import os
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

print("="*60)
print("🤖 HUẤN LUYỆN MÔ HÌNH CONTENT-BASED (SUBMODEL 2)")
print("="*60)

# 1. Đọc Dataset
data_path = 'data/html_features_poc.csv'
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

# 2. Định nghĩa Mô hình
# Vì đây là mô hình phân tích cấu trúc DOM (không quá phức tạp như URL), ta dùng cây nông hơn
model = xgb.XGBClassifier(
    n_estimators=100, 
    max_depth=3, 
    learning_rate=0.1,
    random_state=42
)

# 3. Huấn luyện
print("Đang huấn luyện mô hình XGBoost cho HTML DOM...")
model.fit(X_train, y_train)

# 4. Đánh giá
y_pred = model.predict(X_test)
print(f"Độ chính xác (Accuracy): {accuracy_score(y_test, y_pred) * 100:.2f}%")

# 5. Xuất ra file JSON cho Chrome Extension
out_dir = os.path.join('extension', 'models')
os.makedirs(out_dir, exist_ok=True)
model_path = os.path.join(out_dir, 'content_xgboost_model.json')

model.save_model(model_path)
file_size = os.path.getsize(model_path) / 1024

print("\n🎉 HOÀN TẤT!")
print(f"Đã lưu mô hình Content-based: {model_path}")
print(f"Dung lượng siêu nhẹ: {file_size:.2f} KB")
print("\nBây giờ Extension đã sở hữu KIẾN TRÚC 2 MÔ HÌNH (Multi-Model):")
print("- url_model.json: Chuyên gia soi cấu trúc chữ (Lexical)")
print("- content_model.json: Chuyên gia rà quét HTML (DOM Structural)")
print("="*60)
