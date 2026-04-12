"""
test_hutech.py - Kiểm tra các trang web HUTECH
"""
import sys, json, math, re, urllib.parse
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\data\tranco_top30k.json') as f:
    tranco_set = set(d.lower() for d in json.load(f)['domains'])

with open(r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_v2.json') as f:
    model = json.load(f)
trees = model['learner']['gradient_booster']['model']['trees']

SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online','.site','.icu','.gq','.ml','.cf','.ga'}
PHISHING_KW = ['login','verify','account','update','secure','banking','confirm','password','credential','wallet','payment']

SAFE_DOMAINS = {'hutech.edu.vn', 'www.hutech.edu.vn', 'e-graduate.hutech.edu.vn'}

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
        0,
        1 if p.scheme=='https' else 0,
        1 if any(kw in full_orig for kw in ['signin','logon','authenticate','login']) else 0, susp,
    ]
    features.extend([0,0,0,0,0,0,0,0])
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

def predict(url):
    try:
        hostname = urllib.parse.urlparse(url).hostname.lower().replace('www.', '')
        tld = '.' + hostname.split('.')[-1]
    except:
        return 0, 'safe', 'Error'

    if hostname in SAFE_DOMAINS:
        return 0.01, 'safe', 'Domain an toan (whitelist)'
    if hostname in tranco_set:
        return 0.05, 'safe', 'Tranco Top 30K'
    if hostname.endswith('.edu.vn'):
        return 0.03, 'safe', 'Domain giao duc (.edu.vn)'

    feat = extract_features(url)
    margin = sum(traverse_tree(t, feat) for t in trees)
    prob = sigmoid(margin)

    if prob >= 0.85: return prob, 'block', 'ML high risk'
    if prob >= 0.60: return prob, 'warning', 'ML suspicious'
    return prob, 'safe', 'ML safe'

urls_to_test = [
    ('https://hutech.edu.vn/', 'Trang chinh HUTECH'),
    ('https://www.hutech.edu.vn/', 'HUTECH www'),
    ('http://e-graduate.hutech.edu.vn/', 'E-graduate (HTTP)'),
    ('https://e-graduate.hutech.edu.vn/', 'E-graduate (HTTPS)'),
    ('https://hutech.edu.vn/tuyen-sinh', 'HUTECH tuyen sinh'),
    ('https://hutech.edu.vn/dao-tao', 'HUTECH dao tao'),
    ('https://portal.hutech.edu.vn/', 'HUTECH portal'),
    ('https://tuyensinh.hutech.edu.vn/', 'HUTECH tuyen sinh portal'),
]

print('=' * 100)
print('KIEM TRA CAC TRANG WEB HUTECH')
print('=' * 100)
print()
print(f"{'URL':50s}  Score  Tier   Reason")
print('-' * 100)

all_safe = True
for url, desc in urls_to_test:
    prob, tier, reason = predict(url)
    tier_icon = {'safe': 'OK  ', 'warning': 'WARN', 'block': 'BLK '}
    status = 'PASS' if tier == 'safe' else 'FAIL'
    if tier != 'safe':
        all_safe = False
    print(f'{url:50s}  {prob*100:5.1f}% {tier_icon[tier]} {reason:25s}  [{status}]  {desc}')

print()
print('=' * 100)
if all_safe:
    print('=> TAT CA TRANG HUTECH DEU DUOC DANH GIA LA AN TOAN')
else:
    print('=> CANH BAO: CO TRANG HUTECH BI DANH GIA LA PHISHING')
print('=' * 100)
