# ============================================================
# 01a_augment_brand_data.py
# Tạo dữ liệu brand impersonation để augment dataset
# ============================================================
# Output: data/augmented_brand_data.csv
# ============================================================

import os      # Xử lý đường dẫn file/folder
import random  # Random selection cho TLDs
import csv     # Ghi file CSV

# Đường dẫn thư mục data và file output
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
OUT_CSV  = os.path.join(DATA_DIR, 'augmented_brand_data.csv')

# Tạo thư mục data nếu chưa tồn tại
os.makedirs(DATA_DIR, exist_ok=True)

# ──────────────────────────────────────────────────────────────
# BRANDS CONFIG — Danh sách thương hiệu cần augment
# ──────────────────────────────────────────────────────────────
BRANDS = {
    # Fitgirl Repack — trang download game (dễ bị giả mạo nhất)
    'fitgirl': {
        'official': 'fitgirl-repacks.site', # Domain chính thức
        'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'], # Từ khóa nhận diện
        'context': ['repack', 'download', 'game', 'torrent', 'crack'], # Từ ngữ cảnh
    },
    # PayPal — dịch vụ thanh toán
    'paypal': {
        'official': 'paypal.com',
        'keywords': ['paypal'],
        'context': ['login', 'verify', 'secure', 'account', 'payment'],
    },
    # Google — công ty công nghệ
    'google': {
        'official': 'google.com',
        'keywords': ['google'],
        'context': ['login', 'account', 'verify', 'recover', 'drive'],
    },
    # Microsoft — công ty công nghệ
    'microsoft': {
        'official': 'microsoft.com',
        'keywords': ['microsoft'],
        'context': ['login', 'account', 'verify', 'office', '365'],
    },
    # Apple — công ty công nghệ
    'apple': {
        'official': 'apple.com',
        'keywords': ['apple'],
        'context': ['login', 'account', 'verify', 'icloud', 'id'],
    },
    # Facebook — mạng xã hội
    'facebook': {
        'official': 'facebook.com',
        'keywords': ['facebook'],
        'context': ['login', 'account', 'verify', 'security', 'check'],
    },
    # Amazon — thương mại điện tử
    'amazon': {
        'official': 'amazon.com',
        'keywords': ['amazon'],
        'context': ['login', 'account', 'verify', 'order', 'payment'],
    },
    # Vietcombank — ngân hàng
    'vietcombank': {
        'official': 'vietcombank.com.vn',
        'keywords': ['vietcombank'],
        'context': ['login', 'account', 'verify', 'secure', 'banking'],
    },
    # Techcombank — ngân hàng
    'techcombank': {
        'official': 'techcombank.com.vn',
        'keywords': ['techcombank'],
        'context': ['login', 'account', 'verify', 'secure', 'banking'],
    },
    # MoMo — ví điện tử
    'momo': {
        'official': 'momo.vn',
        'keywords': ['momo'],
        'context': ['login', 'verify', 'account', 'wallet', 'payment'],
    },
}

# TLDs phổ thông (dùng cho fake sites — đây là vấn đề chính)
COMMON_TLDS = ['.com', '.org', '.net', '.info', '.biz', '.co', '.io', '.us', '.in', '.to']

# TLDs đáng ngờ (dễ detect — đã có rule-based)
SUSPICIOUS_TLDS = ['.xyz', '.tk', '.pw', '.cc', '.top', '.club', '.online',
                    '.site', '.icu', '.gq', '.ml', '.cf', '.ga', '.vip', '.pro',
                    '.website', '.games']

# ──────────────────────────────────────────────────────────────
# DOMAIN GENERATION PATTERNS
# ──────────────────────────────────────────────────────────────

def generate_typosquat_variations(brand_name, official_domain):
    """
    Tạo biến thể typosquatting (thay đổi ký tự)
    @param brand_name: Tên brand
    @param official_domain: Domain chính thức
    @return: List các domain biến thể
    """
    official_base = official_domain.split('.')[0] # Phần trước dấu chấm đầu tiên
    variations = []

    # Thêm ký tự vào cuối
    for char in 'abcdefghijklmnopqrstuvwxyz0123456789':
        variations.append(official_base + char)
        variations.append(official_base + '-' + char)

    # Xóa ký tự (bỏ 1 ký tự ở giữa)
    for i in range(1, len(official_base)):
        variations.append(official_base[:i] + official_base[i+1:])

    # Thay thế ký tự gần nhau trên bàn phím
    keyboard_adj = {
        'a': 'szq', 'e': 'wrd', 'i': 'uoj', 'o': 'ipl', 's': 'adxw',
        'r': 'eafd', 't': 'rfg', 'y': 'tgh', 'l': 'kop', 'c': 'vxd',
    }
    for i, c in enumerate(official_base):
        if c in keyboard_adj:
            for repl in keyboard_adj[c]:
                variations.append(official_base[:i] + repl + official_base[i+1:])

    # Thêm hyphen vào giữa
    for i in range(1, len(official_base) - 1):
        variations.append(official_base[:i] + '-' + official_base[i:])

    # Nhân đôi ký tự
    for i in range(len(official_base)):
        variations.append(official_base[:i] + official_base[i] + official_base[i:])

    # Loại bỏ duplicates và variants quá ngắn
    return list(set(v for v in variations if len(v) >= 5 and v != official_base))


