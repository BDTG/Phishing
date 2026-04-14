# ============================================================
# 01_collect_data.py
# Thu thập dữ liệu URL phishing và URL hợp lệ từ nguồn công khai
# ============================================================
# Output: data/combined_dataset.csv  (cột: url, label)
#         label = 1 (phishing) | label = 0 (legitimate)
# ============================================================
# Chạy: python -X utf8 01_collect_data.py
# Thư viện cần: pip install requests pandas tqdm
# ============================================================

import os          # Xử lý đường dẫn file/folder
import io          # Xử lý buffer IO (cho zipfile)
import zipfile     # Giải nén file zip (Tranco dataset)
import requests    # HTTP client để tải dữ liệu từ web
import pandas as pd # Xử lý dataset (DataFrame, CSV)
from tqdm import tqdm # Thanh progress bar khi download

# Đường dẫn thư mục data (cùng thư mục với script này)
DATA_DIR   = os.path.join(os.path.dirname(__file__), 'data')
# Đường dẫn file output CSV
OUT_CSV    = os.path.join(DATA_DIR, 'combined_dataset.csv')
# Số URL mục tiêu cho mỗi class (phishing và legitimate)
TARGET_N   = 10_000

# Tạo thư mục data nếu chưa tồn tại
os.makedirs(DATA_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────
# NGUỒN 1: PhishTank  (phishing URLs, label=1)
# ──────────────────────────────────────────────────────────────
# PhishTank là database công khai chứa các URL phishing đã được xác minh
# URL: http://data.phishtank.com/data/online-valid.csv
PHISHTANK_URL = 'http://data.phishtank.com/data/online-valid.csv'

def fetch_phishtank(n: int) -> pd.DataFrame:
    """
    Tải verified phishing URLs từ PhishTank
    @param n: Số URL tối đa cần lấy
    @return: DataFrame với cột 'url' và 'label'
    """
    print(f"\n[1/3] Tải PhishTank → {PHISHTANK_URL}")
    print("      (Nếu bị block, tải thủ công và đặt vào data/phishtank_raw.csv)")

    # Đường dẫn file cache (lưu để không phải tải lại)
    phish_raw = os.path.join(DATA_DIR, 'phishtank_raw.csv')

    # Kiểm tra xem đã có cache chưa
    if os.path.exists(phish_raw):
        print(f"      Cache tìm thấy: {phish_raw}")
        # Đọc từ cache, chỉ lấy cột 'url', bỏ qua dòng lỗi
        df = pd.read_csv(phish_raw, usecols=['url'], on_bad_lines='skip')
    else:
        # Chưa có cache → tải từ web
        headers = {'User-Agent': 'phishtank/my-project-01'}
        try:
            # Gửi HTTP GET request
            r = requests.get(PHISHTANK_URL, headers=headers, timeout=60)
            r.raise_for_status() # Ném lỗi nếu HTTP status != 200

            # Parse CSV từ response text
            df = pd.read_csv(io.StringIO(r.text), usecols=['url'], on_bad_lines='skip')

            # Lưu cache để lần sau không phải tải lại
            df.to_csv(phish_raw, index=False)
            print(f"      Đã lưu cache → {phish_raw}")
        except Exception as e:
            print(f"      LỖI: {e}")
            print("      Thử dùng fallback OpenPhish...")
            df = fetch_openphish_fallback() # Fallback sang nguồn khác

    # Xử lý data: đổi tên cột, loại bỏ NaN, strip whitespace
    df = df.rename(columns={'url': 'url'}).dropna()
    df['url']   = df['url'].astype(str).str.strip() # Chuyển sang string, bỏ khoảng trắng
    df['label'] = 1 # Gán label = 1 (phishing)
    # Chỉ giữ URLs bắt đầu bằng http (bỏ ftp, mailto, v.v.)
    df = df[df['url'].str.startswith('http')].drop_duplicates('url')

    print(f"      {len(df):,} phishing URLs → lấy {min(n, len(df)):,}")
    return df.head(n)[['url', 'label']] # Trả về n URLs đầu tiên


def fetch_openphish_fallback() -> pd.DataFrame:
    """
    Fallback: OpenPhish feed (không cần đăng ký)
    OpenPhish là nguồn phishing URLs khác, đơn giản hơn PhishTank
    @return: DataFrame với cột 'url'
    """
    # Tải feed từ OpenPhish
    r = requests.get('https://openphish.com/feed.txt', timeout=30)
    # Mỗi dòng là 1 URL, lọc bỏ dòng trống và dòng không bắt đầu bằng http
    urls = [u.strip() for u in r.text.splitlines() if u.strip().startswith('http')]
    return pd.DataFrame({'url': urls})


# ──────────────────────────────────────────────────────────────
# NGUỒN 2: Tranco Top 1M  (legitimate domains, label=0)
# ──────────────────────────────────────────────────────────────
# Tranco là bảng xếp hạng domain phổ biến nhất thế giới
# URL: https://tranco-list.eu/top-1m.csv.zip
TRANCO_URL = 'https://tranco-list.eu/top-1m.csv.zip'

def fetch_tranco(n: int) -> pd.DataFrame:
    """
    Tải Tranco Top 1M → lấy n domain hàng đầu
    @param n: Số domain tối đa cần lấy
    @return: DataFrame với cột 'url' và 'label'
    """
    print(f"\n[2/3] Tải Tranco Top 1M → {TRANCO_URL}")
    tranco_raw = os.path.join(DATA_DIR, 'tranco_raw.csv')

    # Kiểm tra cache
    if os.path.exists(tranco_raw):
        print(f"      Cache tìm thấy: {tranco_raw}")
        df = pd.read_csv(tranco_raw, header=None, names=['rank', 'domain'])
    else:
        try:
            # Tải file zip với streaming (không load toàn bộ vào RAM)
            r = requests.get(TRANCO_URL, timeout=120, stream=True)
            r.raise_for_status()
            total = int(r.headers.get('content-length', 0)) # Lấy kích thước file
            buf = io.BytesIO() # Buffer trong RAM

            # Download với progress bar
            with tqdm(total=total, unit='B', unit_scale=True, desc='      Download') as pbar:
                for chunk in r.iter_content(chunk_size=8192):
                    buf.write(chunk)
                    pbar.update(len(chunk))

            buf.seek(0) # Reset buffer về đầu
            # Giải nén zip và đọc CSV
            with zipfile.ZipFile(buf) as z:
                with z.open('top-1m.csv') as f:
                    df = pd.read_csv(f, header=None, names=['rank', 'domain'])

            # Lưu cache
            df.to_csv(tranco_raw, index=False)
            print(f"      Đã lưu cache → {tranco_raw}")
        except Exception as e:
            print(f"      LỖI: {e}")
            raise # Ném lỗi lên trên

    # Chuyển domain → URL (thêm https://)
    df['url'] = 'https://' + df['domain'].astype(str).str.strip()
    df['label'] = 0 # Gán label = 0 (legitimate)
    df = df.dropna().drop_duplicates('url') # Loại bỏ duplicates
    print(f"      {len(df):,} legit URLs → lấy {min(n, len(df)):,}")
    return df.head(n)[['url', 'label']]


# ──────────────────────────────────────────────────────────────
# MAIN — Hàm chính chạy khi execute script
# ──────────────────────────────────────────────────────────────
def main():
    """Hàm chính: Tải dữ liệu từ 2 nguồn, gộp lại, lưu CSV"""
    print("=" * 60)
    print("  Thu thập dữ liệu phishing / legitimate URLs")
    print(f"  Mục tiêu: {TARGET_N:,} mỗi class")
    print("=" * 60)

    # Bước 1: Tải phishing URLs từ PhishTank
    phish_df = fetch_phishtank(TARGET_N)

    # Bước 2: Tải legitimate URLs từ Tranco
    legit_df = fetch_tranco(TARGET_N)

    # Bước 3: Gộp 2 dataset lại
    print(f"\n[3/3] Gộp dataset...")
    # Concat 2 DataFrames
    combined = pd.concat([phish_df, legit_df], ignore_index=True)
    
    # [PHẦN 3]: Loại bỏ trùng lặp nếu có URL bị trùng giữa 2 nguồn hoặc trong cùng 1 nguồn
    combined.drop_duplicates(subset=['url'], inplace=True)
    
    # Xáo trộn ngẫu nhiên (random_state=42 để reproducibility)
    combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)

    # Lưu ra file CSV
    combined.to_csv(OUT_CSV, index=False, encoding='utf-8')
    print(f"\n✓ Đã lưu: {OUT_CSV}")
    print(f"  Tổng: {len(combined):,} URLs (sau khi lọc trùng)")
    print(f"  Phishing (1): {combined['label'].sum():,}")
    print(f"  Legit    (0): {(combined['label'] == 0).sum():,}")
    print(f"\nBước tiếp theo: python -X utf8 02_feature_extraction_v3.py")


# Chạy hàm main khi execute script trực tiếp
if __name__ == '__main__':
    main()
