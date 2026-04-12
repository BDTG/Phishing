"""
test_3tier_tranco.py
Test 3-Tier Threshold + Tranco Top 30K implementation
"""

import sys, json, math, re, urllib.parse, os
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

# Load model
MODEL_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_v2.json'
with open(MODEL_PATH) as f:
    model = json.load(f)
trees = model['learner']['gradient_booster']['model']['trees']

# Load Tranco Top 30K
TRANCO_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\data\tranco_top30k.json'
with open(TRANCO_PATH) as f:
    tranco_data = json.load(f)
tranco_set = set(d.lower() for d in tranco_data['domains'])
print(f"Tranco Top 30K loaded: {len(tranco_set)} domains")

SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online',
             '.site','.icu','.gq','.ml','.cf','.ga'}
PHISHING_KW = ['login','verify','account','update','secure','banking',
               'confirm','password','credential','wallet','payment','webscr','ebayisapi','signin']

BRANDS_CONFIG = {
    'fitgirl': {
        'officialDomains': ['fitgirl-repacks.site'],
        'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
    },
}

SAFE_DOMAINS = {'fitgirl-repacks.site', 'google.com', 'facebook.com', 'paypal.com',
                'microsoft.com', 'apple.com', 'amazon.com', 'netflix.com', 'youtube.com'}

# Auto-populate from BRANDS_CONFIG
for brand_info in BRANDS_CONFIG.values():
    for d in brand_info['officialDomains']:
        SAFE_DOMAINS.add(d.lower().replace('www.', ''))

def levenshtein_distance(a, b):
    if len(a) < len(b): return levenshtein_distance(b, a)
    if len(b) == 0: return len(a)
    prev_row = range(len(b) + 1)
    for i, c1 in enumerate(a):
        curr_row = [i + 1]
        for j, c2 in enumerate(b):
            curr_row.append(min(prev_row[j+1]+1, curr_row[j]+1, prev_row[j]+(c1!=b[j])))
        prev_row = curr_row
    return prev_row[-1]

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
        1 if any(kw in full_orig for kw in ['fitgirl']) else 0,
        1 if p.scheme=='https' else 0,
        1 if any(kw in full_orig for kw in ['signin','logon','authenticate','login']) else 0, susp,
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

def check_brand_impersonation(url):
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
    except:
        return False, 0, ''
    for brand_name, brand_info in BRANDS_CONFIG.items():
        brand_in_hostname = any(kw.lower() in hostname for kw in brand_info['keywords'])
        if not brand_in_hostname: continue
        is_official = any(hostname == od.lower().replace('www.', '') for od in brand_info['officialDomains'])
        if is_official:
            return False, 0.01, 'Official domain'
        is_typo = any(levenshtein_distance(hostname.split('.')[0], od.lower().replace('www.', '').split('.')[0]) <= 2
                      for od in brand_info['officialDomains'] if len(hostname.split('.')[0]) >= 5)
        if is_typo:
            return True, 0.90, f'Typosquatting "{brand_name}"'
        return True, 0.85, f'Brand impersonation "{brand_name}"'
    return False, 0, ''

def predict_3tier(url):
    """3-Layer + 3-Tier prediction"""
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
        tld = '.' + hostname.split('.')[-1]
    except:
        return 0, 'safe', 'URL không hợp lệ'

    # Layer 1: Whitelist
    if hostname in SAFE_DOMAINS:
        return 0.01, 'safe', 'Domain an toàn (whitelist)'

    # Layer 1b: Tranco Top 30K
    if hostname in tranco_set:
        return 0.05, 'safe', 'Domain phổ biến (Tranco Top 30K)'

    # Layer 2: Brand impersonation
    is_imp, brand_prob, brand_reason = check_brand_impersonation(url)
    if brand_reason == 'Official domain':
        return brand_prob, 'safe', 'Domain chính chủ'

    # Layer 3a: Suspicious TLD
    if tld in SUSP_TLDS:
        full_lower = url.lower()
        has_phish_kw = any(kw in full_lower for kw in PHISHING_KW)
        if has_phish_kw:
            return 0.97, 'block', 'TLD đáng ngờ + từ khóa phishing'
        if is_imp:
            return 0.95, 'block', f'Giả mạo thương hiệu + TLD đáng ngờ'
        return 0.82, 'block', 'TLD đáng ngờ (thường dùng cho phishing)'

    # Layer 3b: Brand impersonation với TLD phổ thông
    if is_imp:
        return brand_prob, 'block', brand_reason

    # Layer 3c: ML Model
    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    prob = sigmoid(margin)

    if prob >= 0.85:
        return prob, 'block', 'ML model đánh giá rủi ro cao'
    elif prob >= 0.60:
        return prob, 'warning', 'ML model phát hiện dấu hiệu bất thường'
    else:
        return prob, 'safe', 'ML model đánh giá an toàn'

