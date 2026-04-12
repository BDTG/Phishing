"""
test_final_3fixes.py
Test 3 fixes: IP Address, Homograph, URL Encoding
"""

import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

# Load
TRANCO_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\data\tranco_top30k.json'
with open(TRANCO_PATH) as f:
    tranco_set = set(d.lower() for d in json.load(f)['domains'])

MODEL_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_v2.json'
with open(MODEL_PATH) as f:
    model = json.load(f)
trees = model['learner']['gradient_booster']['model']['trees']

SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online',
             '.site','.icu','.gq','.ml','.cf','.ga','.vip','.pro',
             '.website','.games'}
PHISHING_KW = ['login','verify','account','update','secure','banking',
               'confirm','password','credential','wallet','payment','webscr','ebayisapi','signin']

BRANDS_CONFIG = {
    'fitgirl': {'officialDomains': ['fitgirl-repacks.site'], 'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack']},
    'paypal': {'officialDomains': ['paypal.com'], 'keywords': ['paypal']},
    'google': {'officialDomains': ['google.com', 'google.com.vn'], 'keywords': ['google']},
    'microsoft': {'officialDomains': ['microsoft.com'], 'keywords': ['microsoft']},
    'apple': {'officialDomains': ['apple.com'], 'keywords': ['apple']},
    'facebook': {'officialDomains': ['facebook.com'], 'keywords': ['facebook']},
    'amazon': {'officialDomains': ['amazon.com'], 'keywords': ['amazon']},
    'netflix': {'officialDomains': ['netflix.com'], 'keywords': ['netflix']},
    'instagram': {'officialDomains': ['instagram.com'], 'keywords': ['instagram']},
    'twitter': {'officialDomains': ['twitter.com', 'x.com'], 'keywords': ['twitter']},
    'linkedin': {'officialDomains': ['linkedin.com'], 'keywords': ['linkedin']},
    'vietcombank': {'officialDomains': ['vietcombank.com.vn'], 'keywords': ['vietcombank']},
    'techcombank': {'officialDomains': ['techcombank.com.vn'], 'keywords': ['techcombank']},
    'mbbank': {'officialDomains': ['mbbank.com.vn'], 'keywords': ['mbbank']},
    'momo': {'officialDomains': ['momo.vn'], 'keywords': ['momo']},
}

SAFE_DOMAINS = set()
for bi in BRANDS_CONFIG.values():
    for d in bi['officialDomains']:
        SAFE_DOMAINS.add(d.lower().replace('www.', ''))
SAFE_DOMAINS.update(['google.com','facebook.com','paypal.com','microsoft.com','apple.com',
                      'amazon.com','netflix.com','youtube.com','instagram.com','twitter.com',
                      'x.com','linkedin.com','github.com','wikipedia.org','yahoo.com',
                      'bing.com','reddit.com','claude.ai','fitgirl-repacks.site'])

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

def is_ip_address(hostname):
    return bool(re.match(r'^\d{1,3}(\.\d{1,3}){3}$', hostname))

def is_private_or_local_ip(hostname):
    return bool(re.match(r'^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)', hostname)) or hostname == 'localhost'

def check_brand_with_homograph(hostname):
    """Check brand kể cả khi có ký tự Unicode tương tự"""
    # Normalize Unicode → ASCII equivalents cho brand matching
    normalized = hostname
    # Thay thế các ký tự Cyrillic tương tự Latin
    char_map = {
        '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p',
        '\u0441': 'c', '\u0443': 'y', '\u0445': 'x', '\u0456': 'i',
        '\u0458': 'j', '\u04BB': 'h', '\u043B': 'l',  # л → l
        '\u0410': 'A', '\u0412': 'B', '\u0415': 'E', '\u041A': 'K',
        '\u041C': 'M', '\u041D': 'H', '\u041E': 'O', '\u0420': 'P',
        '\u0421': 'C', '\u0422': 'T', '\u0425': 'X',
    }
    for cyrillic, latin in char_map.items():
        normalized = normalized.replace(cyrillic, latin)

    for bn, bi in BRANDS_CONFIG.items():
        if any(kw in normalized for kw in bi['keywords']):
            return True
    return False

def is_homograph_suspicious(hostname):
    return not bool(re.match(r'^[a-zA-Z0-9.-]+$', hostname))

def safe_decode_url(urlStr):
    decoded = urlStr
    for _ in range(3):
        try:
            next_dec = urllib.parse.unquote(decoded)
            if next_dec == decoded: break
            decoded = next_dec
        except: break
    return decoded

