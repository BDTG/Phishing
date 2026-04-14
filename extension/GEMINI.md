# Phishing URL Detector - Chrome Extension

This directory contains the source code for the Chrome Extension part of the Phishing URL Detector project. It implements a real-time, multi-layered defense system to protect users from phishing attacks directly in the browser.

## Project Overview
The extension uses a combination of whitelists, heuristics, brand impersonation detection, and a machine learning model (XGBoost) to evaluate the risk of the current URL. It prioritizes user privacy by performing all analysis locally within the browser.

### Multi-Layer Defense Architecture
The detection logic follows an 8-layer approach (summarized in `xgboost_predictor.js` and `content.js`):
- **Layer 0:** Localhost & IP Address detection.
- **Layer 1:** Whitelists (Manual `SAFE_DOMAINS` & Tranco Top 30K).
- **Layer 2:** Brand Impersonation (Levenshtein Distance & Keyword matching).
- **Layer 3:** Suspicious TLD & Keyword Rules.
- **Layer 4:** **XGBoost ML Model** (Primary Layer - 38 features).
- **Layer 5:** DOM Content Analysis (Forms, iframes, via `content_analyzer.js`).
- **Layer 6:** Domain Age Check (RDAP API, via `domain_age_checker.js`).

## Key Files & Structure
- `manifest.json`: Extension configuration (Manifest V3). Defines the script injection order:
    1. `feature_extractor.js`
    2. `xgboost_predictor.js`
    3. `content_analyzer.js`
    4. `content.js`
- `feature_extractor.js`: Extracts 38 features from the URL (length, entropy, keywords, brand distance, etc.).
- `xgboost_predictor.js`: The core inference engine. It loads the JSON model and traverses trees in JavaScript.
- `content.js`: The main driver. It coordinates the different layers, fuses the results, and injects warning banners into the page.
- `background.js`: A Manifest V3 service worker that manages the extension icon's state (safe/warning/block) based on detection results.
- `models/`: Contains the trained XGBoost models in JSON format (`xgboost_model_v2.json`).
- `data/`: Supporting data files like `tranco_top30k.json` and `dangerous_urls.json`.

## Building and Running
1.  **Load the Extension:**
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked** and select this `extension/` directory.
2.  **Testing:**
    - Navigate to any URL. The extension will automatically analyze the site.
    - Check the extension icon in the toolbar (Green: Safe, Yellow: Warning, Red: Block).
    - Phishing or suspicious sites will trigger a top banner with detailed detection reasons.

## Development Conventions
- **Feature Matching:** The 38 features extracted in `feature_extractor.js` MUST match the order and logic used during the Python training phase (located in the `../code` directory of the root project).
- **JSON Model:** The XGBoost model is exported from Python using a custom JSON format that `xgboost_predictor.js` can parse and execute.
- **UI Injection:** Warnings are injected as fixed banners at the top of the `document.documentElement` to ensure visibility over most website layouts.
- **Icon States:**
    - `default` (Gray): Loading or non-HTTP page.
    - `safe` (Green): Low probability of phishing.
    - `warning` (Yellow): Suspicious indicators found.
    - `block` (Red): High probability of phishing or confirmed brand impersonation.
