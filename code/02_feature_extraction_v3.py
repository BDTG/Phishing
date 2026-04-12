# ============================================================
# 02_feature_extraction_v3.py
# Trích xuất 39 đặc trưng — dùng FULL URL (có path, query, fragment)
# ============================================================
# THAY ĐỔI CHÍNH so với v2:
#  1. Dùng FULL URL (có path, query, fragment) cho feature extraction
#  2. Thêm feature #39: is_bare_domain (1 nếu URL không có path)
#  3. Feature 18-24 (path features) sẽ có giá trị thực thay vì = 0
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
OUT_CSV   = os.path.join(DATA_DIR, 'features_v3.csv')

# ──────────────────────────────────────────────────────────────
# Keywords (giữ nguyên từ v2)
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
# BRAND CONFIG (giữ nguyên từ v2)
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
# Hàm tính khoảng cách Levenshtein (giữ nguyên từ v2)
# ──────────────────────────────────────────────────────────────
def levenshtein_distance(a, b):
    """Tính khoảng cách Levenshtein giữa 2 string"""
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
# Hàm tính entropy Shannon (giữ nguyên từ v2)
# ──────────────────────────────────────────────────────────────
def entropy(s: str) -> float:
    """Tính entropy Shannon của string"""
    if not s: return 0.0
    freq = Counter(s); n = len(s)
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


