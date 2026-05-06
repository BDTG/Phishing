import pandas as pd
import requests
import urllib3
import time

# Disable insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

print("="*60)
print("🔍 TÌM KIẾM URL PHISHING CÒN SỐNG (LIVE URLs)")
print("="*60)

# 1. Đọc dữ liệu PhishTank
data_path = 'code/data/phishtank_raw.csv'
try:
    df = pd.read_csv(data_path)
    print(f"Đã nạp {len(df)} URLs từ PhishTank.")
except Exception as e:
    print(f"Lỗi đọc file: {e}")
    exit()

# Xáo trộn ngẫu nhiên để không bị kẹt ở các link cũ
df = df.sample(frac=1, random_state=int(time.time())).reset_index(drop=True)

live_urls = []
target_live_count = 10 # Tìm 10 link sống để test
checked_count = 0

print(f"\nĐang rà quét để tìm {target_live_count} URLs lừa đảo còn hoạt động...")
print("Quá trình này có thể mất vài phút vì hầu hết các link phishing chết rất nhanh.\n")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

for index, row in df.iterrows():
    url = row['url']
    checked_count += 1
    
    try:
        # Gửi request với timeout ngắn (3 giây) để lướt qua nhanh các link chết
        response = requests.get(url, headers=headers, timeout=3, verify=False)
        
        # Nếu trả về HTTP 200 OK và có HTML content
        if response.status_code == 200 and len(response.text) > 100:
            print(f"[✅ SỐNG] {url}")
            live_urls.append(url)
            
            if len(live_urls) >= target_live_count:
                break
    except requests.exceptions.RequestException:
        # Bỏ qua các lỗi connection timeout, SSL error...
        pass
        
    if checked_count % 100 == 0:
        print(f"  ... Đã quét {checked_count} URLs, tìm được {len(live_urls)} link sống.")

print("\n" + "="*60)
print(f"🎉 Đã tìm thấy {len(live_urls)} URLs phishing còn hoạt động (sau khi quét {checked_count} links)!")
print("Bạn có thể copy danh sách này để cho vào file 07_extract_html_features_poc.py:")
for u in live_urls:
    print(f'    {{"url": "{u}", "label": 1}},')
print("="*60)