# =====================================================
# TEST
# =====================================================

print('\n' + '='*110)
print('3-TIER + TRANGO TOP 30K — COMPREHENSIVE TEST')
print('='*110)

test_cases = [
    # Group 1: Official domains — phải SAFE
    ('https://fitgirl-repacks.site/', 'safe', 'Official Fitgirl'),
    ('https://www.google.com', 'safe', 'Google official'),
    ('https://www.facebook.com', 'safe', 'Facebook official'),
    ('https://www.paypal.com', 'safe', 'PayPal official'),
    ('https://google.com/search?q=test', 'safe', 'Google with path'),

    # Group 2: Tranco Top 30K — phải SAFE
    ('https://microsoft.com', 'safe', 'Tranco Top 30K'),
    ('https://amazon.com', 'safe', 'Tranco Top 30K'),
    ('https://youtube.com', 'safe', 'Tranco Top 30K'),
    ('https://apple.com', 'safe', 'Tranco Top 30K'),

    # Group 3: Fitgirl fake sites — phải BLOCK/WARNING
    ('https://fitgirl-repack.com', 'block', 'Fake .com'),
    ('https://fitgirlrepacks.org', 'block', 'Fake .org'),
    ('https://fitgirl-repack.net', 'block', 'Fake .net'),
    ('https://fitgirlrepackz.com', 'block', 'Fake typosquatting'),
    ('https://fitgirltorrent.com', 'block', 'Fake torrent'),
    ('https://fitgirl-repacks.xyz', 'block', 'Fake .xyz'),
    ('https://fitgirl-repack.site', 'block', 'Fake .site'),
    ('https://fitgirl-repacks.to', 'block', 'Fake .to'),
    ('https://fitgirlrepacks.in', 'block', 'Fake .in'),

    # Group 4: Known phishing — phải BLOCK
    ('http://paypal-verify-account.xyz/login', 'block', 'PayPal phishing'),
    ('http://secure-banking-update.tk/verify', 'block', 'Banking phishing'),
    ('http://vietcombank-secure.xyz/login', 'block', 'Vietcombank phishing'),
]

print(f'\n{"URL":50s}  {"Expected":8s}  Score  {"Tier":8s}  Reason')
print('-'*110)

results = {'safe': 0, 'warning': 0, 'block': 0}
correct = {'safe': 0, 'warning': 0, 'block': 0}
total_by_expected = {'safe': 0, 'warning': 0, 'block': 0}

for url, expected_tier, description in test_cases:
    prob, actual_tier, reason = predict_3tier(url)
    results[actual_tier] += 1
    total_by_expected[expected_tier] += 1

    is_correct = (actual_tier == expected_tier)
    if is_correct:
        correct[actual_tier] += 1

    tier_icon = {'safe': '🟢', 'warning': '🟡', 'block': '🔴'}
    mark = 'PASS' if is_correct else 'FAIL'
    reason_short = reason[:40]

    print(f'{url:50s}  {expected_tier:8s}  {prob*100:4.1f}%  {tier_icon.get(actual_tier,"?"):2s}{actual_tier:7s}  {reason_short} [{mark}]')

# Summary
print('\n' + '='*110)
print('TONG KET:')
print('='*110)
for tier in ['safe', 'warning', 'block']:
    total = total_by_expected[tier]
    corr = correct[tier]
    pct = (corr / total * 100) if total > 0 else 0
    print(f'  {tier.upper():8s}: {corr}/{total} đúng ({pct:.1f}%)')

total_all = sum(total_by_expected.values())
correct_all = sum(correct.values())
accuracy = (correct_all / total_all * 100) if total_all > 0 else 0
print(f'\n  OVERALL: {correct_all}/{total_all} đúng ({accuracy:.1f}%)')

if correct_all == total_all:
    print('\n  => TẤT CẢ TEST CASES ĐỀU PASS! 🎉')
else:
    print(f'\n  => {total_all - correct_all} test cases FAILED')

print('\n' + '='*110 + '\n')
