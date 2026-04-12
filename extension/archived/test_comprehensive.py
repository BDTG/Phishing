"""
test_comprehensive.py
Test mở rộng — 100+ URLs bao gồm edge cases, adversarial, real-world scenarios
"""

import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

# Load Tranco Top 30K
TRANCO_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\data\tranco_top30k.json'
with open(TRANCO_PATH) as f:
    tranco_set = set(d.lower() for d in json.load(f)['domains'])
print(f"Tranco Top 30K: {len(tranco_set)} domains")

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
for brand_info in BRANDS_CONFIG.values():
    for d in brand_info['officialDomains']:
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

def extract_features(urlStr):
    """Extract 38 features cho model v2"""
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

    # 30 features cũ
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

    # 8 features brand impersonation
    all_brand_kws = []
    for bi in BRANDS_CONFIG.values():
        all_brand_kws.extend(bi['keywords'])

    brand_in_domain = 1 if any(kw in hostname for kw in all_brand_kws) else 0

    is_official = False
    for bi in BRANDS_CONFIG.values():
        for od in bi['officialDomains']:
            if hostname == od.lower().replace('www.', '') or hostname == 'www.' + od.lower().replace('www.', ''):
                is_official = True
                break
    is_official_domain = 1 if is_official else 0

    is_impersonation = False
    for bn, bi in BRANDS_CONFIG.items():
        if not any(kw in hostname for kw in bi['keywords']): continue
        is_off = any(hostname == od.lower().replace('www.', '') or hostname == 'www.' + od.lower().replace('www.', '') for od in bi['officialDomains'])
        if not is_off:
            is_impersonation = True
            break
    is_brand_impersonation = 1 if is_impersonation else 0

    host_base = pure.split('.')[0]
    min_dist = 999
    if len(host_base) >= 5:
        for bi in BRANDS_CONFIG.values():
            for od in bi['officialDomains']:
                ob = od.lower().replace('www.', '').split('.')[0]
                if len(ob) >= 5:
                    min_dist = min(min_dist, levenshtein_distance(host_base, ob))
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