def extract_features(urlStr):
    urlStr = safe_decode_url(urlStr)
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
    features = [
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
        1 if any(kw in full_orig for kw in ['fitgirl','paypal','google','amazon','apple','microsoft','facebook','netflix','instagram','twitter','linkedin']) else 0,
        1 if p.scheme=='https' else 0,
        1 if any(kw in full_orig for kw in ['signin','logon','authenticate','login']) else 0, susp,
    ]
    all_brand_kws = []
    for bi in BRANDS_CONFIG.values(): all_brand_kws.extend(bi['keywords'])
    brand_in_domain = 1 if any(kw in hostname for kw in all_brand_kws) else 0
    is_official = False
    for bi in BRANDS_CONFIG.values():
        for od in bi['officialDomains']:
            if hostname == od.lower().replace('www.', ''): is_official = True; break
    is_official_domain = 1 if is_official else 0
    is_impersonation = False
    for bn, bi in BRANDS_CONFIG.items():
        if not any(kw in hostname for kw in bi['keywords']): continue
        is_off = any(hostname == od.lower().replace('www.', '') for od in bi['officialDomains'])
        if not is_off: is_impersonation = True; break
    is_brand_impersonation = 1 if is_impersonation else 0
    host_base = pure.split('.')[0]
    min_dist = 999
    if len(host_base) >= 5:
        for bi in BRANDS_CONFIG.values():
            for od in bi['officialDomains']:
                ob = od.lower().replace('www.', '').split('.')[0]
                if len(ob) >= 5: min_dist = min(min_dist, levenshtein_distance(host_base, ob))
    min_levenshtein = min_dist if min_dist < 999 else 0
    is_typosquatting = 1 if (min_dist <= 2 and min_dist > 0) else 0
    brand_count = sum(1 for kw in all_brand_kws if kw in hostname)
    brand_mismatch_score = min(brand_count, 5)
    has_phish_kw = any(kw in full_orig for kw in PHISHING_KW)
    has_phishing_keywords_enhanced = 1 if (has_phish_kw or is_impersonation) else 0
    susp_score = 0
    if susp: susp_score += 3
    if is_impersonation: susp_score += 4
    if min_dist <= 2 and min_dist > 0: susp_score += 3
    if has_phish_kw: susp_score += 2
    if brand_count > 0: susp_score += brand_count
    combined_suspicious_score = min(susp_score, 15)
    features.extend([brand_in_domain, is_official_domain, is_brand_impersonation,
                     min_levenshtein, is_typosquatting, brand_mismatch_score,
                     has_phishing_keywords_enhanced, combined_suspicious_score])
    return features

def traverse_tree(tree, feat):
    lc=tree['left_children']; rc=tree['right_children']
    si=tree['split_indices']; sc=tree['split_conditions']; bw=tree['base_weights']
    node=0
    while lc[node]!=-1:
        node=lc[node] if feat[si[node]]<sc[node] else rc[node]
    return bw[node]

def sigmoid(x):
    return 1/(1+math.exp(-x))

def check_brand(url):
    url = safe_decode_url(url)
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
    except:
        return False, 0, ''
    for bn, bi in BRANDS_CONFIG.items():
        if any(kw in hostname for kw in bi['keywords']):
            if any(hostname == od.lower().replace('www.', '') for od in bi['officialDomains']):
                return False, 0.01, 'Official'
            for od in bi['officialDomains']:
                ob = od.lower().replace('www.', '').split('.')[0]
                if len(hostname.split('.')[0]) >= 4 and len(ob) >= 4:
                    d = levenshtein_distance(hostname.split('.')[0], ob)
                    if 1 <= d <= 3:
                        return True, 0.90 if d <= 2 else 0.85, f'Typosquatting "{bn}"'
            return True, 0.85, f'Brand impersonation "{bn}"'
    host_base = hostname.split('.')[0]
    if len(host_base) >= 4:
        for bn, bi in BRANDS_CONFIG.items():
            for od in bi['officialDomains']:
                ob = od.lower().replace('www.', '').split('.')[0]
                if hostname == od.lower().replace('www.', ''): continue
                if len(ob) >= 4:
                    d = levenshtein_distance(host_base, ob)
                    if 1 <= d <= 3:
                        return True, 0.90 if d <= 2 else 0.85, f'Typosquatting "{bn}" (d={d})'
    return False, 0, ''

