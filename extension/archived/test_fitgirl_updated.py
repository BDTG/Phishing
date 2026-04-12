"""
test_fitgirl_updated.py
Test voi brand impersonation detection cho Fitgirl
"""

import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

# =====================================================
# CONFIG
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
# BRAND IMPERSONATION DETECTION
# =====================================================

# Cac thuong hieu de bi gia mao - can phat hien brand impersonation
BRAND_IMPERSONATION = {
    'fitgirl': {
        'official_domains': ['fitgirl-repacks.se'],
        'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack'],
    },
    # Co the them brand khac o day
    # 'tenbrand': {
    #     'official_domains': ['tenbrand.com'],
    #     'keywords': ['tenbrand', 'ten-brand'],
    # },
}

def check_brand_impersonation(url):
    """
    Kiem tra neu URL gia mao thuong hieu
    Return: (is_impersonation, score, reason)
    """
    url_lower = url.lower()
    
    for brand_name, brand_info in BRAND_IMPERSONATION.items():
        # Check if URL contains brand keywords
        brand_in_url = any(kw in url_lower for kw in brand_info['keywords'])
        
        if not brand_in_url:
            continue
        
        # Check if domain is official
        try:
            hostname = urllib.parse.urlparse(url).hostname.lower()
            hostname = re.sub(r'^www[0-9]*\.', '', hostname)
            
            # Neu la official domain -> OK
            if hostname in brand_info['official_domains']:
                return (False, 0, 'Official domain')
            
            # Neu co brand keyword nhung khong phai official domain
            # -> Brand impersonation
            domain_parts = hostname.split('.')
            domain_base = '.'.join(domain_parts[-2:])  # lay part chinh
            
            # Check variations
            is_official = any(
                re.sub(r'^www[0-9]*\.', '', od) == hostname 
                for od in brand_info['official_domains']
            )
            
            if not is_official:
                # Build reason
                reasons = []
                if any(kw in hostname for kw in brand_info['keywords']):
                    reasons.append(f'Uses brand name "{brand_name}"')
                
                # Check for typosquatting
                official_base = [re.sub(r'^www[0-9]*\.', '', od).split('.')[0] 
                                for od in brand_info['official_domains']]
                
                for official in official_base:
                    if hostname.startswith(official):
                        # Them ky tu, bot ky tu, thay the
                        rest = hostname[len(official):]
                        if rest and rest not in ['-', '.se', '.com', '.org', '.net']:
                            reasons.append(f'Typosquatting: "{official}" + "{rest}"')
                
                if reasons:
                    return (True, 0.85, '; '.join(reasons))
                else:
                    return (True, 0.75, f'Brand impersonation: "{brand_name}"')
        
        except Exception:
            pass
    
    return (False, 0, '')

# =====================================================
# FEATURE EXTRACTION (giong cu)
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

def predict_old(url):
    """Phuong phap cu (khong co brand impersonation)"""
    try:
        h = urllib.parse.urlparse(url).hostname.lower()
        h = re.sub(r'^www[0-9]*\.','',h)
        parts = h.split('.')
        tld = '.'+parts[-1] if parts else ''
        if tld in SUSP_TLDS:
            full = url.lower()
            kws = ['login','verify','account','update','secure','banking',
                   'confirm','password','credential','wallet','payment','signin']
            return 0.97 if any(k in full for k in kws) else 0.75
    except: pass
    
    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    return 1/(1+math.exp(-margin))

def predict_new(url):
    """Phuong phap moi (CO brand impersonation detection)"""
    # Check brand impersonation first
    is_impersonation, score, reason = check_brand_impersonation(url)
    if is_impersonation:
        return (score, f'Brand impersonation: {reason}')
    
    # Fall back to old method
    old_score = predict_old(url)
    return (old_score, 'ML model' if old_score >= 0.5 else 'Safe')

# =====================================================
# TEST
# =====================================================

REAL_SITE = 'https://fitgirl-repacks.se'

FAKE_SITES = [
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

print('\n' + '='*100)
print('FITGIRL REPACK - BRAND IMPERSONATION TEST')
print('='*100)
print(f'\nReal site: {REAL_SITE}')

# Test real site
score_old = predict_old(REAL_SITE)
score_new, method_new = predict_new(REAL_SITE)
print(f'Old method: {score_old*100:.1f}% -> {"PHISHING" if score_old >= 0.5 else "SAFE"}')
print(f'New method: {score_new*100:.1f}% -> {"PHISHING" if score_new >= 0.5 else "SAFE"} ({method_new})')

print(f'\n{"Fake Site":50s}  {"Old":>8s}  {"New":>8s}  Result')
print('-'*100)

false_negatives_old = []
false_negatives_new = []
correct_old = 0
correct_new = 0

for url in FAKE_SITES:
    old_score = predict_old(url)
    new_score, method = predict_new(url)
    
    old_detected = old_score >= 0.5
    new_detected = new_score >= 0.5
    
    if old_detected:
        correct_old += 1
    else:
        false_negatives_old.append((url, old_score))
    
    if new_detected:
        correct_new += 1
    else:
        false_negatives_new.append((url, new_score, method))
    
    old_status = 'PHISHING' if old_detected else 'SAFE  '
    new_status = 'PHISHING' if new_detected else 'SAFE  '
    
    old_mark = 'OK' if old_detected else 'MISS'
    new_mark = 'OK' if new_detected else 'MISS'
    
    # Truncate URL for display
    url_display = url[:50]
    print(f'{url_display:50s}  {old_score*100:6.1f}%{old_mark:4s}  {new_score*100:6.1f}%{new_mark:4s}  {method}')

print('\n' + '='*100)
print('COMPARISON:')
print('='*100)

print(f'\nOLD METHOD:')
print(f'  Detected: {correct_old}/{len(FAKE_SITES)} ({correct_old/len(FAKE_SITES)*100:.1f}%)')
print(f'  Missed: {len(false_negatives_old)}')
if false_negatives_old:
    print(f'  False negatives:')
    for url, score in false_negatives_old:
        print(f'    - {url} ({score*100:.1f}%)')

print(f'\nNEW METHOD (with brand impersonation detection):')
print(f'  Detected: {correct_new}/{len(FAKE_SITES)} ({correct_new/len(FAKE_SITES)*100:.1f}%)')
print(f'  Missed: {len(false_negatives_new)}')
if false_negatives_new:
    print(f'  False negatives:')
    for url, score, method in false_negatives_new:
        print(f'    - {url} ({score*100:.1f}%) - {method}')
else:
    print(f'  -> NO FALSE NEGATIVES!')

print('\n' + '='*100 + '\n')
