# ============================================================
# 02_feature_extraction_v2.py
# Trích xuất 38 đặc trưng (30 cũ + 8 mới cho brand impersonation)
# ============================================================
# Input:  data/combined_dataset_v2.csv  (url, label)
# Output: data/features_v3.csv          (38 features + label)
# ============================================================

import os          # Xử lý đường dẫn file/folder
import re          # Regular expressions
import math        # Hàm math.log2() cho entropy
import urllib.parse # Parse URL
from collections import Counter # Đếm tần suất ký tự

import pandas as pd # Xử lý dataset
from tqdm import tqdm # Progress bar

# Đường dẫn thư mục data và file input/output
DATA_DIR  = os.path.join(os.path.dirname(__file__), 'data')
IN_CSV    = os.path.join(DATA_DIR, 'combined_dataset_v2.csv')
OUT_CSV   = os.path.join(DATA_DIR, 'features_v2.csv')

# ──────────────────────────────────────────────────────────────
# Keywords (30 features cũ)
# ──────────────────────────────────────────────────────────────
PHISHING_KEYWORDS = [
    'login', 'verify', 'account', 'update', 'secure', 'banking',
    'confirm', 'password', 'credential', 'wallet', 'payment',
    'webscr', 'ebayisapi', 'signin',
]
BRAND_KEYWORDS = [
    'paypal', 'google', 'amazon', 'apple', 'microsoft', 'facebook',
    'netflix', 'instagram', 'twitter', 'linkedin', 'youtube',
    'chase', 'wellsfargo', 'bankofamerica', 'citibank',
]
LOGIN_WORDS  = ['signin', 'logon', 'authenticate', 'login', 'log-in', 'sign-in']
SUSPICIOUS_TLDS = {'.xyz', '.tk', '.pw', '.cc', '.top', '.club', '.online',
                   '.site', '.icu', '.gq', '.ml', '.cf', '.ga'}

# ──────────────────────────────────────────────────────────────
# BRAND CONFIG (cho 8 features mới)
# ──────────────────────────────────────────────────────────────
BRANDS_TO_PROTECT = {
    'fitgirl': {
        'official_domains': ['fitgirl-repacks.site'],
        'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
    },
    'paypal': {
        'official_domains': ['paypal.com'],
        'keywords': ['paypal'],
    },
    'google': {
        'official_domains': ['google.com', 'google.com.vn'],
        'keywords': ['google'],
    },
    'microsoft': {
        'official_domains': ['microsoft.com'],
        'keywords': ['microsoft'],
    },
    'apple': {
        'official_domains': ['apple.com'],
        'keywords': ['apple'],
    },
    'facebook': {
        'official_domains': ['facebook.com'],
        'keywords': ['facebook'],
    },
    'amazon': {
        'official_domains': ['amazon.com'],
        'keywords': ['amazon'],
    },
}

# ──────────────────────────────────────────────────────────────
# Hàm tính khoảng cách Levenshtein
# ──────────────────────────────────────────────────────────────
def levenshtein_distance(a, b):
    """
    Tính khoảng cách Levenshtein giữa 2 string
    @param a: String thứ nhất
    @param b: String thứ hai
    @return: Số lần insert/delete/replace để biến a thành b
    """
    if len(a) < len(b): return levenshtein_distance(b, a)
    if len(b) == 0: return len(a)
    prev_row = range(len(b) + 1)
    for i, c1 in enumerate(a):
        curr_row = [i + 1]
        for j, c2 in enumerate(b):
            curr_row.append(min(prev_row[j+1]+1, curr_row[j]+1, prev_row[j]+(c1!=b[j])))
        prev_row = curr_row
    return prev_row[-1]


# ──────────────────────────────────────────────────────────────
# Hàm tính entropy Shannon
# ──────────────────────────────────────────────────────────────
def entropy(s: str) -> float:
    """
    Tính entropy Shannon của string
    @param s: String cần tính
    @return: Giá trị entropy (float)
    """
    if not s: return 0.0
    freq = Counter(s); n = len(s)
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


