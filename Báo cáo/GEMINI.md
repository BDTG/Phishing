# Phishing URL Detector - Reporting Module

This directory contains the automated reporting and presentation generation tools for the "Phishing URL Detector" project. It uses Node.js scripts to programmatically generate the thesis report and presentation slides.

## Project Overview
The goal of this module is to ensure consistency and professional formatting across the final project deliverables. By using code to generate documents, updates to project data or architecture can be reflected in the documentation with minimal manual effort.

### Main Technologies
- **Node.js:** Execution environment for generation scripts.
- **docx (npm):** Library used for creating Word documents (`.docx`).
- **pptxgenjs (npm):** Library used for creating PowerPoint presentations (`.pptx`).

## Building and Running

### Prerequisites
- Node.js installed.
- Dependencies installed via `npm install` (primarily `pptxgenjs`).
- **Note on `docx`:** The `generate_report.js` script currently references `docx` via an absolute path to a global installation (`C:/Users/BDTG/AppData/Roaming/npm/node_modules/docx`). If running on a different machine, this path may need to be updated or replaced with a local `require('docx')`.

### Generate Report
To generate the latest version of the thesis report:
```powershell
node generate_report.js
```
The output file is typically named `BaoCao_DACS_TranDuyThai_v9.docx` (or similar versioned names).

### Generate Slides
To generate the presentation slides:
```powershell
node generate_slides.js
```
The output file is named `Slide_DACS_TranDuyThai.pptx`.

## Key Files
- `generate_report.js`: The core logic for report generation, including styles, structure (chapters, sections), and content injection.
- `generate_slides.js`: The script for creating a modern, ocean-themed presentation with technical diagrams and project highlights.
- `BaoCao_DACS_TranDuyThai_v*.docx`: Various versions of the generated report.
- `Slide_DACS_TranDuyThai.pptx`: The generated presentation file.
- `package.json`: Contains the `pptxgenjs` dependency.

## Development Conventions
- **Naming:** Reports are versioned (e.g., `v7`, `v9`) to track progress and feedback.
- **Formatting:** `generate_report.js` defines standard styles for "Times New Roman" at specific sizes (13pt for body, 16pt for chapters, etc.) to meet university thesis requirements.
- **Layout:** `generate_slides.js` uses a `LAYOUT_WIDE` (16:9) aspect ratio with a custom color palette (`bgDark`, `accent`, etc.) for a modern technical look.
