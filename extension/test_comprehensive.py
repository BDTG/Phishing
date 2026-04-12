// ============================================================
// test_comprehensive.py
// Test mở rộng — 250 URLs, 12 nhóm khác nhau
// ============================================================
// Mục đích: Kiểm tra extension với nhiều loại URLs thực tế
// Groups:
//   1. Official domains (50) — phải SAFE
//   2. Official subdomains (20) — phải SAFE
//   3. Safe platforms (15) — phải SAFE
//   4. HUTECH (10) — phải SAFE
//   5. Fitgirl fakes (25) — phải BLOCK
//   6. Brand typosquatting (30) — phải BLOCK
//   7. Known phishing (30) — phải BLOCK
//   8. Adversarial/Edge (20) — mixed
//   9. Safe long-path (15) — phải SAFE
//   10. Suspicious but safe (10) — phải SAFE
//   11. Anti-phishing pages (10) — phải SAFE
//   12. News sites (15) — phải SAFE
// ============================================================

import sys, json, math, re, urllib.parse
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

# Load Tranco Top 30K
with open(r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension\data\tranco_top30k.json') as f:
    tranco_set = set(d.lower() for d in json.load(f)['domains'])

# Load Model XGBoost
with open(r'C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\code\data\xgboost_model_v2.json') as f:
    model = json.load(f)
trees = model['learner']['gradient_booster']['model']['trees']

# Constants
SUSP_TLDS = {'.xyz','.tk','.pw','.cc','.top','.club','.online','.site','.icu','.gq','.ml','.cf','.ga','.vip','.pro','.website','.games'}
PHISHING_KW = ['login','verify','account','update','secure','banking','confirm','password','credential','wallet','payment','webscr','ebayisapi','signin']

# Brands config
BRANDS_CONFIG = {
    'paypal': {'officialDomains': ['paypal.com'], 'keywords': ['paypal']},
    'google': {'officialDomains': ['google.com', 'google.com.vn'], 'keywords': ['google']},
    'microsoft': {'officialDomains': ['microsoft.com'], 'keywords': ['microsoft']},
    'apple': {'officialDomains': ['apple.com'], 'keywords': ['apple']},
    'facebook': {'officialDomains': ['facebook.com'], 'keywords': ['facebook']},
    'amazon': {'officialDomains': ['amazon.com'], 'keywords': ['amazon']},
    'fitgirl': {'officialDomains': ['fitgirl-repacks.site'], 'keywords': ['fitgirl', 'fitgirl-repack', 'fitgirlrepack']},
    'netflix': {'officialDomains': ['netflix.com'], 'keywords': ['netflix']},
    'instagram': {'officialDomains': ['instagram.com'], 'keywords': ['instagram']},
    'twitter': {'officialDomains': ['twitter.com', 'x.com'], 'keywords': ['twitter']},
    'linkedin': {'officialDomains': ['linkedin.com'], 'keywords': ['linkedin']},
    'vietcombank': {'officialDomains': ['vietcombank.com.vn'], 'keywords': ['vietcombank']},
    'techcombank': {'officialDomains': ['techcombank.com.vn'], 'keywords': ['techcombank']},
    'mbbank': {'officialDomains': ['mbbank.com.vn'], 'keywords': ['mbbank']},
    'momo': {'officialDomains': ['momo.vn'], 'keywords': ['momo']},
}

# Build SAFE_DOMAINS
SAFE_DOMAINS = set()
for bi in BRANDS_CONFIG.values():
    for d in bi['officialDomains']: SAFE_DOMAINS.add(d.lower().replace('www.', ''))
SAFE_DOMAINS.update([
    'google.com','facebook.com','paypal.com','microsoft.com','apple.com','amazon.com',
    'netflix.com','youtube.com','instagram.com','twitter.com','x.com','linkedin.com',
    'github.com','wikipedia.org','yahoo.com','bing.com','reddit.com','claude.ai',
    'fitgirl-repacks.site',
    'hutech.edu.vn','www.hutech.edu.vn','e-graduate.hutech.edu.vn',
    'portal.hutech.edu.vn','tuyensinh.hutech.edu.vn',
])

# Helper functions
def levenshtein(a, b):
    if len(a)<len(b): return levenshtein(b,a)
    if len(b)==0: return len(a)
    p=range(len(b)+1)
    for i,c1 in enumerate(a):
        c=[i+1]
        for j,c2 in enumerate(b): c.append(min(p[j+1]+1,c[j]+1,p[j]+(c1!=b[j])))
        p=c
    return p[-1]

def entropy(s):
    if not s: return 0.0
    f=Counter(s); n=len(s)
    return -sum((c/n)*math.log2(c/n) for c in f.values())

def is_ip(h): return bool(re.match(r'^\d{1,3}(\.\d{1,3}){3}$',h))
def is_private_ip(h): return bool(re.match(r'^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)',h)) or h=='localhost'
def is_homograph(h): return not bool(re.match(r'^[a-zA-Z0-9.-]+$',h))

def safe_decode(u):
    d=u
    for _ in range(3):
        try:
            n=urllib.parse.unquote(d)
            if n==d: break
            d=n
        except: break
    return d

def extract_features(urlStr):
    urlStr=safe_decode(urlStr)
    p=urllib.parse.urlparse(urlStr)
    hostname=re.sub(r'^www[0-9]*\.','',p.netloc)
    bare=p.scheme+'://'+hostname
    full_orig=urlStr.lower()
    pure=re.sub(r':\d+$','',hostname)
    parts=pure.split('.')
    tld='.'+parts[-1] if parts else ''
    susp=int(tld.lower() in SUSP_TLDS)
    digits=sum(c.isdigit() for c in bare)
    letters=sum(c.isalpha() for c in bare)
    features=[
        len(bare),bare.count('.'),bare.count('-'),bare.count('_'),bare.count('/'),
        sum(1 for c in bare if not re.match(r'[a-zA-Z0-9\-._~:/?#\[\]@!\$&()*+,;=%]',c)),
        digits/len(bare) if bare else 0, letters/len(bare) if bare else 0,
        1 if (p.port and str(p.port) not in ('80','443')) else 0,
        round(entropy(bare),4),
        len(pure),max(len(parts)-2,0),
        1 if re.match(r'^\d{1,3}(\.\d{1,3}){3}$',pure) else 0,
        1 if '@' in urlStr else 0, 0, susp, 1 if '-' in pure else 0, max(len(parts)-2,0),
        0,0,0,0,0,0,0,
        1 if any(kw in full_orig for kw in PHISHING_KW) else 0,
        0,
        1 if p.scheme=='https' else 0,
        1 if any(kw in full_orig for kw in ['signin','logon','authenticate','login']) else 0, susp,
    ]
    all_bk=[]
    for bi in BRANDS_CONFIG.values(): all_bk.extend(bi['keywords'])
    bid=1 if any(kw in hostname for kw in all_bk) else 0
    iod=0
    for bi in BRANDS_CONFIG.values():
        for od in bi['officialDomains']:
            oh=od.lower().replace('www.','')
            if hostname==oh or hostname.endswith('.'+oh): iod=1; break
    iimp=0
    for bn,bi in BRANDS_CONFIG.items():
        if not any(kw in hostname for kw in bi['keywords']): continue
        is_off=False
        for od in bi['officialDomains']:
            oh=od.lower().replace('www.','')
            if hostname==oh or hostname.endswith('.'+oh): is_off=True; break
        if not is_off: iimp=1; break
    hb=pure.split('.')[0]; md=999
    if len(hb)>=5:
        for bi in BRANDS_CONFIG.values():
            for od in bi['officialDomains']:
                ob=od.lower().replace('www.','').split('.')[0]
                if len(ob)>=5: md=min(md,levenshtein(hb,ob))
    ml=md if md<999 else 0
    it=1 if (md<=2 and md>0) else 0
    bc=sum(1 for kw in all_bk if kw in hostname)
    hpk=any(kw in full_orig for kw in PHISHING_KW)
    hpe=1 if (hpk or iimp) else 0
    ss=0
    if susp: ss+=3
    if iimp: ss+=4
    if md<=2 and md>0: ss+=3
    if hpk: ss+=2
    if bc>0: ss+=bc
    features.extend([bid,iod,iimp,ml,it,min(bc,5),hpe,min(ss,15)])
    return features

def traverse(t,f):
    lc=t['left_children'];rc=t['right_children'];si=t['split_indices'];sc=t['split_conditions'];bw=t['base_weights']
    n=0
    while lc[n]!=-1: n=lc[n] if f[si[n]]<sc[n] else rc[n]
    return bw[n]

def sigmoid(x): return 1/(1+math.exp(-x))

def check_brand(url):
    url=safe_decode(url)
    try: hostname=urllib.parse.urlparse(url).hostname.lower().replace('www.','')
    except: return False,0,''
    for bn,bi in BRANDS_CONFIG.items():
        if any(kw in hostname for kw in bi['keywords']):
            if any(hostname==od.lower().replace('www.','') for od in bi['officialDomains']): return False,0.01,'Official'
            for od in bi['officialDomains']:
                ob=od.lower().replace('www.','').split('.')[0]
                if len(hostname.split('.')[0])>=4 and len(ob)>=4:
                    d=levenshtein(hostname.split('.')[0],ob)
                    if 1<=d<=3: return True,0.90 if d<=2 else 0.85,f'Typosquatting "{bn}"'
            return True,0.85,f'Brand impersonation "{bn}"'
    hb=hostname.split('.')[0]
    if len(hb)>=4:
        for bn,bi in BRANDS_CONFIG.items():
            for od in bi['officialDomains']:
                oh=od.lower().replace('www.','')
                if hostname==oh or hostname.endswith('.'+oh): continue
                ob=oh.split('.')[0]
                if len(ob)>=4:
                    d=levenshtein(hb,ob)
                    if 1<=d<=3: return True,0.90 if d<=2 else 0.85,f'Typosquatting "{bn}" (d={d})'
    return False,0,''

def predict(url):
    url=safe_decode(url)
    try:
        hostname=urllib.parse.urlparse(url).hostname.lower().replace('www.','')
        tld='.'+hostname.split('.')[-1]
    except: return 0,'safe','Error'
    if hostname=='localhost': return 0.01,'safe','Localhost'
    if is_ip(hostname):
        if is_private_ip(hostname): return 0.01,'safe','Private IP'
    if is_homograph(hostname):
        ak=[]
        for bi in BRANDS_CONFIG.values(): ak.extend(bi['keywords'])
        if any(kw in hostname for kw in ak): return 0.95,'block','Homograph'
        return 0.70,'warning','Non-Latin'
    if hostname in SAFE_DOMAINS: return 0.01,'safe','Whitelist'
    if hostname in tranco_set: return 0.05,'safe','Tranco Top 30K'
    imp,bp,br=check_brand(url)
    if br=='Official': return bp,'safe','Official'
    if tld in SUSP_TLDS:
        fl=url.lower()
        if any(kw in fl for kw in PHISHING_KW): return 0.97,'block','Suspicious TLD + keywords'
        if imp: return 0.95,'block','Brand + Suspicious TLD'
        return 0.82,'block','Suspicious TLD'
    if imp: return bp,'block',br
    feat=extract_features(url)
    margin=sum(traverse(t,feat) for t in trees)
    prob=sigmoid(margin)
    if is_ip(hostname) and not is_private_ip(hostname):
        if prob>=0.85: return 0.75,'warning','Public IP (hạ bậc)'
        if prob>=0.40: return 0.55,'warning','Public IP'
    if prob>=0.85: return prob,'block','ML high risk'
    if prob>=0.60: return prob,'warning','ML suspicious'
    return prob,'safe','ML safe'

# ═══════════════════════════════════════════════════════════
# TEST URLS — 12 GROUPS
# ═══════════════════════════════════════════════════════════

G = []

# 1. Official domains (50) — phải SAFE
for d in ['google.com','facebook.com','amazon.com','microsoft.com','apple.com',
           'netflix.com','youtube.com','instagram.com','twitter.com','x.com',
           'linkedin.com','paypal.com','github.com','wikipedia.org','yahoo.com',
           'bing.com','reddit.com','stackoverflow.com','medium.com','dropbox.com',
           'slack.com','zoom.us','twitch.tv','spotify.com','tiktok.com']:
    G.append((f'https://www.{d}/','safe',f'Official: {d}'))
    G.append((f'https://{d}/','safe',f'Official no-www: {d}'))

# 2. Official subdomains (20) — phải SAFE
for u,d in [
    ('https://mail.google.com/','Google Mail'),('https://drive.google.com/','Google Drive'),
    ('https://docs.google.com/','Google Docs'),('https://gemini.google.com/','Gemini AI'),
    ('https://chat.openai.com/','ChatGPT'),('https://portal.hutech.edu.vn/','HUTECH Portal'),
    ('https://tuyensinh.hutech.edu.vn/','HUTECH Tuyển sinh'),
    ('https://e-graduate.hutech.edu.vn/','HUTECH E-grad'),
    ('https://pages.github.com/','GitHub Pages'),('https://developer.apple.com/','Apple Dev'),
    ('https://support.microsoft.com/','MS Support'),('https://news.ycombinator.com/','Hacker News'),
    ('https://gist.github.com/','GitHub Gist'),('https://api.github.com/','GitHub API'),
    ('https://raw.githubusercontent.com/','GitHub Raw'),
    ('https://myaccount.google.com/','Google Account'),('https://accounts.google.com/','Google Accounts'),
    ('https://play.google.com/','Google Play'),('https://maps.google.com/','Google Maps'),
    ('https://translate.google.com/','Google Translate'),
]:
    G.append((u,'safe',d))

# 3. Safe platforms subdomains (15) — phải SAFE
for d in ['user.github.io','myapp.vercel.app','mysite.netlify.app','app.pages.dev',
          'test.surge.sh','demo.vercel.app','blog.netlify.app','site.pages.dev',
          'project.github.io','app.surge.sh','landing.vercel.app','home.netlify.app',
          'portfolio.pages.dev','docs.github.io','static.vercel.app']:
    G.append((f'https://{d}/','safe',f'Platform: {d}'))

# 4. HUTECH specific (10) — phải SAFE
for u in ['https://hutech.edu.vn/','https://www.hutech.edu.vn/',
          'http://e-graduate.hutech.edu.vn/','https://e-graduate.hutech.edu.vn/',
          'https://hutech.edu.vn/tuyen-sinh','https://hutech.edu.vn/dao-tao',
          'https://portal.hutech.edu.vn/','https://tuyensinh.hutech.edu.vn/',
          'https://hutech.edu.vn/sinh-vien','https://hutech.edu.vn/tin-tuc']:
    G.append((u,'safe','HUTECH'))

# 5. Fitgirl fake sites (25) — phải BLOCK
for u in ['https://fitgirl-repack.com','https://fitgirlrepacks.org','https://fitgirl-repack.net',
          'https://fitgirlrepackz.com','https://fitgirltorrent.com','https://fitgirl-repacks.xyz',
          'https://fitgirl-repack.site','https://fitgirl-repacks.to','https://fitgirlrepacks.in',
          'https://fitgirl-repacks.us','https://fitgirl-repacks.cc','https://fitgirl-repacks.vip',
          'https://fitgirl-repacks.pro','https://fitgirl-repacks.website','https://fitgirlrepack.games',
          'https://fitgirl.cc','https://fitgirlrepacksite.com','https://fitgirlpack.site',
          'https://fitgirl-repacks.theproxy.vip','https://ww9.fitgirl-repacks.xyz',
          'https://fitgirl-repack.com/login','https://fitgirlrepacks.org/verify',
          'https://fitgirl-repack.net/download','https://fitgirl-repack.com/%6C%6F%67%69%6E',
          'https://fitgirl-repack.com/about/company/history/2023']:
    G.append((u,'block','Fitgirl fake'))

# 6. Brand typosquatting (30) — phải BLOCK
for u in ['https://paypa1.com/login','https://paypai.com/verify','https://goggle.com/search',
          'https://goog1e.com/login','https://faceb00k.com/login','https://faceboook.com/profile',
          'https://arnazon.com/account','https://micros0ft.com/login','https://app1e.com/apple-id',
          'https://netf1ix.com/billing','https://instagrarn.com/login','https://twltter.com/verify',
          'https://linkedln.com/profile','https://vletcombank.com/login','https://tech-combank.com/verify',
          'https://gogle.com','https://facebok.com','https://amazom.com','https://microsft.com',
          'https://applle.com','https://payypal.com','https://netfliix.com','https://linkedinn.com',
          'https://twiiter.com','https://instagrm.com','https://gooogle.com','https://amazzon.com',
          'https://microosft.com','https://app1e.id','https://paypaI.com/login']:
    G.append((u,'block','Brand typo'))

# 7. Known phishing patterns (30) — phải BLOCK
for u in ['http://paypal-verify-account.xyz/login','http://secure-banking-update.tk/verify',
          'http://vietcombank-secure.xyz/login','http://momo-verify-account.tk/login',
          'http://google-account-recovery.pw/verify','http://apple-id-locked.ml/update',
          'http://facebook-security-check.cf/login','http://netflix-payment-failed.xyz/update',
          'http://microsoft-security-alert.gq/verify','http://amazon-account-suspended.cf/login',
          'http://instagram-copyright-violation.tk/login','http://twitter-verify-identity.cf/confirm',
          'http://mbbank-security.cf/login','http://bidv-account-update.gq/verify',
          'http://agribank-security.ml/update','http://zalopay-security.cf/update',
          'http://visa-secure-payment.xyz/verify','http://mastercard-alert.tk/confirm',
          'http://paypal-secure-login.tk/verify/account','http://google-docs-share.xyz/login',
          'http://microsoft-office-activate.tk/verify','http://apple-icloud-locked.ml/update',
          'http://facebook-page-banned.tk/appeal','http://netflix-billing-issue.xyz/update',
          'http://amazon-order-suspended.cf/verify','http://instagram-copyright.cf/strike',
          'http://twitter-account-locked.tk/appeal','http://linkedin-restricted.tk/verify',
          'http://fitgirl-verify-account.xyz/login','http://steam-free-games.tk/login']:
    G.append((u,'block','Phishing pattern'))

# 8. Adversarial / Edge cases (20)
for u, expected, d in [
    ('http://192.168.1.1/login','safe','Private IP'),
    ('http://10.0.0.1/admin','safe','Private IP 10.x'),
    ('http://172.16.0.1/login','safe','Private IP 172.x'),
    ('http://127.0.0.1/','safe','Loopback'),
    ('http://localhost/','safe','Localhost'),
    ('http://1.2.3.4/secure/account/verify','warning','Public IP'),
    ('https://paypa\u043b.com/login','block','Homograph Cyrillic'),
    ('https://g\u00f6\u00f6gle.com/search','warning','Non-Latin'),
    ('https://fitgirl-repack.com/%6C%6F%67%69%6E','block','URL encoded'),
    ('https://fitgirl-repack.com/secure%2Faccount','block','URL encoded path'),
    ('https://secure.paypal.com.fake-site.xyz/login','block','Fake subdomain'),
    ('https://login.google.com.phishing.tk/verify','block','Fake login sub'),
    ('https://totally-legit-not-phishing.tk','block','Bare suspicious TLD'),
    ('https://definitely-not-a-scam.ml','block','Bare .ml'),
    ('http://evil-site.xyz:8080/login','block','Suspicious port'),
    ('http://phishing.tk:4444/secure','block','Suspicious port'),
    ('https://xn--gogle-1ta.com/search','safe','Punycode'),
    ('https://a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-r-s-t-u-v-w-x-y-z.xyz/login','block','Very long'),
    ('https://ggl.com','safe','Short domain'),
    ('https://fb.com','safe','FB short'),
]:
    G.append((u,expected,d))

# 9. Safe long-path URLs (15) — phải SAFE
for u in [
    'https://google.com/search?q=test+query+hello+world',
    'https://google.com/maps/place/New+York+City/coordinates',
    'https://github.com/torvalds/linux/commit/abc123def456',
    'https://wikipedia.org/wiki/Phishing#Types_and_methods',
    'https://reddit.com/r/programming/comments/xyz123/title_here',
    'https://stackoverflow.com/questions/12345/how-to-fix-this-bug',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxx&index=1',
    'https://facebook.com/settings?tab=security&ref=notif',
    'https://amazon.com/dp/B08N5WRWNW/ref=sr_1_1?keywords=laptop',
    'https://microsoft.com/en-us/windows/get-windows-11/download',
    'https://apple.com/iphone/compare/?models=iphone-15-pro-max',
    'https://netflix.com/title/80057281?trackId=xxx',
    'https://twitter.com/elonmusk/status/1234567890?s=20',
    'https://linkedin.com/in/john-doe-123456789/detail/contact-info',
    'https://hutech.edu.vn/tuyen-sinh/xet-tuyen-hoc-ba-nam-2026',
]:
    G.append((u,'safe','Safe long-path'))

# 10. Suspicious but not phishing (10) — phải SAFE
for u, expected, d in [
    ('https://tinyurl.com/abc123','safe','URL shortener'),
    ('https://bit.ly/3abc123','safe','Bitly shortener'),
    ('https://t.co/abc123','safe','Twitter shortener'),
    ('https://ow.ly/abc123','safe','Owly shortener'),
    ('https://rebrand.ly/my-link','safe','Rebrandly'),
    ('https://short.link/abc','safe','Generic shortener'),
    ('https://linktr.ee/username','safe','Linktree'),
    ('https://carrd.co/#about','safe','Carrd'),
    ('https://notion.site/page','safe','Notion'),
    ('https://canva.com/design/abc123','safe','Canva'),
]:
    G.append((u,expected,d))

# 11. Real phishing-style but safe (10) — phải SAFE
for u in [
    'https://en.wikipedia.org/wiki/Phishing',
    'https://www.consumer.ftc.gov/articles/how-recognize-avoid-and-report-phishing',
    'https://www.kaspersky.com/resource-center/definitions/what-is-phishing',
    'https://blog.google/safety/protect-yourself-from-phishing/',
    'https://support.apple.com/en-us/HT204759',
    'https://help.netflix.com/en/node/47',
    'https://www.paypal.com/us/security/fighting-phishing',
    'https://www.amazon.com/gp/help/customer/display.html?nodeId=201908320',
    'https://www.facebook.com/help/219557904731889',
    'https://security.microsoft.com/phishing',
]:
    G.append((u,'safe','Anti-phishing info pages'))

# 12. Random legit-looking domains (15) — phải SAFE
for d in ['cnn.com','bbc.com','reuters.com','nytimes.com','washingtonpost.com',
           'theguardian.com','forbes.com','bloomberg.com','cnbc.com','wsj.com',
           'nbcnews.com','abcnews.go.com','usatoday.com','time.com','businessinsider.com']:
    G.append((f'https://www.{d}/','safe',f'News: {d}'))

# ═══════════════════════════════════════════════════════════
# RUN TESTS
# ═══════════════════════════════════════════════════════════

group_names = ['Official domains','Official subdomains','Safe platforms','HUTECH',
               'Fitgirl fakes','Brand typosquatting','Known phishing','Adversarial/Edge',
               'Safe long-path','Suspicious but safe','Anti-phishing pages','News sites']
groups_sizes = [50, 20, 15, 10, 25, 30, 30, 20, 15, 10, 10, 15]

boundaries = []
cum = 0
for s in groups_sizes:
    boundaries.append((cum, cum+s))
    cum += s

group_results = {}
for i, name in enumerate(group_names):
    start, end = boundaries[i]
    group_results[name] = {'total':0, 'correct':0, 'wrong':[]}

all_correct = 0
all_total = 0

for idx, (url, expected, desc) in enumerate(G):
    prob, actual, reason = predict(url)
    is_correct = (actual == expected)
    all_total += 1
    if is_correct: all_correct += 1

    for gname, (start, end) in zip(group_names, boundaries):
        if start <= idx < end:
            group_results[gname]['total'] += 1
            if is_correct: group_results[gname]['correct'] += 1
            else: group_results[gname]['wrong'].append((url[:70], expected, actual, prob, reason))
            break

    status = 'PASS' if is_correct else 'FAIL'

    for gname, (start, end) in zip(group_names, boundaries):
        if start == idx:
            print(f'\n--- {gname} ---')
            break

# Summary
print(f'\n{"="*110}')
print(f'GROUP SUMMARY:')
print(f'{"="*110}')

for gname, stats in group_results.items():
    t = stats['total']
    c = stats['correct']
    pct = (c/t*100) if t>0 else 0
    icon = 'PASS' if pct==100 else 'FAIL'
    print(f'  [{icon}] {gname:30s}  {c}/{t} ({pct:.1f}%)')
    if stats['wrong']:
        for u,exp,act,prob,reason in stats['wrong'][:5]:
            print(f'        → {u}')
            print(f'          Expected: {exp}  Got: {act}  ({prob*100:.1f}%)  {reason}')

accuracy = (all_correct/all_total*100) if all_total>0 else 0
print(f'\n{"="*110}')
print(f'OVERALL: {all_correct}/{all_total} ({accuracy:.1f}%)')
print(f'{"="*110}')

if accuracy >= 99:
    print(f'\n🎉 XUẤT SẮC — {accuracy:.1f}% accuracy trên {all_total} URLs!')
elif accuracy >= 95:
    print(f'\n✅ TỐT — {accuracy:.1f}% accuracy')
else:
    failed = all_total - all_correct
    print(f'\n⚠️  CẦN CẢI THIỆN — {accuracy:.1f}% accuracy ({failed} URLs bị sai)')

print(f'\n{"="*110}\n')