# ──────────────────────────────────────────────────────────────
# Hàm trích xuất 38 đặc trưng cho 1 URL
# ──────────────────────────────────────────────────────────────
def extract_features_v2(url: str) -> dict:
    """
    Trích xuất 38 đặc trưng từ URL (30 cũ + 8 mới)
    @param url: URL string cần trích xuất
    @return: Dictionary chứa 38 features
    """
    url = str(url).strip()
    feat: dict = {}

    try:
        parsed    = urllib.parse.urlparse(url)
        domain    = parsed.netloc or ''
        path      = parsed.path or ''
        query     = parsed.query or ''
        fragment  = parsed.fragment or ''
        full_url  = url.lower()
        domain_lc = re.sub(r':\d+$', '', domain).lower()
    except Exception:
        return {f'feat_{i}': 0 for i in range(38)}

    # ── 30 FEATURES CŨ ──────────────────────────────────────
    pure_domain = re.sub(r':\d+$', '', domain)
    parts = pure_domain.split('.')
    tld = '.' + parts[-1] if parts else ''
    susp = int(tld.lower() in SUSPICIOUS_TLDS)
    digits = sum(c.isdigit() for c in domain)
    letters = sum(c.isalpha() for c in domain)

    feat['url_length']      = len(url)
    feat['num_dots']        = url.count('.')
    feat['num_hyphens']     = url.count('-')
    feat['num_underscores'] = url.count('_')
    feat['num_slashes']     = url.count('/')
    feat['num_special_chars'] = len(re.findall(r'[^a-zA-Z0-9\-._~:/?#\[\]@!$&\'()*+,;=%]', url))
    total_chars = len(url) if url else 1
    feat['digit_ratio']     = sum(c.isdigit() for c in url) / total_chars
    feat['letter_ratio']    = sum(c.isalpha() for c in url) / total_chars
    feat['has_port']        = 1 if parsed.port and parsed.port not in (80, 443) else 0
    feat['url_entropy']     = round(entropy(url), 4)
    feat['domain_length']   = len(pure_domain)
    feat['num_subdomains']  = max(len(parts) - 2, 0)
    feat['has_ip_address']  = 1 if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', pure_domain) else 0
    feat['has_at_symbol']   = 1 if '@' in url else 0
    feat['has_double_slash_redirect'] = 1 if '//' in path else 0
    feat['tld_suspicious']  = susp
    feat['has_hyphen_in_domain'] = 1 if '-' in pure_domain else 0
    feat['subdomain_depth'] = max(len(parts) - 2, 0)
    feat['path_length']     = len(path)
    feat['num_query_params'] = len(urllib.parse.parse_qs(query))
    feat['has_fragment']    = 1 if fragment else 0
    feat['path_depth']      = path.count('/')
    feat['has_hex_encoding'] = 1 if '%' in path else 0
    feat['num_digits_in_path'] = sum(c.isdigit() for c in path)
    feat['path_entropy']    = round(entropy(path), 4)
    feat['has_phishing_keywords'] = 1 if any(kw in full_url for kw in PHISHING_KEYWORDS) else 0
    feat['has_brand_keywords'] = 1 if any(kw in full_url for kw in BRAND_KEYWORDS) else 0
    feat['has_https']       = 1 if parsed.scheme == 'https' else 0
    feat['has_login_words'] = 1 if any(kw in full_url for kw in LOGIN_WORDS) else 0
    feat['suspicious_tld']  = susp

    # ── 8 FEATURES MỚI: BRAND IMPERSONATION ────────────────

    # Thu thập tất cả brand keywords
    all_brand_kws = []
    for brand_info in BRANDS_TO_PROTECT.values():
        all_brand_kws.extend(brand_info['keywords'])

    # 31: brand_in_domain — domain có chứa tên thương hiệu không?
    feat['brand_in_domain'] = 1 if any(kw in domain_lc for kw in all_brand_kws) else 0

    # 32: is_official_domain — có phải domain chính chủ không?
    is_official = False
    for brand_info in BRANDS_TO_PROTECT.values():
        for od in brand_info['official_domains']:
            if domain_lc == od.lower() or domain_lc == 'www.' + od.lower():
                is_official = True
                break
    feat['is_official_domain'] = 1 if is_official else 0

    # 33: is_brand_impersonation — có brand keyword nhưng không phải official
    is_impersonation = False
    for brand_info in BRANDS_TO_PROTECT.values():
        brand_in_hostname = any(kw in domain_lc for kw in brand_info['keywords'])
        if not brand_in_hostname: continue
        is_off = any(domain_lc == od.lower().replace('www.', '') or
                     domain_lc == 'www.' + od.lower().replace('www.', '')
                     for od in brand_info['official_domains'])
        if brand_in_hostname and not is_off:
            is_impersonation = True
            break
    feat['is_brand_impersonation'] = 1 if is_impersonation else 0

    # 34: min_levenshtein_to_official — khoảng cách Levenshtein nhỏ nhất đến domain chính chủ
    min_dist = 999
    host_base = pure_domain.split('.')[0].lower()
    if len(host_base) >= 5:
        for brand_info in BRANDS_TO_PROTECT.values():
            for od in brand_info['official_domains']:
                official_base = od.lower().replace('www.', '').split('.')[0]
                if len(official_base) >= 5:
                    dist = levenshtein_distance(host_base, official_base)
                    min_dist = min(min_dist, dist)
    feat['min_levenshtein_to_official'] = min_dist if min_dist < 999 else 0

    # 35: is_typosquatting — có gần giống domain chính chủ không? (distance ≤ 2)
    feat['is_typosquatting'] = 1 if (min_dist <= 2 and min_dist > 0) else 0

    # 36: brand_mismatch_score — số lượng brand keywords trong domain
    brand_count = sum(1 for kw in all_brand_kws if kw in domain_lc)
    feat['brand_mismatch_score'] = min(brand_count, 5)  # Cap at 5

    # 37: has_phishing_keywords_enhanced — phishing keywords + brand impersonation
    has_phish_kw = any(kw in full_url for kw in PHISHING_KEYWORDS)
    feat['has_phishing_keywords_enhanced'] = 1 if (has_phish_kw or is_impersonation) else 0

    # 38: combined_suspicious_score — tổ hợp weighted score
    susp_score = 0
    if susp: susp_score += 3
    if is_impersonation: susp_score += 4
    if min_dist <= 2 and min_dist > 0: susp_score += 3
    if has_phish_kw: susp_score += 2
    if brand_count > 0: susp_score += brand_count
    feat['combined_suspicious_score'] = min(susp_score, 15)  # Cap at 15

    return feat


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────
def main():
    """Hàm chính: Đọc CSV → trích xuất 38 features → lưu CSV mới"""
    print("=" * 60)
    print("  Trích xuất 38 đặc trưng (30 cũ + 8 brand impersonation)")
    print("=" * 60)

    if not os.path.exists(IN_CSV):
        print(f"LỖI: Không tìm thấy {IN_CSV}")
        print("Hãy chạy 01_collect_data.py trước!")
        return

    df = pd.read_csv(IN_CSV)
    print(f"Đã load: {len(df):,} URLs ({df['label'].sum():,} phishing, "
          f"{(df['label']==0).sum():,} legit)")

    print("\nĐang trích xuất đặc trưng v2...")
    records = []
    for _, row in tqdm(df.iterrows(), total=len(df), unit='url'):
        feat = extract_features_v2(row['url'])
        feat['label'] = row['label']
        records.append(feat)

    feat_df = pd.DataFrame(records)

    n_features = feat_df.shape[1] - 1
    print(f"\nSố đặc trưng: {n_features}")
    print(f"Shape: {feat_df.shape}")
    print(f"NaN count: {feat_df.isnull().sum().sum()}")

    feat_df.to_csv(OUT_CSV, index=False, encoding='utf-8')
    print(f"\n✓ Đã lưu: {OUT_CSV}")
    print(f"\nPreview 5 dòng đầu:")
    print(feat_df.head().to_string())

    # Thống kê features mới
    print(f"\nThống kê 8 features mới:")
    new_feats = ['brand_in_domain', 'is_official_domain', 'is_brand_impersonation',
                 'min_levenshtein_to_official', 'is_typosquatting', 'brand_mismatch_score',
                 'has_phishing_keywords_enhanced', 'combined_suspicious_score']
    for f in new_feats:
        if f in feat_df.columns:
            print(f"  {f:35s}  mean={feat_df[f].mean():.4f}  sum={feat_df[f].sum():.0f}")

    print(f"\nBước tiếp theo: Mở 03_eda_and_model.ipynb hoặc chạy retrain script")


if __name__ == '__main__':
    main()