def generate_brand_impersonation_domains(brand_name, brand_info):
    """
    Tạo tất cả domain giả mạo cho 1 brand
    @param brand_name: Tên brand
    @param brand_info: Dict chứa official, keywords, context
    @return: List các domain giả mạo
    """
    official_domain = brand_info['official']
    official_base = official_domain.split('.')[0]
    domains = []

    # Pattern 1: Typosquatting (thay đổi ký tự)
    typo_variants = generate_typosquat_variations(brand_name, official_domain)
    for variant in typo_variants[:15]: # Lấy 15 cái đầu
        tld = random.choice(COMMON_TLDS + SUSPICIOUS_TLDS)
        domains.append(variant + tld)

    # Pattern 2: Thêm từ khóa phishing
    for kw in brand_info['context']:
        tld = random.choice(COMMON_TLDS + SUSPICIOUS_TLDS)
        domains.append(f'{official_base}-{kw}' + tld) # brand-keyword.tld
        domains.append(f'{kw}-{official_base}' + tld) # keyword-brand.tld
        domains.append(f'{official_base}{kw}' + tld)  # brandkeyword.tld

    # Pattern 3: Thêm từ "secure", "login", "verify"
    for prefix in ['secure', 'login', 'verify', 'update', 'account']:
        tld = random.choice(COMMON_TLDS + SUSPICIOUS_TLDS)
        domains.append(f'{prefix}-{official_base}' + tld)
        domains.append(f'{official_base}-{prefix}' + tld)

    # Pattern 4: Subdomain giả mạo
    tld = random.choice(COMMON_TLDS)
    domains.append(f'www.{official_base}-secure' + tld)
    domains.append(f'login.{official_base}' + tld)
    domains.append(f'secure.{official_base}' + tld)

    # Pattern 5: Thay thế ký tự đặc biệt
    domains.append(official_base.replace('-', '') + '.com') # Bỏ hyphen
    domains.append(official_base + 's.com') # Thêm 's'
    domains.append(official_base + '-official.com') # Thêm '-official'
    domains.append(official_base + '-support.com') # Thêm '-support'

    # Pattern 6: Domain ngắn gọn (dễ nhớ nhầm)
    short_variants = [
        official_base[:6] + '.com', # Cắt 6 ký tự đầu
        official_base[:8] + '.com', # Cắt 8 ký tự đầu
        official_base[:5] + 'x.com', # Cắt 5 ký tự + 'x'
    ]
    domains.extend(short_variants)

    # Loại bỏ duplicates
    return list(set(domains))


def generate_urls_for_domain(domain):
    """
    Tạo URLs từ domain với các path phishing
    @param domain: Domain cần tạo URLs
    @return: List các URLs
    """
    urls = []
    scheme = random.choice(['https://', 'http://']) # Random scheme

    # Danh sách path patterns thường dùng trong phishing
    paths = [
        '/login', '/signin', '/verify', '/account', '/secure',
        '/account/verify', '/login/secure', '/verify/account',
        '/account/update', '/secure/login', '/auth/verify',
        '/password/reset', '/confirm/account', '/payment/verify',
        '/login?session=expired', '/verify?token=abc123',
        '/account/suspended', '/security/check',
        '/wallet/verify', '/banking/login',
    ]

    # Random chọn 2-4 paths
    selected_paths = random.sample(paths, min(random.randint(2, 4), len(paths)))

    for path in selected_paths:
        urls.append(scheme + domain + path)

    return urls


# ──────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────
random.seed(42) # Seed để reproducibility

print("=" * 60)
print("  Tạo dữ liệu brand impersonation")
print("=" * 60)

all_records = [] # List chứa tất cả records

# Duyệt qua từng brand
for brand_name, brand_info in BRANDS.items():
    print(f"\nGenerating for: {brand_name}")

    # Generate domains giả mạo
    domains = generate_brand_impersonation_domains(brand_name, brand_info)

    # Generate URLs từ domains
    urls = []
    for domain in domains:
        urls.extend(generate_urls_for_domain(domain))

    # Giới hạn ~50 URLs mỗi brand
    random.shuffle(urls)
    urls = urls[:50]

    print(f"  Generated {len(urls)} phishing URLs")

    # Thêm vào records
    for url in urls:
        all_records.append({'url': url, 'label': 1}) # label = 1 (phishing)

# Loại bỏ duplicates
seen = set()
unique_records = []
for rec in all_records:
    if rec['url'] not in seen:
        seen.add(rec['url'])
        unique_records.append(rec)

print(f"\nTotal unique augmented URLs: {len(unique_records)}")

# Lưu ra file CSV
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['url', 'label'])
    writer.writeheader()
    writer.writerows(unique_records)

print(f"✓ Saved to: {OUT_CSV}")

# Thống kê theo brand
print(f"\nThống kê theo brand:")
brand_counts = {}
for rec in unique_records:
    for brand_name in BRANDS.keys():
        if any(kw in rec['url'].lower() for kw in BRANDS[brand_name]['keywords']):
            brand_counts[brand_name] = brand_counts.get(brand_name, 0) + 1
            break

for brand, count in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {brand:15s}  {count:3d} URLs")

print(f"\nBước tiếp theo: Gộp với combined_dataset.csv và chạy feature extraction")
