"""
continuous_phishing_test.py
Lien tuc kiem tra cac trang web voi phishing detector
Phat hien false negatives (phishing nhung tools KHONG detect)

Cach chay: py continuous_phishing_test.py
Nhan Ctrl+C de dung
"""

import sys, json, math, re, time, urllib.parse
from collections import Counter
from datetime import datetime

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
# FEATURE EXTRACTION
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
# URL LISTS
# =====================================================

ALREADY_TESTED = set()

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

# =====================================================
# TEST FUNCTIONS
# =====================================================

def test_url(url, expected_type):
    prob = predict(url)
    is_phishing = prob >= 0.5
    expected = expected_type == 'phishing'
    correct = (is_phishing == expected)
    return {
        'url': url,
        'probability': prob,
        'predicted': 'phishing' if is_phishing else 'safe',
        'expected': expected_type,
        'correct': correct,
    }

def run_tests():
    print('\n' + '='*80)
    print('PHISHING DETECTOR - CONTINUOUS TEST REPORT')
    print('='*80)
    print(f'Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('='*80 + '\n')
    
    false_negatives = []
    false_positives = []
    true_positives = []
    true_negatives = []
    
    # Test known phishing URLs
    print('\n[TESTING] KNOWN PHISHING URLs:')
    print('-'*80)
    
    for url in KNOWN_PHISHING_URLS:
        if url in ALREADY_TESTED:
            continue
        
        result = test_url(url, 'phishing')
        
        if result['correct']:
            true_positives.append(result)
            print(f"  OK DETECTED: {url}")
            print(f"    Probability: {result['probability']*100:.2f}%")
        else:
            false_negatives.append(result)
            print(f"  *** FALSE NEGATIVE: {url}")
            print(f"    Expected: phishing, Got: {result['predicted']}")
            print(f"    Probability: {result['probability']*100:.2f}%")
    
    # Test known safe URLs
    print('\n[TESTING] KNOWN SAFE URLs:')
    print('-'*80)
    
    for url in KNOWN_SAFE_URLS:
        if url in ALREADY_TESTED:
            continue
        
        result = test_url(url, 'safe')
        
        if result['correct']:
            true_negatives.append(result)
            print(f"  OK SAFE: {url}")
            print(f"    Probability: {result['probability']*100:.2f}%")
        else:
            false_positives.append(result)
            print(f"  *** FALSE POSITIVE: {url}")
            print(f"    Expected: safe, Got: {result['predicted']}")
            print(f"    Probability: {result['probability']*100:.2f}%")
    
    # Test URLs can test
    print('\n[TESTING] NEW URLs:')
    print('-'*80)
    
    for url in URLS_TO_TEST:
        if url in ALREADY_TESTED:
            continue
        
        prob = predict(url)
        is_phishing = prob >= 0.5
        predicted = 'PHISHING' if is_phishing else 'SAFE'
        
        print(f"  {'[!]' if is_phishing else '[OK]'} {predicted}: {url}")
        print(f"      Probability: {prob*100:.2f}%")
        
        if is_phishing:
            print(f"      -> Potential phishing site detected!")
    
    # Summary
    print('\n' + '='*80)
    print('SUMMARY:')
    print('='*80)
    print(f"  True Positives (Correct phishing detection): {len(true_positives)}")
    print(f"  True Negatives (Correct safe detection): {len(true_negatives)}")
    print(f"  False Positives (Safe flagged as phishing): {len(false_positives)}")
    print(f"  False Negatives (Phishing NOT detected): {len(false_negatives)}")
    
    total = len(true_positives) + len(true_negatives) + len(false_positives) + len(false_negatives)
    accuracy = ((len(true_positives) + len(true_negatives)) / total * 100) if total > 0 else 0
    print(f"  Accuracy: {accuracy:.2f}%")
    
    if false_negatives:
        print('\n' + '!'*80)
        print('CRITICAL: FALSE NEGATIVES DETECTED!')
        print('!'*80)
        print('\nThese phishing sites were NOT detected:')
        for fn in false_negatives:
            print(f"  - {fn['url']} (prob: {fn['probability']*100:.2f}%)")
        print('\n>>> ACTION NEEDED: Update model or rules to catch these! <<<')
    
    if false_positives:
        print('\n' + '!'*80)
        print('WARNING: FALSE POSITIVES DETECTED!')
        print('!'*80)
        print('\nThese safe sites were incorrectly flagged:')
        for fp in false_positives:
            print(f"  - {fp['url']} (prob: {fp['probability']*100:.2f}%)")
    
    print('\n' + '='*80 + '\n')
    
    return {
        'false_negatives': false_negatives,
        'false_positives': false_positives,
        'true_positives': true_positives,
        'true_negatives': true_negatives,
        'accuracy': accuracy,
    }

# =====================================================
# MAIN - CHAY LIEN TUC
# =====================================================

if __name__ == '__main__':
    print('Starting continuous phishing detection tester...')
    print('Press Ctrl+C to stop\n')
    
    # Run initial test
    results = run_tests()
    
    # Save results
    import os
    results_file = os.path.join(os.path.dirname(__file__), 'test_results.json')
    existing = []
    if os.path.exists(results_file):
        with open(results_file, 'r', encoding='utf-8') as f:
            existing = json.load(f)
    
    existing.append({
        'timestamp': datetime.now().isoformat(),
        'false_negatives': len(results['false_negatives']),
        'false_positives': len(results['false_positives']),
        'true_positives': len(results['true_positives']),
        'true_negatives': len(results['true_negatives']),
        'accuracy': results['accuracy'],
    })
    
    # Keep only last 100 results
    if len(existing) > 100:
        existing = existing[-100:]
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    
    print(f"Results saved to {results_file}")
    print(f"\nTesting every 5 minutes...\n")
    
    # Repeat every 5 minutes
    TEST_INTERVAL = 5 * 60  # 5 minutes
    
    try:
        while True:
            time.sleep(TEST_INTERVAL)
            
            print('\n\n' + '='*80)
            print('RUNNING NEW TEST CYCLE...')
            print('='*80 + '\n')
            
            results = run_tests()
            
            # Save results
            existing.append({
                'timestamp': datetime.now().isoformat(),
                'false_negatives': len(results['false_negatives']),
                'false_positives': len(results['false_positives']),
                'true_positives': len(results['true_positives']),
                'true_negatives': len(results['true_negatives']),
                'accuracy': results['accuracy'],
            })
            
            if len(existing) > 100:
                existing = existing[-100:]
            
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(existing, f, indent=2, ensure_ascii=False)
            
    except KeyboardInterrupt:
        print('\n\nStopped by user. Final results saved.')
        print(f'Total test cycles: {len(existing)}')
