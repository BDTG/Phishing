# Phishing URL Detector - Project Context

This project is a university capstone project (**Đồ Án Cơ Sở**) focused on building a real-time phishing URL detection system using **Machine Learning (XGBoost)** and a **Chrome Extension**.

## Project Overview
The system detects phishing URLs directly in the browser without sending data to a server, prioritizing user privacy. It employs a **Defense in Depth (8-layer)** architecture, with a trained XGBoost model as the primary decision engine, supported by heuristic rules and DOM analysis.

### Key Components
1.  **ML Pipeline (`/code`):** Python-based workflow for automated data collection (`01_collect_data.py`), data augmentation (`01a_augment_brand_data.py`), feature extraction (39 features via `02_feature_extraction_v3.py`), and model training with hyperparameter tuning (`03_train_model_v4.py`).
2.  **Chrome Extension (`/extension`):** A Manifest V3 extension that implements the XGBoost inference engine in pure JavaScript (`xgboost_predictor.js`), functioning 100% offline.
3.  **Automated Reporting (`/Báo cáo`):** Node.js scripts (`generate_report.js`, `gen_thuyet_trinh.js`, `gen_qna_defense.js`) that programmatically generate the thesis report, presentation outlines, and Q&A defense scripts in `.docx` format using dynamic versioning.

## Tech Stack
- **Languages:** Python 3.12+, JavaScript (Vanilla), Node.js.
- **ML Frameworks:** XGBoost, Scikit-learn, Pandas, Imbalanced-learn (SMOTE).
- **Browser Platform:** Chrome Extension Manifest V3.
- **Documentation:** `docx` npm library for automated report generation.

## Multi-Layer Defense Architecture
The detection logic in `extension/xgboost_predictor.js` follows these 8 layers:
- **Layer 0-2 (Fast Filtering):** URL decoding, Private/Local IP detection, Safe Domains Whitelist (including manual overrides like `kwindu.eu`, `cs.rin.ru`), Tranco Top 30K, and Blacklist database (`dangerous_urls.json`).
- **Layer 3-4 (Heuristics):** Brand Impersonation detection (using Levenshtein distance for typosquatting) and Suspicious TLD rules (applying "Soft Penalty" for `.xyz`, `.tk` instead of a hard block).
- **Layer 5 (Core Engine):** **XGBoost ML Model**. Analyzes 39 lexical features to predict phishing probability.
- **Layer 6 (Content Analysis):** DOM Analysis inside `content_analyzer.js`. Scans for password forms and applies the **Harmless Page Check** (reducing ML risk by 70% if no input forms exist, minimizing false positives on content-only sites).
- **Layer 7 (Domain Age Check):** Queries RDAP API for domain registration dates. Applies a **Reputation Bonus** (reducing risk for old domains or reputable TLDs like `.vn`, `.eu`, `.ru` even if network timeouts occur).

## Building and Running

### ML Training Workflow
1.  **Collect Data:** `python code/01_collect_data.py` (Downloads raw data from PhishTank, Tranco).
2.  **Data Augmentation:** `python code/01a_augment_brand_data.py` (Generates synthetic zero-day phishing samples).
3.  **Feature Extraction:** `python code/02_feature_extraction_v3.py` (Generates `features_v4.csv`).
4.  **Train Model:** `python code/03_train_model_v4.py` (Applies SMOTE, tunes hyperparameters, outputs `xgboost_model_v4.json`).
5.  **Deploy to Extension:** Copy `xgboost_model_v4.json` to `extension/models/` and `tranco_top30k.json` to `extension/data/`.

### Running the Extension
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode**.
3.  Click **Load unpacked** and select the `extension/` directory.

### Generating the Report and Presentation
1.  Navigate to the `Báo cáo/` directory.
2.  Run `npm install` (if not already done).
3.  Run `node generate_report.js` to create the thesis report (automatically increments version, e.g., `BaoCao_DACS_TranDuyThai_v10.docx`).
4.  Run `node gen_thuyet_trinh.js` for the presentation script.
5.  Run `node gen_qna_defense.js` for the defense Q&A script.

## Development Conventions
- **Naming:** Files are versioned (e.g., `v3`, `v4`) to track improvements in features and models. Old versions are kept in `archive` folders.
- **Extension Files:**
    - `manifest.json`: Configuration and script injection order.
    - `feature_extractor.js`: Shared logic for URL feature extraction (MUST match Python logic 100%).
    - `xgboost_predictor.js`: Core inference logic and 8-layer fusion.
    - `content_analyzer.js`: DOM scanning and harmless page detection.
    - `background.js`: Handles background RDAP fetch requests with a 10-second timeout and manages extension icons.
    - `content.js`: Main script for UI injection (warnings/banners).
