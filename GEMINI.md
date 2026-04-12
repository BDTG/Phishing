# Phishing URL Detector - Project Context

This project is a university capstone project (**Đồ Án Cơ Sở**) focused on building a real-time phishing URL detection system using **Machine Learning (XGBoost)** and a **Chrome Extension**.

## Project Overview
The system detects phishing URLs directly in the browser without sending data to a server, prioritizing user privacy. It employs a **8-layer defense architecture**, with a trained XGBoost model as the primary decision engine.

### Key Components
1.  **ML Pipeline (`/code`):** Python-based workflow for data collection, feature extraction (39 features), and model training.
2.  **Chrome Extension (`/extension`):** A Manifest V3 extension that implements the XGBoost inference engine in pure JavaScript.
3.  **Automated Reporting (`/Báo cáo`):** A Node.js script (`generate_report.js`) that generates the final thesis report in `.docx` format.

## Tech Stack
- **Languages:** Python 3.12+, JavaScript (Vanilla), Node.js.
- **ML Frameworks:** XGBoost, Scikit-learn, Pandas.
- **Browser Platform:** Chrome Extension Manifest V3.
- **Documentation:** `docx` npm library for automated report generation.

## Multi-Layer Defense Architecture
The detection logic in `extension/xgboost_predictor.js` follows these layers:
- **Layer 0:** Localhost & IP Address detection.
- **Layer 1:** User Whitelist/Blocklist.
- **Layer 2:** Hardcoded Safe Domains & Tranco Top 30K Whitelist.
- **Layer 3:** Brand Impersonation (Levenshtein Distance).
- **Layer 4:** Suspicious TLD & Keyword Rules.
- **Layer 5:** **XGBoost ML Model** (Primary Layer - 39 features).
- **Layer 6:** DOM Content Analysis (Forms, iframes).
- **Layer 7:** Domain Age Check (RDAP API).

## Building and Running

### ML Training Workflow
1.  **Collect Data:** `python code/01_collect_data.py`
2.  **Feature Extraction:** `python code/02_feature_extraction_v3.py` (generates `features_v4.csv`)
3.  **Train Model:** `python code/03_train_model_v4.py` (outputs `xgboost_model_v4.json`)
4.  **Deploy to Extension:** Copy `xgboost_model_v4.json` to `extension/models/` and update `xgboost_predictor.js` to reference the new version.

### Running the Extension
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode**.
3.  Click **Load unpacked** and select the `extension/` directory.

### Generating the Report
1.  Navigate to the `Báo cáo/` directory.
2.  Run `npm install` (if not already done).
3.  Run `node generate_report.js` to create the latest `BaoCao_DACS_TranDuyThai_Final.docx`.

## Development Conventions
- **Naming:** Files are versioned (e.g., `v2`, `v4`) to track improvements in features and models.
- **Extension Files:**
    - `feature_extractor.js`: Shared logic for URL feature extraction (must match Python logic).
    - `xgboost_predictor.js`: Core inference logic.
    - `background.js`: Manages icon states and service worker tasks.
    - `content.js`: Main script for UI injection (warnings/banners).
- **Documentation:** `KE_HOACH_DU_AN.md` contains the detailed roadmap and technical notes for the XGBoost JSON format.

## Key Files
- `extension/manifest.json`: Extension configuration.
- `extension/xgboost_predictor.js`: The "brain" of the extension.
- `code/03_train_model_v4.py`: Latest training logic.
- `KE_HOACH_DU_AN.md`: Project roadmap and critical technical constraints.
