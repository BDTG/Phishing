# Phishing URL Detector - Chrome Extension

This directory contains the source code for the Chrome Extension part of the Phishing URL Detector project. It implements a real-time, multi-layered defense system to protect users from phishing attacks directly in the browser.

## Project Overview
The extension uses a combination of whitelists, blacklists, heuristics, brand impersonation detection, and a machine learning model (XGBoost) to evaluate the risk of the current URL. It prioritizes user privacy by performing all analysis locally within the browser (100% offline, except for RDAP domain age checks).

### Multi-Layer Defense Architecture
The detection logic follows an 8-layer approach (summarized in `xgboost_predictor.js`):
- **Layer 0:** URL Preprocessing (Decoding) & Localhost/Private IP detection.
- **Layer 1:** Whitelists (Manual `SAFE_DOMAINS` like `cs.rin.ru`, `kwindu.eu` & Tranco Top 30K).
- **Layer 2:** Blacklist (`dangerous_urls.json`).
- **Layer 3:** Brand Impersonation (Levenshtein Distance & Keyword matching).
- **Layer 4:** Suspicious TLD Rules (Applies a "Soft Penalty" instead of a hard block to prevent false positives).
- **Layer 5:** **XGBoost ML Model** (Primary Layer - 39 features).
- **Layer 6:** DOM Content Analysis (`content_analyzer.js`). Includes Password Form detection and the **Harmless Page Check** (Reduces AI risk probability by 70% if no input forms exist).
- **Layer 7:** Domain Age Check (`domain_age_checker.js` using RDAP API). Includes a **Reputation Bonus** (Reduces risk for old domains or reputable TLDs like `.vn`, `.edu`, `.eu` even if network errors occur).

## Key Files & Structure
- `manifest.json`: Extension configuration (Manifest V3). Defines the script injection order:
    1. `feature_extractor.js`
    2. `xgboost_predictor.js`
    3. `content_analyzer.js`
    4. `content.js`
- `feature_extractor.js`: Extracts 39 features from the URL (length, entropy, keywords, brand distance, etc.). MUST be synchronized with `code/02_feature_extraction_v3.py`.
- `xgboost_predictor.js`: The core inference engine. It loads the JSON model, runs the 8-layer pipeline, and handles the post-processing logic (Reputation Bonus, Harmless Check integration).
- `content_analyzer.js`: Scans the DOM for phishing signals and implements `isPageHarmless()`.
- `content.js`: The main driver. It calls the predictor, coordinates the results, and injects warning/safe banners into the page.
- `background.js`: A Manifest V3 service worker that manages the extension icon's state and acts as a proxy for RDAP API fetches (with a 10-second timeout).
- `models/`: Contains the trained XGBoost models in JSON format (`xgboost_model_v4.json`).
- `data/`: Supporting data files like `tranco_top30k.json` and `dangerous_urls.json`.

## Building and Running
1.  **Load the Extension:**
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked** and select this `extension/` directory.
2.  **Testing:**
    - Navigate to any URL. The extension will automatically analyze the site.
    - Check the extension icon in the toolbar (Green: Safe, Yellow: Warning, Red: Block).
    - Phishing or suspicious sites will trigger a top banner with detailed detection reasons (Explainable AI).

## Development Conventions
- **Feature Matching:** The 39 features extracted in `feature_extractor.js` MUST match the order and logic used during the Python training phase.
- **JSON Model:** The XGBoost model is exported from Python using a custom JSON format that `xgboost_predictor.js` can parse and execute.
- **UI Injection:** Warnings are injected as fixed banners at the top of the `document.documentElement`.
- **False Positive Handling:** Always prefer soft penalties (Layer 4), Harmless Page checks (Layer 6), and Reputation Bonuses (Layer 7) over hard-blocking legitimate sites to maintain a good user experience.
