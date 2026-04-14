# Phishing URL Detector - ML Pipeline Context

This directory contains the Machine Learning pipeline for the Phishing URL Detector project. It handles data collection, feature extraction, and model training using XGBoost.

## Project Overview
The pipeline is designed to create a lightweight, high-performance XGBoost model that can be exported to a JSON format for use in a Chrome Extension's JavaScript inference engine.

### Key Components
- **Data Collection:** Scripts to fetch and combine phishing and legitimate URLs.
- **Feature Extraction:** A robust engine that extracts 39 lexical and brand-related features from full URLs.
- **Model Training:** XGBoost-based training with performance evaluation (Accuracy, F1, ROC-AUC).
- **Extension Support:** Scripts to prepare whitelists (Tranco Top 30K) for the browser extension.

## Tech Stack
- **Language:** Python 3.12+
- **Libraries:** XGBoost, Scikit-learn, Pandas, Numpy, Requests, Tqdm.

## ML Pipeline Workflow

### 1. Data Collection & Augmentation
- `python 01_collect_data.py`: Fetches verified phishing URLs from PhishTank and legitimate domains from Tranco.
- `python 01a_augment_brand_data.py`: Generates synthetic brand-impersonation URLs to improve model robustness against phishing targets (e.g., PayPal, Microsoft, Fitgirl).

### 2. Feature Extraction
- `python 02_feature_extraction_v3.py`: Processes the collected URLs into a 39-feature dataset.
  - **Features include:** URL length, digit count, special characters, entropy, TLD checks, keyword presence, and brand distance.
  - **Output:** `data/features_v4.csv`

### 3. Model Training
- `python 03_train_model_v4.py`: Trains the XGBoost model using the extracted features.
  - **Output:** `data/xgboost_model_v4.json` (Optimized for JS inference).
  - **Evaluation:** Generates metrics and confusion matrices.

### 4. Extension Integration
- `python 04_prepare_tranco_top30k.py`: Downloads and prepares the Tranco Top 30,000 domains as a JSON whitelist for the extension.
  - **Output:** `../extension/data/tranco_top30k.json`

## Development Conventions
- **Naming:** Files are versioned (e.g., `v3`, `v4`) to track improvements in features and models.
- **Data Storage:** All raw and processed data, as well as final models, are stored in the `data/` directory.
- **Scripting:** Scripts should be run with `-X utf8` to handle special characters in URLs correctly (e.g., `python -X utf8 01_collect_data.py`).

## Key Files
- `data/features_v4.csv`: The primary dataset used for training the current model version.
- `data/xgboost_model_v4.json`: The final model used by the Chrome Extension.
- `02_feature_extraction_v3.py`: The "source of truth" for feature extraction logic (must be mirrored in the extension's JS).
