# Phishing URL Detector - Reporting Module

This directory contains the automated reporting, presentation generation, and defense preparation tools for the "Phishing URL Detector" project. It uses Node.js scripts to programmatically generate the thesis deliverables in `.docx` format.

## Project Overview
The goal of this module is to ensure consistency and professional formatting across all final project deliverables. By using code to generate documents, updates to project data, architecture, or false-positive fixes can be reflected in the documentation with minimal manual effort.

### Main Technologies
- **Node.js:** Execution environment for generation scripts.
- **docx (npm):** Library used for creating Word documents (`.docx`).
- **File System (fs):** Used for dynamic file versioning and reading local assets (like images).

## Building and Running

### Prerequisites
- Node.js installed.
- Dependencies installed via `npm install` (primarily the `docx` package).
- The scripts reference the `docx` library. Make sure the local or global path in the `require()` statement matches your environment.

### Generate Documents
All generated documents implement **Dynamic Versioning**. The scripts scan the directory for the highest existing version (e.g., `v9`) and automatically save the new file as the next version (e.g., `v10`), keeping your history clean.

To generate the **Thesis Report**:
```powershell
node generate_report.js
```
*(Output: `BaoCao_DACS_TranDuyThai_vX.docx`)*

To generate the **Presentation Script** (with professional layout, technical boxes, and Mermaid diagrams):
```powershell
node gen_thuyet_trinh.js
```
*(Output: `BAO_CAO_TIEN_DO_PRES_2304.docx`)*

To generate the **Q&A Defense Script** (Anticipated questions from the committee and answers):
```powershell
node gen_qna_defense.js
```
*(Output: `KICH_BAN_BAO_VE_DO_AN.docx`)*

## Key Files
- `generate_report.js`: The core logic for the massive thesis report, including styles, chapters, metrics, and tables.
- `gen_thuyet_trinh.js`: Generates the step-by-step presentation outline, combining technical explanations, 5-group feature categorization, and automated image injection (Mermaid diagrams).
- `gen_qna_defense.js`: Generates the "Armor" document—a list of the 10 most critical committee questions (Data sources, Zero-day defense, F1-Score, SMOTE, JSON deployment) with well-crafted, academic answers.
- `gen_week6.js`: Generates weekly progress reports.

## Development Conventions
- **Naming & Versioning:** Output files automatically increment their version numbers (`_v10.docx`).
- **Formatting:** Scripts define standard styles for "Times New Roman". `gen_thuyet_trinh.js` utilizes advanced formatting like `technicalBox()` and `imagePlaceholder()` to highlight technical details and guide the user on where to paste screenshots.
- **Structure:** The content strictly mirrors the actual Python and JS implementations, detailing concepts like the "Harmless Page Check" and "Reputation Bonus" directly in the defense scripts.
