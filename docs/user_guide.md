# Memora User Guide

Welcome to **Memora**, your personal real-time memory layer. Memora runs passively in your browser to capture, index, and organize what you read, making it instantly searchable and synthesized when you need it.

This guide covers everything you need to know to get started and get the most out of Memora as your digital second brain.

---

## 1. Getting Started

### 1.1 Installing the Extension
To load the extension into your browser:
1. Open Google Chrome or any Chromium-based browser and navigate to `chrome://extensions/`.
2. Toggle the **Developer mode** switch in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/dist` folder in your Memora workspace directory.
5. Pin the **Memora** extension to your toolbar for quick access.

---

## 2. Capture (F01 - F05)

Memora provides multiple ways to capture information, ranging from fully automatic to targeted manual saves.

### 2.1 Passive Auto-Capture
By default, Memora captures the text content of pages you visit after a short dwell time (default: 5 seconds) to ensure only read content is indexed.
*   **Toggle Auto-Capture:** Click the Memora extension icon in your browser toolbar to toggle auto-capture on or off for the active site or globally.
*   **Blacklists:** In the extension settings, you can add domains (e.g., banking portals, private emails) to prevent capture.

### 2.2 Manual Selection Capture
If you only want to save a specific part of a webpage:
1. Highlight the text content.
2. Right-click and select **Save Highlight to Memora** from the context menu, or press `Ctrl+Shift+H`.
3. The selection is sent to your memory timeline instantly.

### 2.3 Tab Screenshots & OCR (F04)
To capture visual page components:
1. Click the extension popup and click **Capture Screenshot**.
2. Memora takes a snapshot of the visible tab space and processes it with on-device OCR (Optical Character Recognition) to extract text nodes, indexing both the image and the extracted text.

### 2.4 Voice Note Transcription (F29)
Save thoughts on the go:
1. Open the dashboard or extension sidebar and click the **Microphone** icon.
2. Record your audio note.
3. Memora uploads the audio (max 15MB), transcribes it using Gemini, matches it with contextual tags, and saves the transcription.

---

## 3. Dashboard, Search & Synthesis (F07 - F10)

Your centralized control room is the **Memora Dashboard** (hosted locally at `http://localhost:3000`).

![Memora Dashboard Mockup](images/dashboard_mockup.jpg)

### 3.1 Hybrid Semantic Search
The top search bar supports natural language queries.
*   **Concept Search:** Search for ideas rather than exact keywords (e.g., search *"how does vector search scale"* instead of looking for the word *"HNSW"*).
*   **Streaming Answers:** Synthesis is streamed in real-time. The AI gathers the top relevant chunks, synthesizes a summary, and references citations with clickable source chips.

### 3.2 Timeline & Date Scrubber (F10)
Click the **Timeline** tab to view your captures chronologically.
*   Use the **Date Scrubber** slider widget at the top to slide through months and years, instantly filtering your feed to specific timeframes.
*   Filter by source types (e.g., `web`, `slack`, `document`) using the sidebar category checkboxes.

---

## 4. Contextual Features & Accessibility (F30 - F32)

### 4.1 ADHD Focus Mode (F31)
Designed for cognitive inclusion and reducing distractions:
*   Click the **ADHD Focus Mode** toggle in the dashboard sidebar.
*   The background glows dim, all non-essential metrics are blurred, and a **Session Timer** appears to help you stay focused on your active search task.

### 4.2 Accessibility Presets
Configure your layout preferences under Settings:
*   **Reduce Transparency:** Replaces translucent glass cards with high-contrast, solid surfaces.
*   **Color-Blind Mode:** Adapts color themes for protanopia/deuteranopia safe contrast checks.

---

## 5. Folders & Integrations (F15 - F18, F41)

### 5.1 Nested Folders
*   Drag-and-drop memories into custom folder groups in the dashboard.
*   Create nested folder structures by clicking **New Folder** and specifying a parent folder location.

### 5.2 Notion & Slack Document Sync
Connect external accounts to consolidate knowledge:
*   Navigate to **Settings > Integrations**.
*   Click **Connect Notion** or **Connect Slack** and authorize access.
*   The background sync worker runs periodically to poll, chunk, and index your Notion databases and Slack channel histories.

---

## 6. Cognitive Loops (F47 - F51)

Memora works behind the scenes to consolidate and cross-reference your knowledge using background loops:

*   **Self-Reflection:** Runs weekly to analyze recent captures, highlighting patterns and suggesting areas of research.
*   **Consolidation:** Periodically merges highly similar memories into a single, cohesive summary to keep your vector database clean and organized.
*   **Dreaming:** Runs during idle periods to create non-obvious connection cards linking different concepts together, surfacing creative insights.

---

## 7. Data Portability & Privacies (F13)

### 7.1 Deleting Memories
To delete a memory, click the **Trash** icon on any timeline card. This deletes the document record from PostgreSQL and removes its vector point from Qdrant.

### 7.2 Native ZIP Data Export
Keep your data portable:
1. Go to **Settings > Account**.
2. Click **Export Data** and select the **ZIP Archive** format.
3. The server generates a native, uncompressed ZIP archive containing all your captured articles (as Markdown files) and databases (as JSON files), ready to download.