# ──────────────────────────────────────────────────────────────
# Hàm trích xuất 39 đặc trưng cho 1 URL (FULL URL)
# ──────────────────────────────────────────────────────────────
def extract_features_v3(url: str) -> dict:
    """
    Trích xuất 39 đặc trưng từ FULL URL (có path, query, fragment)
    @param url: URL string cần trích xuất
    @return: Dictionary chứa 39 features
    """
    url = str(url).strip()
    feat: dict = {}

    try:
        parsed    = urllib.parse.urlparse(url)
        domain    = parsed.netloc or ''
        path      = parsed.path or ''      # ← THAY ĐỔI: lấy path thực
        query     = parsed.query or ''     # ← THAY ĐỔI: lấy query thực
        fragment  = parsed.fragment or ''  # ← THAY ĐỔI: lấy fragment thực
        full_url  = url.lower()
        domain_lc = re.sub(r':\d+$', '', domain).lower()
    except Exception:
        return {f'feat_{i}': 0 for i in range(39)}

    # ── GROUP 1: URL cơ bản (10 features) — DÙNG FULL URL ──
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

    # ── GROUP 2: Domain (8 features) ──
    pure_domain = re.sub(r':\d+$', '', domain)
    parts = pure_domain.split('.')
    tld = '.' + parts[-1] if parts else ''
    susp = int(tld.lower() in SUSPICIOUS_TLDS)

    feat['domain_length']   = len(pure_domain)
    feat['num_subdomains']  = max(len(parts) - 2, 0)
    feat['has_ip_address']  = 1 if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', pure_domain) else 0
    feat['has_at_symbol']   = 1 if '@' in url else 0
    feat['has_double_slash_redirect'] = 1 if '//' in path else 0
    feat['tld_suspicious']  = susp
    feat['has_hyphen_in_domain'] = 1 if '-' in pure_domain else 0
    feat['subdomain_depth'] = max(len(parts) - 2, 0)

    # ── GROUP 3: Path/Query (7 features) — GIÁ TRỊ THỰC ──
    feat['path_length']     = len(path)       # ← THAY ĐỔI: giá trị thực
    feat['num_query_params'] = len(urllib.parse.parse_qs(query)) # ← THAY ĐỔI: giá trị thực
    feat['has_fragment']    = 1 if fragment else 0  # ← THAY ĐỔI: giá trị thực
    feat['path_depth']      = path.count('/') # ← THAY ĐỔI: giá trị thực
    feat['has_hex_encoding'] = 1 if '%' in path else 0 # ← THAY ĐỔI: giá trị thực
    feat['num_digits_in_path'] = sum(c.isdigit() for c in path) # ← THAY ĐỔI: giá trị thực
    feat['path_entropy']    = round(entropy(path), 4) # ← THAY ĐỔI: giá trị thực

    # ── GROUP 4: Keywords (5 features) — DÙNG FULL URL ──
    feat['has_phishing_keywords'] = 1 if any(kw in full_url for kw in PHISHING_KEYWORDS) else 0
    feat['has_brand_keywords'] = 1 if any(kw in full_url for kw in BRAND_KEYWORDS) else 0
    feat['has_https']       = 1 if parsed.scheme == 'https' else 0
    feat['has_login_words'] = 1 if any(kw in full_url for kw in LOGIN_WORDS) else 0
    feat['suspicious_tld']  = susp

    # ── GROUP 5: Brand Impersonation (8 features) — giữ nguyên ──
    all_brand_kws = []
    for brand_info in BRANDS_TO_PROTECT.values():
        all_brand_kws.extend(brand_info['keywords'])

    feat['brand_in_domain'] = 1 if any(kw in domain_lc for kw in all_brand_kws) else 0

    is_official = False
    for brand_info in BRANDS_TO_PROTECT.values():
        for od in brand_info['official_domains']:
            if domain_lc == od.lower() or domain_lc == 'www.' + od.lower():
                is_official = True
                break
    feat['is_official_domain'] = 1 if is_official else 0

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
    feat['is_typosquatting'] = 1 if (min_dist <= 2 and min_dist > 0) else 0

    brand_count = sum(1 for kw in all_brand_kws if kw in domain_lc)
    feat['brand_mismatch_score'] = min(brand_count, 5)

    has_phish_kw = any(kw in full_url for kw in PHISHING_KEYWORDS)
    feat['has_phishing_keywords_enhanced'] = 1 if (has_phish_kw or is_impersonation) else 0

    susp_score = 0
    if susp: susp_score += 3
    if is_impersonation: susp_score += 4
    if min_dist <= 2 and min_dist > 0: susp_score += 3
    if has_phish_kw: susp_score += 2
    if brand_count > 0: susp_score += brand_count
    feat['combined_suspicious_score'] = min(susp_score, 15)

    # ── FEATURE MỚI #39: is_bare_domain ──
    # Flag để model biết khi nào không có path → không tin path features
    feat['is_bare_domain'] = 1 if (len(path) == 0 and len(query) == 0 and len(fragment) == 0) else 0

    return feat


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────
def main():
    """Hàm chính: Đọc CSV → trích xuất 39 features → lưu CSV mới"""
    print("=" * 60)
    print("  Trích xuất 39 đặc trưng (FULL URL + is_bare_domain)")
    print("=" * 60)

    if not os.path.exists(IN_CSV):
        print(f"LỖI: Không tìm thấy {IN_CSV}")
        print("Hãy chạy 01_collect_data.py trước!")
        return

    df = pd.read_csv(IN_CSV)
    print(f"Đã load: {len(df):,} URLs ({df['label'].sum():,} phishing, "
          f"{(df['label']==0).sum():,} legit)")

    print("\nĐang trích xuất đặc trưng v3 (FULL URL)...")
    records = []
    for _, row in tqdm(df.iterrows(), total=len(df), unit='url'):
        feat = extract_features_v3(row['url'])
        feat['label'] = row['label']
        records.append(feat)

    feat_df = pd.DataFrame(records)

    n_features = feat_df.shape[1] - 1
    print(f"\nSố đặc trưng: {n_features}")
    print(f"Shape: {feat_df.shape}")
    print(f"NaN count: {feat_df.isnull().sum().sum()}")

    feat_df.to_csv(OUT_CSV, index=False, encoding='utf-8')
    print(f"\n✓ Đã lưu: {OUT_CSV}")

    # Thống kê Path features (trước đây luôn = 0)
    print(f"\n--- Thống kê Path features (trước đây luôn = 0) ---")
    for f in ['path_length', 'path_depth', 'path_entropy', 'num_query_params']:
        if f in feat_df.columns:
            nonzero = (feat_df[f] > 0).sum()
            print(f"  {f:25s}  mean={feat_df[f].mean():.3f}  nonzero={nonzero:,}/{len(feat_df)}")

    print(f"\n--- Thống kê is_bare_domain ---")
    bare = (feat_df['is_bare_domain'] == 1).sum()
    print(f"  bare_domain: {bare:,}/{len(feat_df)} ({bare/len(feat_df)*100:.1f}%)")

    print(f"\n--- Thống kê 8 features brand ---")
    new_feats = ['brand_in_domain', 'is_official_domain', 'is_brand_impersonation',
                 'min_levenshtein_to_official', 'is_typosquatting', 'brand_mismatch_score',
                 'has_phishing_keywords_enhanced', 'combined_suspicious_score']
    for f in new_feats:
        if f in feat_df.columns:
            print(f"  {f:35s}  mean={feat_df[f].mean():.4f}  sum={feat_df[f].sum():.0f}")

    print(f"\nBước tiếp theo: Train Model v4 với features_v3.csv")


if __name__ == '__main__':
    main()