def predict(url):
    url = safe_decode_url(url)
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
        tld = '.' + hostname.split('.')[-1]
    except:
        return 0, 'safe', 'URL không hợp lệ'

    # Layer 0: Localhost / IP Address
    if hostname == 'localhost':
        return 0.01, 'safe', 'Mạng nội bộ / Localhost'
    if is_ip_address(hostname):
        if is_private_or_local_ip(hostname):
            return 0.01, 'safe', 'Mạng nội bộ / Localhost'

    # Layer 0b: Homograph
    if is_homograph_suspicious(hostname):
        # Check brand với Unicode normalization
        has_brand = check_brand_with_homograph(hostname)
        if has_brand:
            return 0.95, 'block', 'Ký tự không phải Latin nghi ngờ giả mạo'
        return 0.70, 'warning', 'Domain chứa ký tự đặc biệt không thuộc Latin'

    # Layer 1: Whitelist
    if hostname in SAFE_DOMAINS:
        return 0.01, 'safe', 'Whitelist'

    # Layer 1b: Tranco Top 30K
    if hostname in tranco_set:
        return 0.05, 'safe', 'Tranco Top 30K'

    # Layer 2: Brand impersonation
    is_imp, brand_prob, brand_reason = check_brand(url)
    if brand_reason == 'Official':
        return brand_prob, 'safe', 'Official domain'

    # Layer 3a: Suspicious TLD
    if tld in SUSP_TLDS:
        full_lower = url.lower()
        has_phish_kw = any(kw in full_lower for kw in PHISHING_KW)
        if has_phish_kw:
            return 0.97, 'block', 'TLD đáng ngờ + từ khóa phishing'
        if is_imp:
            return 0.95, 'block', 'Giả mạo thương hiệu + TLD đáng ngờ'
        return 0.82, 'block', 'TLD đáng ngờ'

    # Layer 3b: Brand impersonation với TLD phổ thông
    if is_imp:
        return brand_prob, 'block', brand_reason

    # Layer 3c: ML Model
    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    prob = sigmoid(margin)

    # POST-PROCESS: Public IP heuristic
    is_public_ip = is_ip_address(hostname) and not is_private_or_local_ip(hostname)
    if is_public_ip:
        if prob >= 0.85:
            return 0.75, 'warning', 'IP công cộng có dấu hiệu bất thường (đã hạ bậc)'
        elif prob >= 0.40:  # Hạ threshold từ 0.60 → 0.40
            return 0.55, 'warning', 'IP công cộng có dấu hiệu bất thường'
        else:
            return prob, 'safe', 'ML safe'

    if prob >= 0.85:
        return prob, 'block', 'ML high risk'
    elif prob >= 0.60:
        return prob, 'warning', 'ML suspicious'
    else:
        return prob, 'safe', 'ML safe'

# =====================================================
# TEST — 3 FIXES
# =====================================================

print('\n' + '='*115)
print('TEST 3 FIXES: IP Address + Homograph + URL Encoding')
print('='*115)

test_cases = [
    # FIX 1: IP Address
    ('http://192.168.1.1/login', 'safe', 'Private IP'),
    ('http://10.0.0.1/admin', 'safe', 'Private IP (10.x)'),
    ('http://172.16.0.1/login', 'safe', 'Private IP (172.x)'),
    ('http://127.0.0.1/', 'safe', 'Loopback'),
    ('http://localhost/', 'safe', 'Localhost'),
    ('http://1.2.3.4/secure/account/verify', 'warning', 'Public IP (hạ bậc → warning)'),

    # FIX 2: Homograph / IDN
    ('https://paypa\u043b.com/login', 'block', 'Homograph Cyrillic + brand'),
    ('https://g\u00f6\u00f6gle.com/search', 'warning', 'Non-Latin chars (no brand)'),

    # FIX 3: URL Encoding
    ('https://fitgirl-repack.com/%6C%6F%67%69%6E', 'block', 'URL encoded /login'),
    ('https://fitgirl-repack.com/secure%2Faccount', 'block', 'URL encoded path'),

    # Previous tests (sanity check)
    ('https://fitgirl-repacks.site/', 'safe', 'Official'),
    ('https://www.google.com', 'safe', 'Google'),
    ('https://google.com/search?q=test', 'safe', 'Google search'),
    ('https://fitgirl-repack.com', 'block', 'Fake .com'),
    ('https://paypa1.com/login', 'block', 'PayPal typo'),
    ('http://paypal-verify-account.xyz/login', 'block', 'Phishing'),
]

print(f'\n{"URL":55s}  {"Expected":10s}  Score  Tier      Reason')
print('-'*115)

results = {'safe': 0, 'warning': 0, 'block': 0}
correct_count = {'safe': 0, 'warning': 0, 'block': 0}
total_by_expected = {'safe': 0, 'warning': 0, 'block': 0}

for url, expected_tier, description in test_cases:
    prob, actual_tier, reason = predict(url)
    is_correct = (actual_tier == expected_tier)

    total_by_expected[expected_tier] += 1
    results[actual_tier] += 1
    if is_correct:
        correct_count[actual_tier] += 1

    tier_icon = {'safe': '🟢', 'warning': '🟡', 'block': '🔴'}
    mark = 'PASS' if is_correct else 'FAIL'
    reason_short = reason[:40]
    print(f'{url:55s}  {expected_tier:10s}  {prob*100:5.1f}%  {tier_icon.get(actual_tier,"?"):2s}{actual_tier:7s}  {reason_short} [{mark}]')

print('\n' + '='*115)
print('TONG KET:')
print('='*115)

total_all = sum(total_by_expected.values())
correct_all = sum(correct_count.values())
accuracy = (correct_all / total_all * 100) if total_all > 0 else 0

for tier in ['safe', 'warning', 'block']:
    total = total_by_expected[tier]
    corr = correct_count[tier]
    pct = (corr / total * 100) if total > 0 else 0
    icon = '✅' if pct == 100 else '❌'
    print(f'  {icon} {tier.upper():8s}: {corr}/{total} ({pct:.1f}%)')

print(f'\n  OVERALL: {correct_all}/{total_all} ({accuracy:.1f}%)')

if accuracy == 100:
    print('\n🎉 TẤT CẢ TEST CASES ĐỀU PASS!')
else:
    failed = total_all - correct_all
    print(f'\n⚠️  {failed} test cases FAILED')

print('\n' + '='*115 + '\n')
