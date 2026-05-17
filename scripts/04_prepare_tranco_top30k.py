# ============================================================
# 04_prepare_tranco_top30k.py
# Tải Tranco Top 30K và export thành JSON cho extension
# ============================================================
# Output: extension/data/tranco_top30k.json
# ============================================================

import os          # Xử lý đường dẫn file/folder
import json        # Xử lý file JSON
import requests    # HTTP client để tải dữ liệu
import zipfile     # Giải nén file zip
import io          # Xử lý buffer IO

# Đường dẫn thư mục data gốc
DATA_RAW  = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
# Đường dẫn thư mục data trong extension/
EXT_DIR   = os.path.join(os.path.dirname(__file__), '..', 'extension', 'data')

# Tạo thư mục nếu chưa tồn tại
os.makedirs(DATA_RAW, exist_ok=True)
os.makedirs(EXT_DIR, exist_ok=True)

# URL tải Tranco Top 1M (Bản ổn định nhất)
TRANCO_URL = 'https://tranco-list.eu/top-1m.csv.zip'

print("=" * 60)
print("  Tải Tranco Top 30K (Tối ưu Whitelist)")
print("=" * 60)

try:
    # Bước 1: Tải file zip từ Tranco
    print(f"\nĐang tải từ {TRANCO_URL}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    r = requests.get(TRANCO_URL, headers=headers, timeout=120)
    r.raise_for_status()

    # Bước 2: Giải nén và đọc CSV
    print("Giải nén và xử lý...")
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        csv_name = z.namelist()[0]
        with z.open(csv_name) as f:
            lines = f.read().decode('utf-8').strip().split('\n')

    print(f"Đã tải thành công: {len(lines)} domains")

except Exception as e:
    print(f"Lỗi tải Tranco: {e}")
    # Thử đọc từ cache local nếu có
    local_cache = os.path.join(DATA_RAW, 'tranco_raw.csv')
    if os.path.exists(local_cache):
        print("Đang khôi phục từ cache local...")
        with open(local_cache, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    else:
        print("Không có cache, bỏ qua whitelist.")
        lines = []

# Bước 3: Parse domains từ CSV
domains = []
for line in lines[:30000]: # Lấy tối đa 30,000 dòng
    parts = line.strip().split(',')
    if len(parts) >= 2:
        domain = parts[1].strip().lower()
        if domain and '.' in domain:
            domains.append(domain)

# Loại bỏ duplicates
domains = list(dict.fromkeys(domains))[:30000]
print(f"Số lượng domain thực tế: {len(domains)}")

# Bước 4: Tạo JSON structure
tranco_data = {
    'version': 'tranco_30k_latest',
    'count': len(domains),
    'domains': domains,
}

# Bước 5: Lưu JSON cho extension
out_file_ext = os.path.join(EXT_DIR, 'tranco_top30k.json')
with open(out_file_ext, 'w') as f:
    json.dump(tranco_data, f, separators=(',', ':'))

size_ext = os.path.getsize(out_file_ext)
print(f"\n✓ Đã cập nhật Whitelist: {out_file_ext}")
print(f"  Dung lượng: {size_ext / 1024:.1f} KB")

print(f"\nBước tiếp theo: Reload Extension để áp dụng Whitelist mới")
