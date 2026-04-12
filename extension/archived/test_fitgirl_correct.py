"""
test_fitgirl_correct.py
Test voi domain goc dung: fitgirl-repacks.site
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
               'confirm','password','credential','wallet','payment',
               'webscr','ebayisapi','signin']

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

def predict(url):
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

# =====================================================
# TEST
# =====================================================

REAL_SITE = 'https://fitgirl-repacks.site/'

FAKE_SITES = [
    'https://fitgirl-repack.site',       # Giong 99% - chi khac hyphen
    'https://fitgirl-repack.com',        # .com - rat de nham
    'https://fitgirlrepacks.org',        # Gop chu, khac TLD
    'https://fitgirl-repacks.website',   # Trung ten, khac TLD
    'https://fitgirlrepacks.co',         # Giong .com
    'https://fitgirlrepack.games',       # Them tu 'games'
    'https://fitgirl.cc',                # Ngan gon, de nho nham
    'https://fitgirlrepacksite.com',     # Them 'site'
    'https://fitgirlrepacks.in',         # Trung ten, khac TLD
    'https://fitgirl-repacks.cc',        # Trung ten, khac TLD
    'https://fitgirl-repacks.to',        # Trung ten, khac TLD
    'https://ww9.fitgirl-repacks.xyz',   # Subdomain gia
    'https://fitgirl-repacks.xyz',       # Trung ten, khac TLD
    'https://fitgirl-repack.net',        # .net - de nham
    'https://fitgirlpack.site',          # Sắp xếp chữ - fitgirlpack vs fitgirl-repack
    'https://fitgirl-repack.org',        # Giong .com
    'https://fitgirlrepacks.pro',        # Trung ten, khac TLD
    'https://fitgirlrepack.games',       # Giong tren
    'https://fitgirltorrent.com',        # Them 'torrent'
    'https://fitgirl-repacks.vip',       # Trung ten, khac TLD
    'https://fitgirlrepackz.com',        # Thay 's' = 'z'
    'https://fitgirl-repacks.theproxy.vip',  # Proxy
    'https://fitgirl-repacks.us',        # Trung ten, khac TLD
    'https://fitgirl-repacks.in',        # Trung ten, khac TLD
]

print('\n' + '='*100)
print('FITGIRL REPACK - BRAND IMPERSONATION TEST (DOMAIN GOC: fitgirl-repacks.site)')
print('='*100)
print(f'\nSite chinh chu: {REAL_SITE}')

p_real = predict(REAL_SITE)
print(f'  Score: {p_real*100:.1f}% -> {"PHISHING" if p_real >= 0.5 else "AN TOAN"}')

print(f'\n{"Fake Site":50s}  TLD        Score    Ket qua')
print('-'*100)

missed = []
detected_count = 0

for url in FAKE_SITES:
    p = predict(url)
    h = urllib.parse.urlparse(url).hostname.lower()
    h = re.sub(r'^www[0-9]*\.','',h)
    parts = h.split('.')
    tld = '.'+parts[-1]
    
    is_phishing = p >= 0.5
    flag = 'PHISHING !' if is_phishing else 'BO LOT  '
    
    if tld in SUSP_TLDS:
        mark = '<<< SUSP TLD'
    else:
        mark = '<<< FAKE SITE!'
    
    if is_phishing:
        detected_count += 1
    else:
        missed.append((url, p, tld))
    
    url_display = url[:50]
    print(f'{url_display:50s}  {tld:10s} {p*100:5.1f}%   {flag} {mark}')

print('\n' + '='*100)
print('TONG KET:')
print('='*100)
print(f'  Phat hien: {detected_count}/{len(FAKE_SITES)} ({detected_count/len(FAKE_SITES)*100:.1f}%)')
print(f'  Bo sot:   {len(missed)}/{len(FAKE_SITES)} ({len(missed)/len(FAKE_SITES)*100:.1f}%)')

if missed:
    print('\n' + '!'*100)
    print('CANH BAO: TOOL BO LOT NHIEU TRANG FAKE CHUA DUOC PHAT HIEN!')
    print('!'*100)
    print('\nCac trang fake bi bo lot (dung TLD pho thong):')
    for url, score, tld in missed:
        print(f'  - {url} (score: {score*100:.1f}%, TLD: {tld})')
    print('\n>>> CAN CAP NHAT: Brand Impersonation Detection <<<')
else:
    print('\n  => KHONG CO FALSE NEGATIVE!')

print('\n' + '='*100 + '\n')
