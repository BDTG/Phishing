# Phishing Extension Testing Tools

## Overview
This directory contains testing tools for your Phishing URL Detector browser extension.

## Test Results (Latest Run: 2026-04-08 19:29:04)
- **Accuracy**: 100.00%
- **True Positives**: 19 (phishing sites correctly detected)
- **True Negatives**: 25 (safe sites correctly identified)
- **False Positives**: 0
- **False Negatives**: 0

## Files

### Testing Scripts
1. **`single_test_run.py`** - Run once and show results immediately
   ```bash
   py single_test_run.py
   ```

2. **`continuous_phishing_test.py`** - Run continuously every 5 minutes
   ```bash
   py continuous_phishing_test.py
   ```
   Press `Ctrl+C` to stop

3. **`run_test.bat`** - Windows batch file to run tests easily

4. **`test_fitgirl.py`** - Specific test for Fitgirl repack mirror sites

### Test Results
- **`test_results_single.json`** - Latest test results
- **`test_results.json`** - Historical test results (from continuous testing)

## How to Add New URLs to Test

Edit the URL lists in `single_test_run.py` or `continuous_phishing_test.py`:

```python
# Add known phishing URLs (should be detected as phishing)
KNOWN_PHISHING_URLS = [
    'https://new-phishing-site.xyz/login',
    # ... more URLs
]

# Add known safe URLs (should be detected as safe)
KNOWN_SAFE_URLS = [
    'https://legitimate-site.com',
    # ... more URLs
]

# Add URLs to test (will show prediction but no ground truth)
URLS_TO_TEST = [
    'https://suspicious-site.tk/verify',
    # ... more URLs
]
```

## Understanding Results

### Good Result (No Action Needed)
```
SUMMARY:
  True Positives:  19
  True Negatives:  25
  False Positives: 0
  False Negatives: 0
  Accuracy: 100.00%
```

### Bad Result (Action Needed)
```
CRITICAL: FALSE NEGATIVES - PHISHING NOT DETECTED!
  - https://phishing-site.xyz/login (prob: 25.50%)

>>> Update model or rules to catch these! <<<
```

When you see false negatives, it means:
1. The URL IS phishing (ground truth)
2. But the tool marked it as SAFE (prediction < 50%)
3. **You need to update the model or rules**

## How the Detection Works

The extension uses **two-layer detection**:

### Layer 1: URL-based ML (XGBoost)
- Extracts 30 features from URL
- Predicts phishing probability
- Threshold: ≥ 50% = phishing

### Layer 2: Content Analysis (DOM)
- Checks for password forms
- Checks for external form actions
- Checks for brand impersonation
- Checks for hidden iframes
- Checks for credit card requests

### Final Decision
```
final_prob = max(ml_prob, content_score)

Alert if:
  - final_prob >= 80%  OR
  - (ml_prob >= 50% AND content_score >= 20%)
```

## Suspicious TLDs (Auto-flagged)
These TLDs are automatically flagged as suspicious:
- `.xyz`, `.tk`, `.pw`, `.cc`, `.top`, `.club`, `.online`
- `.site`, `.icu`, `.gq`, `.ml`, `.cf`, `.ga`, `.vip`, `.pro`
- `.website`, `.games`

If URL has suspicious TLD + phishing keywords → 97% probability
If URL has suspicious TLD only → 75% probability

## Whitelist (Safe Domains)
These domains are always considered safe:
- `google.com`, `facebook.com`, `amazon.com`, `microsoft.com`
- `apple.com`, `netflix.com`, `youtube.com`, `instagram.com`
- `twitter.com`, `linkedin.com`, `paypal.com`, `github.com`
- `wikipedia.org`, `yahoo.com`, `reddit.com`
- Vietnamese banks: `vietcombank.com.vn`, `techcombank.com.vn`, etc.

## Running Tests Regularly

### Option 1: Manual Testing
Run `single_test_run.py` whenever you want to test:
```bash
cd "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension"
py single_test_run.py
```

### Option 2: Continuous Testing
Run `continuous_phishing_test.py` in background:
```bash
cd "C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension"
start /B py continuous_phishing_test.py
```
This will test every 5 minutes and save results to `test_results.json`.

### Option 3: Scheduled Testing (Windows Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task → "Phishing Test"
3. Trigger: Daily every hour
4. Action: Start program
   - Program: `py`
   - Arguments: `single_test_run.py`
   - Start in: `C:\Users\BDTG\Desktop\Đồ Án Cơ Sở\extension`

## Interpreting Fitgirl Test Results

The Fitgirl test shows how the extension handles lookalike domains:

**Legitimate site**: `https://fitgirl-repacks.se` → 5.7% (SAFE) ✓

**Suspicious mirrors** (detected as phishing due to suspicious TLDs):
- `.site`, `.website`, `.games`, `.cc`, `.xyz`, `.pro`, `.vip` → 75%

**Safe mirrors** (common TLDs, no suspicious keywords):
- `.com`, `.org`, `.co`, `.in`, `.net`, `.to`, `.us` → 5-8% (SAFE)

**Note**: Some legitimate mirror sites might use suspicious TLDs. These will be flagged as phishing by the extension. This is a **design choice** - better to have false positives than miss real phishing sites.

## Next Steps

1. **Add more real phishing URLs** from PhishTank, OpenPhish, URLhaus
2. **Monitor false negatives** - these are the most important to fix
3. **Update the model** if you find patterns that aren't caught
4. **Test with actual browser** - install extension and visit test sites
5. **Share results** in your báo cáo tiến độ
