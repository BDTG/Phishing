"""
test_v2_brand_impersonation.py
Test extension sau khi update Brand Impersonation Detection
"""

import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

# =====================================================
# LOAD MODEL
# =====================================================

MODEL_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_tuned.json'
with open(MODEL_PATH) as f:
    model = json.load(f)

trees = model['learner']['gradient_booster']['model']['trees']

SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online',
             '.site','.icu','.gq','.ml','.cf','.ga','.vip','.pro',
             '.website','.games'}

PHISHING_KW = ['login','verify','account','update','secure','banking',
               'confirm','password','credential','wallet','payment',
               'webscr','ebayisapi','signin']

BRAND_KW = ['paypal','google','amazon','apple','microsoft','facebook','netflix',
            'instagram','twitter','linkedin','youtube','chase','wellsfargo',
            'bankofamerica','citibank']

LOGIN_KW = ['signin','logon','authenticate','login','log-in','sign-in']

# =====================================================
# BRAND IMPERSONATION CONFIG (giống extension)
# =====================================================

BRANDS_CONFIG = {
    'paypal': {
        'officialDomains': ['paypal.com', 'www.paypal.com'],
        'keywords': ['paypal'],
    },
    'google': {
        'officialDomains': ['google.com', 'www.google.com', 'google.com.vn'],
        'keywords': ['google'],
    },
    'microsoft': {
        'officialDomains': ['microsoft.com', 'www.microsoft.com'],
        'keywords': ['microsoft'],
    },
    'apple': {
        'officialDomains': ['apple.com', 'www.apple.com'],
        'keywords': ['apple'],
    },
    'facebook': {
        'officialDomains': ['facebook.com', 'www.facebook.com'],
        'keywords': ['facebook'],
    },
    'amazon': {
        'officialDomains': ['amazon.com', 'www.amazon.com'],
        'keywords': ['amazon'],
    },
    'fitgirl': {
        'officialDomains': ['fitgirl-repacks.site', 'www.fitgirl-repacks.site'],
        'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
    },
}

# SAFE_DOMAINS = official domains từ BRANDS_CONFIG + các domain khác
SAFE_DOMAINS = set()
for brand_info in BRANDS_CONFIG.values():
    for domain in brand_info['officialDomains']:
        SAFE_DOMAINS.add(domain.lower().replace('www.', ''))

# Thêm các domain an toàn khác
SAFE_DOMAINS.update([
    'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
    'apple.com', 'netflix.com', 'youtube.com', 'instagram.com',
    'twitter.com', 'linkedin.com', 'paypal.com', 'github.com',
    'wikipedia.org', 'yahoo.com', 'reddit.com', 'claude.ai',
    'fitgirl-repacks.site',
])

# =====================================================
# FEATURE EXTRACTION
# =====================================================

def entropy(s):
    if not s: return 0.0
    freq = Counter(s); n=len(s)
    return -sum((c/n)*math.log2(c/n) for c in freq.values())

def extract_features(urlStr):
    p = urllib.parse.urlparse(urlStr)
    hostname = re.sub(r'^www[0-9]*\.','',p.netloc)
    bare = p.scheme+'://'+hostname
    full_orig = urlStr.lower()
    pure = re.sub(r':\d+$','',hostname)
    parts = pure.split('.')
    tld = '.'+parts[-1] if parts else ''
    susp = int(tld.lower() in SUSP_TLDS)
    digits = sum(c.isdigit() for c in bare)
    letters = sum(c.isalpha() for c in bare)
    return [
        len(bare), bare.count('.'), bare.count('-'), bare.count('_'), bare.count('/'),
        sum(1 for c in bare if not re.match(r'[a-zA-Z0-9\-._~:/?#\[\]@!\$&()*+,;=%]',c)),
        digits/len(bare) if bare else 0, letters/len(bare) if bare else 0,
        1 if (p.port and str(p.port) not in ('80','443')) else 0,
        round(entropy(bare),4),
        len(pure), max(len(parts)-2,0),
        1 if re.match(r'^\d{1,3}(\.\d{1,3}){3}$',pure) else 0,
        1 if '@' in urlStr else 0, 0, susp, 1 if '-' in pure else 0, max(len(parts)-2,0),
        0,0,0,0,0,0,0,
        1 if any(kw in full_orig for kw in PHISHING_KW) else 0,
        1 if any(kw in full_orig for kw in BRAND_KW) else 0,
        1 if p.scheme=='https' else 0,
        1 if any(kw in full_orig for kw in LOGIN_KW) else 0, susp,
    ]

