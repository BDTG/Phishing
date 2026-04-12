"""
test_reasons_display.py
Test verify rằng lý do được trả về đúng cho từng loại URL
"""

import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

MODEL_PATH = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_tuned.json'
with open(MODEL_PATH) as f:
    model = json.load(f)
trees = model['learner']['gradient_booster']['model']['trees']

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
    matrix = [[0]*(len(b)+1) for _ in range(len(a)+1)]
    for i in range(len(a)+1): matrix[i][0] = i
    for j in range(len(b)+1): matrix[0][j] = j
    for i in range(1, len(a)+1):
        for j in range(1, len(b)+1):
            matrix[i][j] = matrix[i-1][j-1] if a[i-1]==b[j-1] else min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1)
    return matrix[len(a)][len(b)]

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
        # Typosquatting check
        is_typo = any(levenshtein_distance(hostname.split('.')[0], od.lower().replace('www.', '').split('.')[0]) <= 2
                      for od in brand_info['officialDomains'] if len(hostname.split('.')[0]) >= 5)
        if is_typo:
            return True, 0.90, f'Typosquatting "{brand_name}"'
        return True, 0.85, f'Brand impersonation "{brand_name}"'
    return False, 0, ''

def predict_with_reason(url):
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
        tld = '.' + hostname.split('.')[-1]
    except:
        return 0, 'Error'

    if hostname in SAFE_DOMAINS:
        return 0.01, 'Domain an toàn (whitelist)'

    is_impersonation, brand_prob, brand_reason = check_brand_impersonation(url)
    if brand_reason == 'Official domain':
        return brand_prob, 'Domain chính chủ'

    if tld in SUSP_TLDS:
        full_lower = url.lower()
        has_phish_kw = any(kw in full_lower for kw in PHISHING_KW)
        if has_phish_kw:
            return 0.97, 'TLD đáng ngờ + từ khóa phishing'
        if is_impersonation:
            return 0.95, f'Giả mạo thương hiệu + TLD đáng ngờ ({brand_reason})'
        return 0.82, 'TLD đáng ngờ (thường dùng cho phishing)'

    if is_impersonation:
        return brand_prob, brand_reason

    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    prob = sigmoid(margin)
    return prob, 'ML model (XGBoost) phát hiện URL đáng ngờ' if prob >= 0.5 else 'ML model đánh giá an toàn'

# =====================================================
# TEST
# =====================================================

print('\n' + '='*100)
print('TEST LÝ DO HIỂN THỊ TRÊN BANNER')
print('='*100)

test_cases = [
    # (URL, expected_status, expected_reason_pattern)
    ('https://fitgirl-repacks.site/', 'SAFE', 'Domain an toàn'),
    ('https://fitgirl-repack.com', 'PHISHING', 'Typosquatting'),
    ('https://fitgirlrepacks.org', 'PHISHING', 'Typosquatting'),
    ('https://fitgirl-repacks.xyz', 'PHISHING', 'Giả mạo thương hiệu'),
    ('https://fitgirl-repack.net', 'PHISHING', 'Typosquatting'),
    ('https://fitgirlrepackz.com', 'PHISHING', 'Typosquatting'),
    ('https://fitgirltorrent.com', 'PHISHING', 'Brand impersonation'),
    ('https://www.google.com', 'SAFE', 'Domain an toàn'),
    ('http://paypal-verify-account.xyz/login', 'PHISHING', 'TLD đáng ngờ'),
]

print(f'\n{"URL":45s}  {"Status":10s}  Score   {"Lý do hiển thị"}')
print('-'*100)

all_pass = True
for url, expected_status, expected_reason in test_cases:
    prob, reason = predict_with_reason(url)
    actual_status = 'PHISHING' if prob >= 0.5 else 'SAFE'
    
    status_ok = actual_status == expected_status
    reason_ok = expected_reason.lower() in reason.lower()
    
    status_icon = 'PASS' if (status_ok and reason_ok) else 'FAIL'
    if not (status_ok and reason_ok):
        all_pass = False
    
    url_display = url[:45]
    print(f'{url_display:45s}  {actual_status:10s}  {prob*100:5.1f}%  {reason}  [{status_icon}]')

print('\n' + '='*100)
if all_pass:
    print('TẤT CẢ LÝ DO ĐƯỢC TRẢ VỀ ĐÚNG!')
else:
    print('CÓ MỘT SỐ LÝ DO KHÔNG ĐÚNG — CẦN KIỂM TRA LẠI')
print('='*100 + '\n')
