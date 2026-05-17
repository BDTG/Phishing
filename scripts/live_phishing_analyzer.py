import os
import json
import socket
import requests
import whois
import pandas as pd
from datetime import datetime
from urllib.parse import urlparse
from tqdm import tqdm
import urllib3
import ssl
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

# Disable insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Config
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
OUTPUT_DIR = os.path.join(DATA_DIR, 'live_analysis')
RESPONSES_DIR = os.path.join(OUTPUT_DIR, 'responses')
os.makedirs(RESPONSES_DIR, exist_ok=True)

INPUT_CSV = os.path.join(DATA_DIR, 'raw', 'combined_dataset.csv')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def isIPAddress(hostname):
    ipv4Regex = r'^\d{1,3}(\.\d{1,3}){3}$'
    import re
    return re.match(ipv4Regex, hostname) is not None

def get_ip_info(ip):
    """Fetch IP Geo and ISP info from ip-api.com"""
    try:
        response = requests.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query", timeout=5)
        if response.status_code == 200:
            return response.json()
    except: pass
    return {}

def get_whois_info(domain):
    """Fetch WHOIS info for the domain"""
    try:
        w = whois.whois(domain)
        def format_date(d):
            if isinstance(d, list): d = d[0]
            if isinstance(d, datetime): return d.strftime('%Y-%m-%d %H:%M:%S')
            return str(d)
        return {
            "registrar": w.registrar,
            "creation_date": format_date(w.creation_date),
            "expiration_date": format_date(w.expiration_date),
            "updated_date": format_date(w.updated_date),
            "name_servers": w.name_servers,
            "emails": w.emails,
            "org": w.org
        }
    except: return {"error": "WHOIS lookup failed"}

def get_ssl_info(hostname):
    """Fetch SSL certificate details"""
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        with socket.create_connection((hostname, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                if not cert: return {"error": "No cert found"}
                import ssl as ssl_lib
                cert_dict = ssl_lib.DER_cert_to_PEM_cert(cert)
                # Simple extraction for demo
                return {"status": "Cert exists (Binary gathered)"}
    except: return {"error": "SSL handshake failed"}

def extract_advanced_content_features(html, url):
    """Extract Link Density and External Link features"""
    try:
        soup = BeautifulSoup(html, 'html.parser')
        domain = urlparse(url).netloc
        links = soup.find_all('a', href=True)
        total_links = len(links)
        external_links = 0
        internal_links = 0
        ip_links = 0
        for link in links:
            href = link['href']
            parsed_href = urlparse(href)
            if parsed_href.netloc and parsed_href.netloc != domain:
                external_links += 1
                if isIPAddress(parsed_href.netloc): ip_links += 1
            else: internal_links += 1
        text_content = soup.get_text()
        text_len = len(text_content)
        link_density = total_links / text_len if text_len > 0 else 0
        external_ratio = external_links / total_links if total_links > 0 else 0
        return {
            "total_links": total_links, "external_links": external_links,
            "internal_links": internal_links, "ip_links": ip_links,
            "link_density": link_density, "external_ratio": external_ratio
        }
    except: return {}

def check_live_and_analyze(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    result = {"url": url, "domain": domain, "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "is_live": False}
    try:
        response = requests.get(url, headers=HEADERS, timeout=5, verify=False, allow_redirects=True)
        if response.status_code == 200 and len(response.text) > 200:
            result["is_live"] = True
            result["status_code"] = response.status_code
            result["final_url"] = response.url
            
            # Save HTML
            safe_domain = domain.replace('.', '_').replace(':', '_')
            filename_base = f"{safe_domain}_{int(datetime.now().timestamp())}"
            html_path = os.path.join(RESPONSES_DIR, f"{filename_base}.html")
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            result["html_file"] = html_path
            result["content_analysis"] = extract_advanced_content_features(response.text, url)
            try:
                ip = socket.gethostbyname(domain)
                result["ip"] = ip
                result["ip_info"] = get_ip_info(ip)
                result["ssl"] = get_ssl_info(domain)
            except: result["ip"] = "Unknown"
            result["whois"] = get_whois_info(domain)
    except: pass
    return result

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Multi-threaded Phishing Site Live Analyzer")
    parser.add_argument("--url", help="Single URL to analyze")
    parser.add_argument("--csv", help="Path to CSV file with URLs", default=INPUT_CSV)
    parser.add_argument("--limit", type=int, help="Limit (0 for all)", default=10)
    parser.add_argument("--threads", type=int, help="Number of threads", default=20)
    args = parser.parse_args()

    print("="*60)
    print("🚀 MULTI-THREADED PHISHING SITE LIVE ANALYZER")
    print("="*60)

    analysis_results = []
    if args.url:
        res = check_live_and_analyze(args.url)
        if res["is_live"]: print(f"✅ LIVE: {args.url}"); analysis_results.append(res)
        else: print(f"❌ DEAD: {args.url}")
    else:
        if not os.path.exists(args.csv): return print(f"❌ Error: {args.csv} not found")
        df = pd.read_csv(args.csv)
        phishing_df = df[df['label'] == 1] if 'label' in df.columns else df
        
        test_urls = phishing_df['url'].tolist()
        if args.limit > 0: test_urls = test_urls[:args.limit]
        
        print(f"Total URLs to check: {len(test_urls)} using {args.threads} threads.")
        
        with ThreadPoolExecutor(max_workers=args.threads) as executor:
            futures = {executor.submit(check_live_and_analyze, url): url for url in test_urls}
            for future in tqdm(as_completed(futures), total=len(test_urls), desc="Scanning"):
                res = future.result()
                if res["is_live"]:
                    analysis_results.append(res)

    timestamp = int(datetime.now().timestamp())
    report_path = os.path.join(OUTPUT_DIR, f"full_analysis_report_{timestamp}.json")
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_results, f, indent=4, ensure_ascii=False)

    print(f"\n🎉 Done! Found {len(analysis_results)} live sites. Report: {report_path}")

if __name__ == "__main__":
    main()