def traverse_tree(tree, feat):
    lc=tree['left_children']; rc=tree['right_children']
    si=tree['split_indices']; sc=tree['split_conditions']; bw=tree['base_weights']
    node=0
    while lc[node]!=-1:
        node=lc[node] if feat[si[node]]<sc[node] else rc[node]
    return bw[node]

def sigmoid(x):
    return 1/(1+math.exp(-x))

# =====================================================
# BRAND IMPERSONATION DETECTION (giống extension)
# =====================================================

def levenshtein_distance(a, b):
    matrix = []
    for i in range(len(b) + 1): matrix.append([i] * (len(a) + 1))
    for j in range(len(a) + 1): matrix[0][j] = j
    for i in range(1, len(b) + 1):
        for j in range(1, len(a) + 1):
            if b[i-1] == a[j-1]:
                matrix[i][j] = matrix[i-1][j-1]
            else:
                matrix[i][j] = min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1)
    return matrix[len(b)][len(a)]

def is_typosquatting(hostname, official_domain):
    host_base = hostname.split('.')[0]
    official_base = official_domain.split('.')[0]
    if len(host_base) < 5 or len(official_base) < 5:
        return False
    distance = levenshtein_distance(host_base, official_base)
    return distance <= 2 and host_base != official_base

def check_brand_impersonation(url):
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
    except:
        return False, 0, ''

    for brand_name, brand_info in BRANDS_CONFIG.items():
        brand_in_hostname = any(kw.lower() in hostname for kw in brand_info['keywords'])
        if not brand_in_hostname:
            continue

        is_official = any(
            hostname == od.lower().replace('www.', '')
            for od in brand_info['officialDomains']
        )

        if is_official:
            return False, 0.01, 'Official domain'

        # Check typosquatting
        is_typosquatted = any(
            is_typosquatting(hostname, od.lower().replace('www.', ''))
            for od in brand_info['officialDomains']
        )

        if is_typosquatted:
            return True, 0.90, f'Typosquatting "{brand_name}"'

        return True, 0.85, f'Brand impersonation "{brand_name}"'

    return False, 0, ''

# =====================================================
# PREDICT V2 (với brand impersonation)
# =====================================================

def predict_v2(url):
    """Predict phishing probability với brand impersonation detection"""
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
        tld = '.' + hostname.split('.')[-1]
    except:
        return 0, 'Error'

    # Bước 1: Whitelist
    if hostname in SAFE_DOMAINS:
        return 0.01, 'Whitelist'

    # Bước 2: Brand impersonation check
    is_impersonation, brand_prob, brand_reason = check_brand_impersonation(url)
    if brand_reason == 'Official domain':
        return brand_prob, brand_reason

    # Bước 3: Suspicious TLD
    if tld in SUSP_TLDS:
        full_lower = url.lower()
        has_phish_kw = any(kw in full_lower for kw in PHISHING_KW)
        if has_phish_kw:
            return 0.97, 'Suspicious TLD + keywords'
        if is_impersonation:
            return 0.95, 'Brand + Suspicious TLD'
        return 0.82, 'Suspicious TLD'

    # Bước 4: Brand impersonation với TLD phổ thông
    if is_impersonation:
        return brand_prob, brand_reason

    # Bước 5: ML model
    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    return sigmoid(margin), 'ML model'

# =====================================================
# TEST CASES
# =====================================================

print('\n' + '='*100)
print('PHISHING DETECTOR V2 — BRAND IMPERSONATION TEST')
print('='*100)
print(f'Time: 2026-04-08')
print('='*100)

# Test 1: Official domain
print('\n[TEST 1] OFFICIAL DOMAIN (phải SAFE):')
print('-'*80)
url = 'https://fitgirl-repacks.site/'
prob, reason = predict_v2(url)
status = 'SAFE' if prob < 0.5 else 'PHISHING'
print(f'  {url}')
print(f'  Score: {prob*100:.1f}% -> {status} ({reason})')
print(f'  Result: {"PASS" if prob < 0.5 else "FAIL"}')

# Test 2: Fake Fitgirl sites
print('\n[TEST 2] FAKE FITGIRL SITES (phải PHISHING):')
print('-'*80)

fake_sites = [
    'https://fitgirl-repack.site',
    'https://fitgirl-repack.com',
    'https://fitgirlrepacks.org',
    'https://fitgirl-repacks.website',
    'https://fitgirlrepacks.co',
    'https://fitgirlrepack.games',
    'https://fitgirl.cc',
    'https://fitgirlrepacksite.com',
    'https://fitgirlrepacks.in',
    'https://fitgirl-repacks.cc',
    'https://fitgirl-repacks.to',
    'https://ww9.fitgirl-repacks.xyz',
    'https://fitgirl-repacks.xyz',
    'https://fitgirl-repack.net',
    'https://fitgirlpack.site',
    'https://fitgirl-repack.org',
    'https://fitgirlrepacks.pro',
    'https://fitgirlrepack.games',
    'https://fitgirltorrent.com',
    'https://fitgirl-repacks.vip',
    'https://fitgirlrepackz.com',
    'https://fitgirl-repacks.theproxy.vip',
    'https://fitgirl-repacks.us',
    'https://fitgirl-repacks.in',
]

