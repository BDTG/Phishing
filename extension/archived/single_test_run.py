"""
single_test_run.py
Chay MOT LAN duy nhat - khong lap lai
"""

import sys, json, math, re, urllib.parse, os
from collections import Counter
from datetime import datetime

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

BRAND_KW = ['paypal','google','amazon','apple','microsoft','facebook','netflix',
            'instagram','twitter','linkedin','youtube','chase','wellsfargo',
            'bankofamerica','citibank']

LOGIN_KW = ['signin','logon','authenticate','login','log-in','sign-in']

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

KNOWN_PHISHING_URLS = [
    'http://paypal-verify-account.xyz/login',
    'http://secure-banking-update.tk/verify',
    'http://amazon-account-suspended.cf/login',
    'http://microsoft-security-alert.gq/verify',
    'http://apple-id-locked.ml/update',
    'http://facebook-security-check.tk/login',
    'http://netflix-payment-failed.xyz/update',
    'http://google-account-recovery.pw/verify',
    'http://instagram-copyright-violation.tk/login',
    'http://twitter-verify-identity.cf/confirm',
    'http://vietcombank-secure.xyz/login',
    'http://techcombank-update.tk/verify',
    'http://mbbank-security.cf/login',
    'http://bidv-account-update.gq/verify',
    'http://agribank-security.ml/update',
    'http://momo-verify-account.tk/login',
    'http://zalopay-security.cf/update',
    'http://visa-secure-payment.xyz/verify',
    'http://mastercard-alert.tk/confirm',
]

KNOWN_SAFE_URLS = [
    'https://www.google.com',
    'https://www.facebook.com',
    'https://www.amazon.com',
    'https://www.microsoft.com',
    'https://www.apple.com',
    'https://www.netflix.com',
    'https://www.youtube.com',
    'https://www.instagram.com',
    'https://www.twitter.com',
    'https://www.linkedin.com',
    'https://www.paypal.com',
    'https://www.github.com',
    'https://www.wikipedia.org',
    'https://www.yahoo.com',
    'https://www.reddit.com',
    'https://vietcombank.com.vn',
    'https://techcombank.com.vn',
    'https://mbbank.com.vn',
    'https://bidv.com.vn',
    'https://agribank.com.vn',
    'https://momo.vn',
    'https://zalopay.vn',
    'https://fitgirl-repacks.se',
    'https://fitgirl-repack.com',
    'https://fitgirlrepacks.org',
]

URLS_TO_TEST = [
    'https://fitgirl-repack.site',
    'https://fitgirl-repacks.website',
    'https://fitgirlrepack.games',
    'https://fitgirl.cc',
    'https://fitgirl-repacks.cc',
    'https://ww9.fitgirl-repacks.xyz',
    'https://fitgirl-repacks.xyz',
    'https://fitgirlpack.site',
    'https://fitgirlrepacks.pro',
    'https://fitgirl-repacks.vip',
    'https://fitgirlrepackz.com',
    'https://fitgirl-repacks.theproxy.vip',
    'https://paypal-security-alert.com/login',
    'https://account-verify-secure.xyz/update',
    'https://banking-security-update.tk/verify',
    'https://secure-login-portal.cf/login',
    'https://microsoft-team-alert.gq/verify',
    'https://apple-id-support.ml/update',
    'https://facebook-copyright-team.tk/login',
    'https://netflix-billing-update.xyz/confirm',
    'https://google-security-team.pw/verify',
    'https://instagram-support-team.cf/login',
]

print('\n' + '='*80)
print('PHISHING DETECTOR - TEST REPORT')
print('='*80)
print(f'Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
print('='*80 + '\n')

false_negatives = []
false_positives = []
true_positives = []
true_negatives = []

print('\n[1] TESTING KNOWN PHISHING URLs:')
print('-'*80)

for url in KNOWN_PHISHING_URLS:
    prob = predict(url)
    is_phishing = prob >= 0.5
    
    if is_phishing:
        true_positives.append(url)
        print(f"  [OK] DETECTED: {url}")
        print(f"       Prob: {prob*100:.2f}%")
    else:
        false_negatives.append((url, prob))
        print(f"  [!!] FALSE NEGATIVE: {url}")
        print(f"       Expected: phishing, Got: SAFE")
        print(f"       Prob: {prob*100:.2f}%")

print('\n[2] TESTING KNOWN SAFE URLs:')
print('-'*80)

for url in KNOWN_SAFE_URLS:
    prob = predict(url)
    is_phishing = prob >= 0.5
    
    if not is_phishing:
        true_negatives.append(url)
        print(f"  [OK] SAFE: {url}")
        print(f"       Prob: {prob*100:.2f}%")
    else:
        false_positives.append((url, prob))
        print(f"  [!!] FALSE POSITIVE: {url}")
        print(f"       Expected: safe, Got: PHISHING")
        print(f"       Prob: {prob*100:.2f}%")

print('\n[3] TESTING NEW URLs:')
print('-'*80)

for url in URLS_TO_TEST:
    prob = predict(url)
    is_phishing = prob >= 0.5
    predicted = 'PHISHING' if is_phishing else 'SAFE'
    
    print(f"  {'[!]' if is_phishing else '[OK]'} {predicted}: {url}")
    print(f"      Prob: {prob*100:.2f}%")
    if is_phishing:
        print(f"      -> Potential phishing site!")

print('\n' + '='*80)
print('SUMMARY:')
print('='*80)
print(f"  True Positives:  {len(true_positives)}")
print(f"  True Negatives:  {len(true_negatives)}")
print(f"  False Positives: {len(false_positives)}")
print(f"  False Negatives: {len(false_negatives)}")

total = len(true_positives) + len(true_negatives) + len(false_positives) + len(false_negatives)
accuracy = ((len(true_positives) + len(true_negatives)) / total * 100) if total > 0 else 0
print(f"  Accuracy: {accuracy:.2f}%")

if false_negatives:
    print('\n' + '!'*80)
    print('CRITICAL: FALSE NEGATIVES - PHISHING NOT DETECTED!')
    print('!'*80)
    for url, prob in false_negatives:
        print(f"  - {url} (prob: {prob*100:.2f}%)")
    print('\n>>> Update model or rules to catch these! <<<')

if false_positives:
    print('\n' + '!'*80)
    print('WARNING: FALSE POSITIVES - SAFE SITES FLAGGED!')
    print('!'*80)
    for url, prob in false_positives:
        print(f"  - {url} (prob: {prob*100:.2f}%)")

print('\n' + '='*80 + '\n')

# Save results
results_file = os.path.join(os.path.dirname(__file__), 'test_results_single.json')
results = {
    'timestamp': datetime.now().isoformat(),
    'true_positives': len(true_positives),
    'true_negatives': len(true_negatives),
    'false_positives': len(false_positives),
    'false_negatives': len(false_negatives),
    'accuracy': accuracy,
    'false_negative_urls': [{'url': url, 'prob': prob} for url, prob in false_negatives],
    'false_positive_urls': [{'url': url, 'prob': prob} for url, prob in false_positives],
}

with open(results_file, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"Results saved to: {results_file}\n")
