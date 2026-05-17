# ============================================================
# 02_feature_extraction.py
# Trích xuất 30 đặc trưng lexical từ URL (không cần internet)
# ============================================================
# Input:  data/combined_dataset.csv  (url, label)
# Output: data/features.csv          (30 features + label)
# ============================================================
# Chạy: python -X utf8 02_feature_extraction.py
# Thư viện: pip install pandas tqdm
# ============================================================

import os          # Xử lý đường dẫn file/folder
import re          # Regular expressions (pattern matching)
import math        # Hàm math.log2() cho entropy
import urllib.parse # Parse URL thành các thành phần
from collections import Counter # Đếm tần suất ký tự (cho entropy)

import pandas as pd # Xử lý dataset
from tqdm import tqdm # Progress bar

# Đường dẫn thư mục data và file input/output
DATA_DIR  = os.path.join(os.path.dirname(__file__), 'data')
IN_CSV    = os.path.join(DATA_DIR, 'combined_dataset.csv')
OUT_CSV   = os.path.join(DATA_DIR, 'features.csv')

# ──────────────────────────────────────────────────────────────
# Danh sách từ khóa (từ Chương 2, mục 2.3)
# ──────────────────────────────────────────────────────────────
# Từ khóa phishing: thường xuất hiện trong URL lừa đảo
PHISHING_KEYWORDS = [
    'login', 'verify', 'account', 'update', 'secure', 'banking',
    'confirm', 'password', 'credential', 'wallet', 'payment',
    'webscr', 'ebayisapi', 'signin',
]

# Từ khóa brand: tên các thương hiệu lớn
BRAND_KEYWORDS = [
    'paypal', 'google', 'amazon', 'apple', 'microsoft', 'facebook',
    'netflix', 'instagram', 'twitter', 'linkedin', 'youtube',
    'chase', 'wellsfargo', 'bankofamerica', 'citibank',
]

# Từ khóa login: biến thể của từ "login"
LOGIN_WORDS  = ['signin', 'logon', 'authenticate', 'login', 'log-in', 'sign-in']

# TLD đáng ngờ: thường dùng cho phishing vì rẻ hoặc miễn phí
SUSPICIOUS_TLDS = {'.xyz', '.tk', '.pw', '.cc', '.top', '.club', '.online',
                   '.site', '.icu', '.gq', '.ml', '.cf', '.ga'}


# ──────────────────────────────────────────────────────────────
# Hàm tính entropy Shannon
# ──────────────────────────────────────────────────────────────
def entropy(s: str) -> float:
    """
    Tính entropy Shannon của string
    Entropy cao = nhiều ký tự đa dạng (ngẫu nhiên) → thường là phishing
    Entropy thấp = ít ký tự đa dạng (có pattern) → thường là legit
    @param s: String cần tính entropy
    @return: Giá trị entropy (float)
    """
    if not s:
        return 0.0
    freq = Counter(s) # Đếm tần suất mỗi ký tự
    n = len(s)
    # Công thức: H = -Σ (p_i * log2(p_i))
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