def check_brand_with_homograph(hostname):
    """Check brand kể cả khi có ký tự Unicode tương tự"""
    normalized = hostname
    char_map = {
        '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p',
        '\u0441': 'c', '\u0443': 'y', '\u0445': 'x', '\u0456': 'i',
        '\u0458': 'j', '\u04BB': 'h', '\u043B': 'l',
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

def is_ip_address(hostname):
    return bool(re.match(r'^\d{1,3}(\.\d{1,3}){3}$', hostname))

def is_private_or_local_ip(hostname):
    return bool(re.match(r'^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)', hostname)) or hostname == 'localhost'

def is_homograph_suspicious(hostname):
    return not bool(re.match(r'^[a-zA-Z0-9.-]+$', hostname))

def check_brand(url):
    """Check brand impersonation với fuzzy matching"""
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
    except:
        return False, 0, ''

    # Bước 1: Exact keyword match
    for bn, bi in BRANDS_CONFIG.items():
        if any(kw in hostname for kw in bi['keywords']):
            if any(hostname == od.lower().replace('www.', '') for od in bi['officialDomains']):
                return False, 0.01, 'Official'
            # Typosquatting với threshold=3
            for od in bi['officialDomains']:
                ob = od.lower().replace('www.', '').split('.')[0]
                if len(hostname.split('.')[0]) >= 4 and len(ob) >= 4:
                    d = levenshtein_distance(hostname.split('.')[0], ob)
                    if 1 <= d <= 3:
                        return True, 0.90 if d <= 2 else 0.85, f'Typosquatting "{bn}"'
            return True, 0.85, f'Brand impersonation "{bn}"'

    # Bước 2: Fuzzy domain matching
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
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
        tld = '.' + hostname.split('.')[-1]
    except:
        return 0, 'safe', 'Error'

    # Layer 0: Localhost + IP
    if hostname == 'localhost':
        return 0.01, 'safe', 'Mạng nội bộ / Localhost'
    if is_ip_address(hostname):
        if is_private_or_local_ip(hostname):
            return 0.01, 'safe', 'Mạng nội bộ / Localhost'

    # Homograph
    if is_homograph_suspicious(hostname):
        if check_brand_with_homograph(hostname):
            return 0.95, 'block', 'Homograph attack'
        return 0.70, 'warning', 'Non-Latin chars'

    if hostname in SAFE_DOMAINS:
        return 0.01, 'safe', 'Whitelist'
    if hostname in tranco_set:
        return 0.05, 'safe', 'Tranco Top 30K'
    is_imp, bp, br = check_brand(url)
    if br == 'Official':
        return bp, 'safe', 'Official domain'
    if tld in SUSP_TLDS:
        fl = url.lower()
        if any(kw in fl for kw in PHISHING_KW):
            return 0.97, 'block', 'Suspicious TLD + phishing keywords'
        if is_imp:
            return 0.95, 'block', 'Brand + Suspicious TLD'
        return 0.82, 'block', 'Suspicious TLD'
    if is_imp:
        return bp, 'block', br
    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    prob = sigmoid(margin)

    # Public IP heuristic
    if is_ip_address(hostname) and not is_private_or_local_ip(hostname):
        if prob >= 0.85: return 0.75, 'warning', 'IP công cộng (đã hạ bậc)'
        if prob >= 0.40: return 0.55, 'warning', 'IP công cộng'

    if prob >= 0.85: return prob, 'block', 'ML high risk'
    if prob >= 0.60: return prob, 'warning', 'ML suspicious'
    return prob, 'safe', 'ML safe'

# =====================================================
# TEST CASES — 6 NHÓM, 100+ URLS
# =====================================================

test_cases = []

# ── GROUP 1: Official domains (phải SAFE) ──
group1 = [
    ('https://www.google.com', 'safe', 'Google'),
    ('https://www.facebook.com', 'safe', 'Facebook'),
    ('https://www.amazon.com', 'safe', 'Amazon'),
    ('https://www.microsoft.com', 'safe', 'Microsoft'),
    ('https://www.apple.com', 'safe', 'Apple'),
    ('https://www.netflix.com', 'safe', 'Netflix'),
    ('https://www.youtube.com', 'safe', 'YouTube'),
    ('https://www.instagram.com', 'safe', 'Instagram'),
    ('https://www.twitter.com', 'safe', 'Twitter'),
    ('https://www.x.com', 'safe', 'X/Twitter'),
    ('https://www.linkedin.com', 'safe', 'LinkedIn'),
    ('https://www.paypal.com', 'safe', 'PayPal'),
    ('https://www.github.com', 'safe', 'GitHub'),
    ('https://www.wikipedia.org', 'safe', 'Wikipedia'),
    ('https://fitgirl-repacks.site/', 'safe', 'Fitgirl official'),
    ('https://vietcombank.com.vn', 'safe', 'Vietcombank'),
    ('https://techcombank.com.vn', 'safe', 'Techcombank'),
    ('https://mbbank.com.vn', 'safe', 'MBBank'),
    ('https://momo.vn', 'safe', 'MoMo'),
]
test_cases.extend(group1)

# ── GROUP 2: Tranco Top 30K có path dài (phải SAFE) ──
group2 = [
    ('https://google.com/search?q=test+query', 'safe', 'Google search'),
    ('https://google.com/maps/place/New+York', 'safe', 'Google Maps'),
    ('https://google.com/about/careers', 'safe', 'Google Careers'),
    ('https://facebook.com/settings?tab=security', 'safe', 'FB settings'),
    ('https://amazon.com/dp/B08N5WRWNW', 'safe', 'Amazon product'),
    ('https://microsoft.com/en-us/windows/get-windows-11', 'safe', 'MS Windows'),
    ('https://apple.com/iphone/compare/', 'safe', 'Apple compare'),
    ('https://youtube.com/watch?v=dQw4w9WgXcQ', 'safe', 'YouTube video'),
    ('https://github.com/torvalds/linux/commit/abc123', 'safe', 'GitHub commit'),
    ('https://wikipedia.org/wiki/Phishing', 'safe', 'Wikipedia article'),
    ('https://reddit.com/r/programming/comments/xyz123', 'safe', 'Reddit post'),
    ('https://stackoverflow.com/questions/12345/how-to-fix', 'safe', 'StackOverflow'),
    ('https://twitter.com/elonmusk/status/1234567890', 'safe', 'Tweet'),
    ('https://linkedin.com/in/john-doe-123456789', 'safe', 'LinkedIn profile'),
    ('https://netflix.com/title/80057281', 'safe', 'Netflix title'),
    ('https://yahoo.com/news/technology/latest-news', 'safe', 'Yahoo news'),
]
test_cases.extend(group2)

# ── GROUP 3: Fitgirl fake sites (phải BLOCK) ──
group3 = [
    ('https://fitgirl-repack.com', 'block', 'Fake .com'),
    ('https://fitgirlrepacks.org', 'block', 'Fake .org'),
    ('https://fitgirl-repack.net', 'block', 'Fake .net'),
    ('https://fitgirlrepackz.com', 'block', 'Fake typosquatting z'),
    ('https://fitgirltorrent.com', 'block', 'Fake torrent'),
    ('https://fitgirl-repacks.xyz', 'block', 'Fake .xyz'),
    ('https://fitgirl-repack.site', 'block', 'Fake .site (no hyphen)'),
    ('https://fitgirl-repacks.to', 'block', 'Fake .to'),
    ('https://fitgirlrepacks.in', 'block', 'Fake .in'),
    ('https://fitgirl-repacks.us', 'block', 'Fake .us'),
    ('https://fitgirl-repacks.cc', 'block', 'Fake .cc'),
    ('https://fitgirl-repacks.vip', 'block', 'Fake .vip'),
    ('https://fitgirl-repacks.pro', 'block', 'Fake .pro'),
    ('https://fitgirl-repacks.website', 'block', 'Fake .website'),
    ('https://fitgirlrepack.games', 'block', 'Fake .games'),
    ('https://fitgirl.cc', 'block', 'Fake short .cc'),
    ('https://fitgirlrepacksite.com', 'block', 'Fake with "site"'),
    ('https://fitgirlpack.site', 'block', 'Fake rearranged'),
    ('https://fitgirl-repacks.theproxy.vip', 'block', 'Fake proxy'),
    ('https://ww9.fitgirl-repacks.xyz', 'block', 'Fake subdomain'),
]
test_cases.extend(group3)

# ── GROUP 4: Brand impersonation các brand khác (phải BLOCK) ──
group4 = [
    ('https://paypa1.com/login', 'block', 'PayPal typo (1)'),
    ('https://paypai.com/verify', 'block', 'PayPal typo (i)'),
    ('https://paypaI.com/login', 'block', 'PayPal typo (capital I)'),
    ('https://goggle.com/search', 'block', 'Google typo'),
    ('https://goog1e.com/login', 'block', 'Google number'),
    ('https://faceb00k.com/login', 'block', 'Facebook zeros'),
    ('https://faceboook.com/profile', 'block', 'Facebook extra o'),
    ('https://arnazon.com/account', 'block', 'Amazon typo'),
    ('https://micros0ft.com/login', 'block', 'Microsoft zero'),
    ('https://app1e.com/apple-id', 'block', 'Apple number'),
    ('https://netf1ix.com/billing', 'block', 'Netflix number'),
    ('https://instagrarn.com/login', 'block', 'Instagram typo'),
    ('https://twltter.com/verify', 'block', 'Twitter typo'),
    ('https://linkedln.com/profile', 'block', 'LinkedIn typo'),
    ('https://vletcombank.com/login', 'block', 'Vietcombank typo'),
    ('https://tech-combank.com/verify', 'block', 'Techcombank hyphen'),
]
test_cases.extend(group4)

# ── GROUP 5: Known phishing patterns (phải BLOCK) ──
group5 = [
    ('http://paypal-verify-account.xyz/login', 'block', 'PayPal phishing'),
    ('http://secure-banking-update.tk/verify', 'block', 'Banking phishing'),
    ('http://vietcombank-secure.xyz/login', 'block', 'Vietcombank phishing'),
    ('http://momo-verify-account.tk/login', 'block', 'MoMo phishing'),
    ('http://google-account-recovery.pw/verify', 'block', 'Google recovery'),
    ('http://apple-id-locked.ml/update', 'block', 'Apple ID locked'),
    ('http://facebook-security-check.cf/login', 'block', 'FB security'),
    ('http://netflix-payment-failed.xyz/update', 'block', 'Netflix payment'),
    ('http://microsoft-security-alert.gq/verify', 'block', 'MS security'),
    ('http://amazon-account-suspended.cf/login', 'block', 'Amazon suspended'),
    ('http://instagram-copyright-violation.tk/login', 'block', 'IG copyright'),
    ('http://twitter-verify-identity.cf/confirm', 'block', 'Twitter verify'),
    ('http://mbbank-security.cf/login', 'block', 'MBBank security'),
    ('http://bidv-account-update.gq/verify', 'block', 'BIDV update'),
    ('http://agribank-security.ml/update', 'block', 'Agribank security'),
    ('http://zalopay-security.cf/update', 'block', 'ZaloPay security'),
    ('http://visa-secure-payment.xyz/verify', 'block', 'Visa payment'),
    ('http://mastercard-alert.tk/confirm', 'block', 'Mastercard alert'),
]
test_cases.extend(group5)

# ── GROUP 6: Adversarial / Edge cases ──
group6 = [
    # URL padding — attacker thêm path dài để né detection
    ('https://fitgirl-repack.com/about/company/history/2023/team', 'block', 'Fake + long path'),
    ('https://fitgirlrepacks.org/products/item/details/info/page', 'block', 'Fake + padding'),

    # Query string manipulation
    ('https://fitgirl-repack.com/?ref=support_center&lang=en', 'block', 'Fake + query padding'),

    # Short domains
    ('https://ggl.com', 'safe', 'Short domain (Tranco?)'),
    ('https://fb.com', 'safe', 'FB short (Tranco?)'),

    # IP address
    ('http://192.168.1.1/login', 'safe', 'Private IP'),
    ('http://1.2.3.4/secure/account/verify', 'warning', 'Public IP → warning (hạ bậc)'),

    # Port numbers
    ('http://evil-site.xyz:8080/login', 'block', 'Port 8080'),
    ('http://phishing.tk:4444/secure', 'block', 'Suspicious port'),

    # Unicode / special chars
    ('https://xn--gogle-1ta.com/search', 'safe', 'Punycode (Tranco check)'),
    ('https://paypa\u043b.com/login', 'block', 'Homograph (Cyrillic)'),

    # Subdomain tricks
    ('https://secure.paypal.com.fake-site.xyz/login', 'block', 'Fake subdomain'),
    ('https://login.google.com.phishing.tk/verify', 'block', 'Fake login subdomain'),

    # Very long URL
    ('https://a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-r-s-t-u-v-w-x-y-z.xyz/login/secure/verify/account/payment/confirm', 'block', 'Very long URL'),

    # No path bare domain suspicious
    ('https://totally-legit-not-phishing.tk', 'block', 'Bare suspicious TLD'),
    ('https://definitely-not-a-scam.ml', 'block', 'Bare .ml'),
]
test_cases.extend(group6)

# =====================================================
# RUN TESTS
# =====================================================

print('\n' + '='*130)
print('COMPREHENSIVE PHISHING DETECTOR TEST — 6 GROUPS, 100+ URLS')
print('='*130)

print(f'\nTotal test cases: {len(test_cases)}')

group_names = {
    0: 'Official domains',
    1: 'Tranco Top 30K with path',
    2: 'Fitgirl fake sites',
    3: 'Brand impersonation (other brands)',
    4: 'Known phishing patterns',
    5: 'Adversarial / Edge cases',
}

# Track by group
group_boundaries = []
cumulative = 0
for grp in [group1, group2, group3, group4, group5, group6]:
    group_boundaries.append((cumulative, cumulative + len(grp)))
    cumulative += len(grp)

group_results = {}
for i, name in group_names.items():
    start, end = group_boundaries[i]
    group_results[name] = {'total': 0, 'correct': 0, 'wrong': []}

# Run
all_correct = 0
all_total = 0

for idx, (url, expected_tier, description) in enumerate(test_cases):
    prob, actual_tier, reason = predict(url)

    # Determine group
    for gname, (start, end) in zip(group_names.values(), group_boundaries):
        if start <= idx < end:
            group_results[gname]['total'] += 1
            break

    is_correct = (actual_tier == expected_tier)
    all_total += 1

    if is_correct:
        all_correct += 1
        for gname, (start, end) in zip(group_names.values(), group_boundaries):
            if start <= idx < end:
                group_results[gname]['correct'] += 1
                break
    else:
        for gname, (start, end) in zip(group_names.values(), group_boundaries):
            if start <= idx < end:
                group_results[gname]['wrong'].append((url, expected_tier, actual_tier, prob, reason))
                break

# Print detailed results
current_group = -1
for idx, (url, expected_tier, description) in enumerate(test_cases):
    prob, actual_tier, reason = predict(url)
    is_correct = (actual_tier == expected_tier)

    # Print group header
    for gi, (start, end) in enumerate(group_boundaries):
        if start == idx:
            print(f'\n{"="*130}')
            print(f'GROUP {gi+1}: {group_names[gi]}')
            print(f'{"="*130}')
            print(f'  {"URL":55s}  {"Exp":6s}  {"Act":6s}  Score  {"Status":5s}')
            print(f'  {"-"*125}')
            break

    status = 'PASS' if is_correct else 'FAIL'
    tier_icon = {'safe': '🟢', 'warning': '🟡', 'block': '🔴'}
    url_short = url[:55]
    print(f'  {url_short:55s}  {expected_tier:6s}  {actual_tier:6s}  {prob*100:5.1f}%  {status:5s}  {description}')

# Group summary
print('\n' + '='*130)
print('GROUP SUMMARY:')
print('='*130)
for gname, stats in group_results.items():
    total = stats['total']
    correct = stats['correct']
    pct = (correct / total * 100) if total > 0 else 0
    icon = '✅' if pct == 100 else '❌'
    print(f'  {icon} {gname:45s}  {correct}/{total} ({pct:.1f}%)')

    if stats['wrong']:
        for url, exp, act, prob, reason in stats['wrong']:
            print(f'      → {url[:60]}')
            print(f'        Expected: {exp}, Got: {act} ({prob*100:.1f}%) — {reason}')

# Overall
accuracy = (all_correct / all_total * 100) if all_total > 0 else 0
print(f'\n{"="*130}')
print(f'OVERALL: {all_correct}/{all_total} ({accuracy:.1f}%)')
print(f'{"="*130}')

if accuracy == 100:
    print('\n🎉 TẤT CẢ TEST CASES ĐỀU PASS!')
else:
    failed = all_total - all_correct
    print(f'\n⚠️  {failed} test cases FAILED — cần kiểm tra lại')

print(f'\n' + '='*130 + '\n')
