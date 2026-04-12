import sys, json, math, re, urllib.parse
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

PHISHING_KW = ['login','verify','account','update','secure','banking','confirm','password','credential','wallet','payment','webscr','ebayisapi','signin']
BRAND_KW = ['paypal','google','amazon','apple','microsoft','facebook','netflix','instagram','twitter','linkedin','youtube','chase','wellsfargo','bankofamerica','citibank']
LOGIN_KW = ['signin','logon','authenticate','login','log-in','sign-in']
SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online','.site','.icu','.gq','.ml','.cf','.ga','.vip','.pro','.website','.games'}

def entropy(s):
    if not s: return 0.0
    freq = Counter(s); n=len(s)
    return -sum((c/n)*math.log2(c/n) for c in freq.values())

def features(urlStr):
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

model_path = r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_tuned.json'
with open(model_path) as f:
    m = json.load(f)
trees = m['learner']['gradient_booster']['model']['trees']

def traverse(t, feat):
    lc=t['left_children']; rc=t['right_children']
    si=t['split_indices']; sc=t['split_conditions']; bw=t['base_weights']
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
            kws = ['login','verify','account','update','secure','banking','confirm','password','credential','wallet','payment','signin']
            return 0.97 if any(k in full for k in kws) else 0.75
    except: pass
    feat = features(url)
    margin = sum(traverse(t,feat) for t in trees)
    return 1/(1+math.exp(-margin))

# Real site
real = 'https://fitgirl-repacks.se'

urls = [
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

p_real = predict(real)
print(f'SITE THAT : {real}')
print(f'           Score: {p_real*100:.1f}% -- {"PHISHING" if p_real>0.5 else "AN TOAN"}')
print()
print(f'{"URL":48s}  TLD        Score    Ket qua')
print('-'*75)
for url in urls:
    p = predict(url)
    h = urllib.parse.urlparse(url).hostname.lower()
    h = re.sub(r'^www[0-9]*\.','',h)
    parts = h.split('.')
    tld = '.'+parts[-1]
    flag = 'PHISHING !' if p>0.5 else 'an toan  '
    mark = '<<< SUSP TLD' if tld in SUSP_TLDS else ''
    print(f'{url:48s}  {tld:10s} {p*100:5.1f}%   {flag} {mark}')
