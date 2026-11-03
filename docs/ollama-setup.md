# Local AI Setup & Troubleshooting Guide

This guide helps you set up and troubleshoot your local AI engine for MentorOS offline and private curriculum synthesis.

---

## 1. Quick Installation

1. **Download & Install Ollama**
   - **macOS / Linux / Windows**: Download the installer from [https://ollama.com/download](https://ollama.com/download).

2. **Verify Installation**
   Open a terminal and run:
   ```bash
   ollama --version
   ```

---

## 2. Pulling the Required Model

MentorOS uses fast, lightweight reasoning models:
```bash
ollama run smollm2:1.7b
```
Or for general instruction:
```bash
ollama pull llama3.2:3b
```

---

## 3. Starting the Ollama Service

Ensure the Ollama background daemon is actively listening:
```bash
ollama serve
```

By default, the server listens at:
`http://localhost:11434`

---

## 4. Troubleshooting "Ollama unreachable"

If MentorOS displays **"Ollama unreachable"**, check the following steps:

### A. Is the service running?
Test network accessibility directly:
```bash
curl http://localhost:11434/api/tags
```
If this fails, restart the Ollama desktop app or run `ollama serve` in a terminal.

### B. Cross-Origin Resource Sharing (CORS)
If you run MentorOS on a different port or host, set the allowed origin environment variable before starting Ollama:
- **Windows (PowerShell)**:
  ```powershell
  $env:OLLAMA_ORIGINS="*"
  ollama serve
  ```
- **macOS / Linux**:
  ```bash
  OLLAMA_ORIGINS="*" ollama serve
  ```

### C. Verify Environment Configuration
Ensure your `.env` contains:
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=smollm2:1.7b
```

---

## 5. Returning to MentorOS

Once `curl http://localhost:11434/api/tags` returns a 200 OK status, click the **Retry** button in the MentorOS AI Drawer header to re-establish connectivity.
