import os
import time
import requests
import pandas as pd
import numpy as np
from bs4 import BeautifulSoup
import re

print("="*60)
print("🔍 TẠO DATASET CHO MÔ HÌNH CONTENT-BASED (HTML DOM ANALYSIS)")
print("="*60)

# Danh sách URL mẫu (Vì tải HTML thực tế tốn rất nhiều thời gian, ta dùng mẫu nhỏ để demo)
urls = [
    {"url": "https://www.google.com", "label": 0},
    {"url": "https://github.com", "label": 0},
    {"url": "https://vnexpress.net", "label": 0},
    {"url": "http://example.com", "label": 0},
    # Mô phỏng các trang lừa đảo (Vì URL lừa đảo thật thường chết rất nhanh, ta dùng URL có cấu trúc giống để test hoặc mock)
    {"url": "https://github.com/login", "label": 1}, # Gán nhãn 1 tạm thời để demo form đăng nhập
]

def extract_html_features(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. Số lượng ô nhập mật khẩu
    num_password_inputs = len(soup.find_all('input', type='password'))
    
    # 2. Số lượng iframe ẩn
    num_hidden_iframes = 0
    for iframe in soup.find_all('iframe'):
        style = iframe.get('style', '').replace(' ', '')
        if 'display:none' in style or 'visibility:hidden' in style or iframe.get('width') == '0':
            num_hidden_iframes += 1
            
    # 3. Số lượng form gửi dữ liệu ra ngoài (External Actions)
    num_external_forms = 0
    # (Trong thực tế cần check action url so với hostname, ở đây làm đơn giản)
    for form in soup.find_all('form'):
        action = form.get('action', '')
        if action.startswith('http'): num_external_forms += 1

    # 4. Tỷ lệ thẻ Script so với tổng HTML
    script_len = sum([len(s.text) for s in soup.find_all('script')])
    html_len = len(html_content)
    script_to_html_ratio = script_len / html_len if html_len > 0 else 0

    # 5. Link tải mã độc
    num_malware_links = 0
    malicious_exts = ['.exe', '.apk', '.bat']
    for a in soup.find_all('a'):
        href = str(a.get('href')).lower()
        if any(ext in href for ext in malicious_exts):
            num_malware_links += 1

    # 6. Từ khóa thao túng tâm lý
    text = soup.get_text().lower()
    suspicious_regex = r'\b(tài khoản|mật khẩu|bị khóa|xác minh|đăng nhập|login|password)\b'
    num_suspicious_words = len(re.findall(suspicious_regex, text))

    return {
        'num_password_inputs': num_password_inputs,
        'num_hidden_iframes': num_hidden_iframes,
        'num_external_forms': num_external_forms,
        'script_to_html_ratio': script_to_html_ratio,
        'num_malware_links': num_malware_links,
        'num_suspicious_words': num_suspicious_words
    }

dataset = []

for item in urls:
    print(f"Đang tải HTML từ: {item['url']} ...")
    try:
        # Giả lập Browser để tránh bị chặn
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(item['url'], headers=headers, timeout=5)
        
        features = extract_html_features(response.text)
        features['url'] = item['url']
        features['label'] = item['label']
        
        dataset.append(features)
        print(" -> Trích xuất DOM thành công!")
    except Exception as e:
        print(f" -> Lỗi tải trang: {e}")

# Lưu ra file CSV
os.makedirs('data', exist_ok=True)
df = pd.DataFrame(dataset)
df.to_csv('data/html_features_poc.csv', index=False)

print("\nĐã tạo xong Dataset cho mô hình HTML: data/html_features_poc.csv")
print(df.head())