detected = 0
missed = []

for url in fake_sites:
    prob, reason = predict_v2(url)
    status = 'PHISHING' if prob >= 0.5 else 'SAFE'
    is_phishing = prob >= 0.5

    if is_phishing:
        detected += 1
        print(f'  [OK] {url}')
        print(f'       Score: {prob*100:.1f}% ({reason})')
    else:
        missed.append((url, prob, reason))
        print(f'  [!!] {url}')
        print(f'       Score: {prob*100:.1f}% ({reason})')

# Test 3: Safe URLs
print('\n[TEST 3] SAFE URLS (phải SAFE):')
print('-'*80)

safe_sites = [
    'https://www.google.com',
    'https://www.facebook.com',
    'https://www.amazon.com',
    'https://www.microsoft.com',
    'https://www.apple.com',
    'https://www.paypal.com',
    'https://vietcombank.com.vn',
    'https://techcombank.com.vn',
]

safe_correct = 0
safe_wrong = []

for url in safe_sites:
    prob, reason = predict_v2(url)
    status = 'SAFE' if prob < 0.5 else 'PHISHING'
    is_safe = prob < 0.5

    if is_safe:
        safe_correct += 1
        print(f'  [OK] {url}')
        print(f'       Score: {prob*100:.1f}% ({reason})')
    else:
        safe_wrong.append((url, prob, reason))
        print(f'  [!!] {url}')
        print(f'       Score: {prob*100:.1f}% ({reason})')

# Test 4: Known phishing URLs
print('\n[TEST 4] KNOWN PHISHING URLS (phải PHISHING):')
print('-'*80)

phishing_sites = [
    'http://paypal-verify-account.xyz/login',
    'http://secure-banking-update.tk/verify',
    'http://amazon-account-suspended.cf/login',
    'http://vietcombank-secure.xyz/login',
    'http://momo-verify-account.tk/login',
]

phishing_correct = 0
phishing_wrong = []

for url in phishing_sites:
    prob, reason = predict_v2(url)
    status = 'PHISHING' if prob >= 0.5 else 'SAFE'
    is_phishing = prob >= 0.5

    if is_phishing:
        phishing_correct += 1
        print(f'  [OK] {url}')
        print(f'       Score: {prob*100:.1f}% ({reason})')
    else:
        phishing_wrong.append((url, prob, reason))
        print(f'  [!!] {url}')
        print(f'       Score: {prob*100:.1f}% ({reason})')

# =====================================================
# SUMMARY
# =====================================================

print('\n' + '='*100)
print('TONG KET:')
print('='*100)
print(f'  Official domain (fitgirl-repacks.site): {"PASS" if predict_v2("https://fitgirl-repacks.site/")[0] < 0.5 else "FAIL"}')
print(f'  Fake sites detected: {detected}/{len(fake_sites)} ({detected/len(fake_sites)*100:.1f}%)')
print(f'  Safe sites correct: {safe_correct}/{len(safe_sites)} ({safe_correct/len(safe_sites)*100:.1f}%)')
print(f'  Phishing sites correct: {phishing_correct}/{len(phishing_sites)} ({phishing_correct/len(phishing_sites)*100:.1f}%)')

total_tests = 1 + len(fake_sites) + len(safe_sites) + len(phishing_sites)
total_pass = (1 if predict_v2("https://fitgirl-repacks.site/")[0] < 0.5 else 0) + detected + safe_correct + phishing_correct
print(f'  Total accuracy: {total_pass}/{total_tests} ({total_pass/total_tests*100:.1f}%)')

if missed:
    print('\n' + '!'*80)
    print('CANH BAO: Fake sites bi bo sot!')
    print('!'*80)
    for url, prob, reason in missed:
        print(f'  - {url} (score: {prob*100:.1f}%, reason: {reason})')
else:
    print('\n  => KHONG CO FALSE NEGATIVES CHO FITGIRL!')

if safe_wrong:
    print('\n' + '!'*80)
    print('CANH BAO: Safe sites bi danh dau sai!')
    print('!'*80)
    for url, prob, reason in safe_wrong:
        print(f'  - {url} (score: {prob*100:.1f}%, reason: {reason})')
else:
    print('\n  => KHONG CO FALSE POSITIVES CHO SAFE SITES!')

print('\n' + '='*100 + '\n')