# ──────────────────────────────────────────────────────────────
# Hàm trích xuất 30 đặc trưng cho 1 URL
# ──────────────────────────────────────────────────────────────
def extract_features(url: str) -> dict:
    """
    Trích xuất 30 đặc trưng lexical từ URL
    @param url: URL string cần trích xuất
    @return: Dictionary chứa 30 features
    """
    url = str(url).strip()
    feat: dict = {}

    try:
        # Parse URL thành các thành phần
        parsed    = urllib.parse.urlparse(url)
        domain    = parsed.netloc or ''    # Hostname (vd: google.com)
        path      = parsed.path or ''      # Path (vd: /search)
        query     = parsed.query or ''     # Query string (vd: q=test)
        fragment  = parsed.fragment or ''  # Fragment (vd: #section)
        full_url  = url.lower()            # URL lowercase
        domain_lc = re.sub(r':\d+$', '', domain).lower() # Domain bỏ port
    except Exception:
        # Trả về vector 0 nếu parse lỗi
        return {k: 0 for k in [
            'url_length','num_dots','num_hyphens','num_underscores','num_slashes',
            'num_special_chars','digit_ratio','letter_ratio','has_port','url_entropy',
            'domain_length','num_subdomains','has_ip_address','has_at_symbol',
            'has_double_slash_redirect','tld_suspicious','has_hyphen_in_domain',
            'subdomain_depth','path_length','num_query_params','has_fragment',
            'path_depth','has_hex_encoding','num_digits_in_path','path_entropy',
            'has_phishing_keywords','has_brand_keywords','has_https',
            'has_login_words','suspicious_tld',
        ]}

    # ── Nhóm 1: URL cơ bản (10 đặc trưng) ─────────────────────
    feat['url_length']      = len(url) # Độ dài toàn bộ URL
    feat['num_dots']        = url.count('.') # Số dấu chấm
    feat['num_hyphens']     = url.count('-') # Số dấu gạch ngang
    feat['num_underscores'] = url.count('_') # Số dấu gạch dưới
    feat['num_slashes']     = url.count('/') # Số dấu slash
    # Số ký tự đặc biệt (không thuộc set hợp lệ)
    feat['num_special_chars'] = len(re.findall(r'[^a-zA-Z0-9\-._~:/?#\[\]@!$&\'()*+,;=%]', url))
    total_chars             = len(url) if url else 1
    feat['digit_ratio']     = sum(c.isdigit() for c in url) / total_chars # Tỷ lệ chữ số
    feat['letter_ratio']    = sum(c.isalpha() for c in url) / total_chars # Tỷ lệ chữ cái
    feat['has_port']        = 1 if parsed.port and parsed.port not in (80, 443) else 0 # Có port custom?
    feat['url_entropy']     = round(entropy(url), 4) # Entropy Shannon

    # ── Nhóm 2: Domain (8 đặc trưng) ───────────────────────────
    pure_domain = re.sub(r':\d+$', '', domain) # Domain bỏ port
    feat['domain_length']   = len(pure_domain) # Độ dài domain
    parts = pure_domain.split('.')
    feat['num_subdomains']  = max(len(parts) - 2, 0) # Số subdomains
    # Có phải IP address không? (IPv4)
    feat['has_ip_address']  = 1 if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', pure_domain) else 0
    feat['has_at_symbol']   = 1 if '@' in url else 0 # Có ký tự @? (dùng để giấu URL)
    # Double-slash redirect: // sau domain
    feat['has_double_slash_redirect'] = 1 if '//' in path else 0
    # TLD có trong danh sách suspicious không?
    tld = '.' + parts[-1] if parts else ''
    feat['tld_suspicious']  = 1 if tld.lower() in SUSPICIOUS_TLDS else 0
    feat['has_hyphen_in_domain'] = 1 if '-' in pure_domain else 0 # Domain có dấu -?
    feat['subdomain_depth'] = feat['num_subdomains'] # Alias

    # ── Nhóm 3: Path / Query (7 đặc trưng) ─────────────────────
    feat['path_length']     = len(path) # Độ dài path
    feat['num_query_params'] = len(urllib.parse.parse_qs(query)) # Số query params
    feat['has_fragment']    = 1 if fragment else 0 # Có fragment?
    feat['path_depth']      = path.count('/') # Độ sâu path
    feat['has_hex_encoding'] = 1 if '%' in path else 0 # Có hex encoding?
    feat['num_digits_in_path'] = sum(c.isdigit() for c in path) # Số chữ số trong path
    feat['path_entropy']    = round(entropy(path), 4) # Entropy của path

    # ── Nhóm 4: Từ khóa (5 đặc trưng) ──────────────────────────
    # Có từ khóa phishing trong URL?
    feat['has_phishing_keywords'] = 1 if any(kw in full_url for kw in PHISHING_KEYWORDS) else 0
    # Có từ khóa brand trong URL?
    feat['has_brand_keywords'] = 1 if any(kw in full_url for kw in BRAND_KEYWORDS) else 0
    feat['has_https']       = 1 if parsed.scheme == 'https' else 0 # Dùng HTTPS?
    # Có từ khóa login trong URL?
    feat['has_login_words'] = 1 if any(kw in full_url for kw in LOGIN_WORDS) else 0
    feat['suspicious_tld']  = feat['tld_suspicious'] # Alias

    return feat


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────
def main():
    """Hàm chính: Đọc CSV → trích xuất features → lưu CSV mới"""
    print("=" * 60)
    print("  Trích xuất 30 đặc trưng lexical từ URL")
    print("=" * 60)

    # Kiểm tra file input có tồn tại không
    if not os.path.exists(IN_CSV):
        print(f"LỖI: Không tìm thấy {IN_CSV}")
        print("Hãy chạy 01_collect_data.py trước!")
        return

    # Đọc dataset
    df = pd.read_csv(IN_CSV)
    print(f"Đã load: {len(df):,} URLs ({df['label'].sum():,} phishing, "
          f"{(df['label']==0).sum():,} legit)")

    # Trích xuất features cho từng URL
    print("\nĐang trích xuất đặc trưng...")
    records = []
    for _, row in tqdm(df.iterrows(), total=len(df), unit='url'):
        feat = extract_features(row['url']) # Trích xuất 30 features
        feat['label'] = row['label'] # Thêm label
        records.append(feat)

    # Chuyển thành DataFrame
    feat_df = pd.DataFrame(records)

    # Kiểm tra
    n_features = feat_df.shape[1] - 1 # Trừ cột label
    print(f"\nSố đặc trưng: {n_features}")
    print(f"Shape: {feat_df.shape}")
    print(f"NaN count:\n{feat_df.isnull().sum().sum()} tổng NaN")

    # Lưu ra file CSV
    feat_df.to_csv(OUT_CSV, index=False, encoding='utf-8')
    print(f"\n✓ Đã lưu: {OUT_CSV}")
    print(f"\nPreview 5 dòng đầu:")
    print(feat_df.head().to_string())
    print(f"\nBước tiếp theo: Mở 03_eda_and_model.ipynb trong Jupyter")


if __name__ == '__main__':
    main()
