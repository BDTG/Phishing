"""
test_model_v2.py
Test model v2 (38 features) trên brand impersonation dataset
"""

import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

# Load model v2
MODEL_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_v2.json'
with open(MODEL_PATH) as f:
    model = json.load(f)

trees = model['learner']['gradient_booster']['model']['trees']
print(f"Model v2 loaded: {len(trees)} trees")

SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online',
             '.site','.icu','.gq','.ml','.cf','.ga','.vip','.pro',
             '.website','.games'}

PHISHING_KW = ['login','verify','account','update','secure','banking',
               'confirm','password','credential','wallet','payment','webscr','ebayisapi','signin']

BRANDS_CONFIG = {
    'fitgirl': {
        'officialDomains': ['fitgirl-repacks.site'],
        'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
    },
}

SAFE_DOMAINS = {'fitgirl-repacks.site', 'google.com', 'facebook.com', 'paypal.com'}

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

def extract_features_v2(urlStr):
    """Extract 38 features giống như Python"""
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
        0,  # brand keywords (sẽ tính ở features mới)
        1 if p.scheme=='https' else 0,
        1 if any(kw in full_orig for kw in ['signin','logon','authenticate','login']) else 0, susp,
    ]

    # 8 features mới
    all_brand_kws = []
    for brand_info in BRANDS_CONFIG.values():
        all_brand_kws.extend(brand_info['keywords'])

    brand_in_domain = 1 if any(kw in hostname for kw in all_brand_kws) else 0

    is_official = any(hostname == od.lower() for od in BRANDS_CONFIG['fitgirl']['officialDomains'])
    is_official_domain = 1 if is_official else 0

    is_impersonation = False
    for brand_info in BRANDS_CONFIG.values():
        brand_in_hostname = any(kw in hostname for kw in brand_info['keywords'])
        if not brand_in_hostname: continue
        is_off = any(hostname == od.lower() for od in brand_info['officialDomains'])
        if brand_in_hostname and not is_off:
            is_impersonation = True
            break
    is_brand_impersonation = 1 if is_impersonation else 0

    host_base = pure.split('.')[0]
    min_dist = 999
    if len(host_base) >= 5:
        for brand_info in BRANDS_CONFIG.values():
            for od in brand_info['officialDomains']:
                official_base = od.lower().split('.')[0]
                if len(official_base) >= 5:
                    dist = levenshtein_distance(host_base, official_base)
                    min_dist = min(min_dist, dist)
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

    features.extend([
        brand_in_domain, is_official_domain, is_brand_impersonation,
        min_levenshtein, is_typosquatting, brand_mismatch_score,
        has_phishing_keywords_enhanced, combined_suspicious_score,
    ])

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

def predict_v2(url):
    feat = extract_features_v2(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    return sigmoid(margin)

# =====================================================
# TEST
# =====================================================

print('\n' + '='*100)
print('MODEL V2 (38 FEATURES) — BRAND IMPERSONATION TEST')
print('='*100)

# Test Fitgirl sites
fake_sites = [
    'https://fitgirl-repack.com',
    'https://fitgirlrepacks.org',
    'https://fitgirl-repack.net',
    'https://fitgirlrepackz.com',
    'https://fitgirltorrent.com',
    'https://fitgirl-repacks.xyz',
    'https://fitgirl-repack.site',
]

print(f'\n{"URL":45s}  Score   Status')
print('-'*60)

detected = 0
for url in fake_sites:
    prob = predict_v2(url)
    is_phishing = prob >= 0.5
    if is_phishing: detected += 1
    status = 'PHISHING' if is_phishing else 'SAFE  '
    print(f'{url:45s}  {prob*100:5.1f}%  {status}')

print(f'\nDetected: {detected}/{len(fake_sites)} ({detected/len(fake_sites)*100:.1f}%)')

# Test official
official_prob = predict_v2('https://fitgirl-repacks.site/')
print(f'\nOfficial (fitgirl-repacks.site): {official_prob*100:.1f}% -> {"SAFE" if official_prob < 0.5 else "PHISHING"}')

# Test safe
safe_prob = predict_v2('https://www.google.com')
print(f'Google.com: {safe_prob*100:.1f}% -> {"SAFE" if safe_prob < 0.5 else "PHISHING"}')

print('\n' + '='*100 + '\n')
