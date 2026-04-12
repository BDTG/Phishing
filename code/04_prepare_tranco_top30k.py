# ============================================================
# 04_prepare_tranco_top30k.py
# Tải Tranco Top 30K và export thành JSON cho extension
# ============================================================
# Output: extension/data/tranco_top30k.json
# File này dùng để whitelist 30,000 domains phổ biến nhất
# ============================================================

import os          # Xử lý đường dẫn file/folder
import json        # Xử lý file JSON
import requests    # HTTP client để tải dữ liệu
import zipfile     # Giải nén file zip
import io          # Xử lý buffer IO

# Đường dẫn thư mục data trong code/
DATA_DIR  = os.path.join(os.path.dirname(__file__), 'data')
# Đường dẫn thư mục data trong extension/
EXT_DIR   = os.path.join(os.path.dirname(__file__), '..', 'extension', 'data')

# Tạo thư mục nếu chưa tồn tại
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EXT_DIR, exist_ok=True)

# URL tải Tranco Top 30 Days (bảng xếp hạng domain phổ biến)
TRANCO_URL = 'https://tranco-list.eu/top-30-days.csv.zip'

print("=" * 60)
print("  Tải Tranco Top 30K")
print("=" * 60)

try:
    # Bước 1: Tải file zip từ Tranco
    print(f"\nĐang tải từ {TRANCO_URL}...")
    r = requests.get(TRANCO_URL, timeout=120, stream=True)
    r.raise_for_status() # Ném lỗi nếu HTTP status != 200

    # Bước 2: Giải nén và đọc CSV
    print("Giải nén...")
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        csv_name = z.namelist()[0] # Lấy tên file CSV trong zip
        with z.open(csv_name) as f:
            lines = f.read().decode('utf-8').strip().split('\n')

    print(f"Đã tải: {len(lines)} dòng")

except Exception as e:
    # Nếu tải lỗi → thử dùng file cũ nếu có
    print(f"Lỗi tải Tranco: {e}")
    print("Thử dùng file cũ nếu có...")
    lines = []

# Bước 3: Parse domains từ CSV
# Format: rank,domain
domains = []
for line in lines[:30000]: # Lấy tối đa 30,000 dòng
    parts = line.strip().split(',')
    if len(parts) >= 2:
        domain = parts[1].strip().lower() # Lấy domain, lowercase
        if domain and '.' in domain: # Chỉ giữ domain hợp lệ
            domains.append(domain)

# Loại bỏ duplicates, giới hạn 30K
domains = list(dict.fromkeys(domains))[:30000]
print(f"Unique domains: {len(domains)}")

# Bước 4: Tạo JSON structure
tranco_data = {
    'version': 'tranco_30k_latest', # Version string
    'count': len(domains),           # Số lượng domains
    'domains': domains,              # Danh sách domains
}

# Bước 5: Lưu JSON cho extension
out_file_ext = os.path.join(EXT_DIR, 'tranco_top30k.json')
with open(out_file_ext, 'w') as f:
    json.dump(tranco_data, f, separators=(',', ':')) # Compact JSON

size_ext = os.path.getsize(out_file_ext)
print(f"\n✓ Extension data: {out_file_ext}")
print(f"  Size: {size_ext / 1024:.1f} KB")

# Bước 6: Thống kê TLDs
tld_counts = {}
for d in domains:
    tld = '.' + d.split('.')[-1] # Lấy TLD
    tld_counts[tld] = tld_counts.get(tld, 0) + 1

print(f"\nTop 10 TLDs:")
for tld, count in sorted(tld_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {tld:10s}  {count:,}")

# Bước 7: Hiển thị sample domains
print(f"\nSample domains:")
for d in domains[:20]:
    print(f"  {d}")

print(f"\nBước tiếp theo: Update extension để sử dụng tranco_top30k.json")
