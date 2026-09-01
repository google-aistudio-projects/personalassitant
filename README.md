# Hands-Free Ollama Voice Assistant & LLM Learning Workbench

An offline-first, highly responsive, voice-activated interface and benchmarking platform for local Ollama models. This workbench serves as an interactive learning laboratory to test, tune, and analyze prompt configurations, generation speeds, token usage ratios, and model latency, completely without external internet dependencies.

---

## 🚀 Key Features

*   **Hands-Free Wake Word Detection**: Listens continuously for a wake word (e.g. *"Computer"*, *"Ollama"*, *"Jarvis"*) using the browser's high-fidelity Speech Recognition interface. Plays an auditory response chime before opening a focused command capture window.
*   **Zero-Internet Privacy Commitment**: Executes entirely in your local network environment. No third-party API keys are required, and no data leaves your workspace.
*   **Interactive LLM Performance Dashboard**: Inspects granular, real-time metrics for every inference run:
    *   **Inference Velocity (t/s)**: Dynamic tokens generated per second.
    *   **Phase Latency Timeline**: Measures Model Load/Boot, Prompt Evaluation (Prefill), and Token Generation (Decode) times.
    *   **Context Window Allocation**: Graphs the exact ratio of input tokens versus output tokens.
*   **Advanced Parameter Tuning Console**: Controls critical prompt tuning parameters on the fly:
    *   `Temperature`: Adjusts creativity/predictability.
    *   `Top-P` (Nucleus) & `Top-K` Sampling: Filters vocabulary pool distribution.
    *   `num_ctx` (Context Window): Customizes memory retention size.
    *   `repeat_penalty`: Prevents repetitive model sequences.
*   **Instant Python Client Generator**: Synchronizes your web slider parameters in real-time into a standalone, executable, offline Python companion script that executes on your computer's terminal.

---

## 🛠️ System Architecture & Design Document

### 1. Conceptual Architecture Diagram
```
              +-------------------------------------------------+
              |                 Web Interface                   |
              |                                                 |
              |  +-------------+  +----------+  +------------+  |
              |  | Speech Rec  |  |  Config  |  | Recharts   |  |
              |  |   Engine    |  | Sliders  |  | Dashboards |  |
              |  +------+------+  +----+-----+  +-----+------+  |
              +---------|--------------|--------------|---------+
                        |              |              |
           User Audio   |              | Sync Params  |
                        v              v              |
              +------------------+  +-----------------+
              | Wake Word Engine |  | Python Client   |
              | & Audio Chimes   |  | Generator       |
              +---------+--------+  +-----------------+
                        |
                 Query  | (Zero Internet Calls / Offline)
                        v
              +-------------------------------------------------+
              |              Local Ollama Service               |
              |            `http://localhost:11434`             |
              |                                                 |
              |  +---------------+             +-------------+  |
              |  |   API Route   | <---------> | Local LLM   |  |
              |  | /api/generate |             | (e.g. Llama)|  |
              |  +---------------+             +-------------+  |
              +-------------------------------------------------+
```

### 2. Core Modules
*   **Speech Recognition Loop (`App.tsx`)**: Coordinated state engine that manages transitions between `idle` -> `listening_wake` -> `recording_command` -> `processing` -> `speaking` while preserving client configurations via React refs to prevent race conditions.
*   **Metrics Visualizer (`MetricsDashboard.tsx`)**: Generates dual Area and Stacked-Bar charts using `recharts` to render historical generation speeds and vocabulary load ratios.
*   **Ollama Connection Manager (`OllamaConfig.tsx`)**: Resolves active local models and queries endpoints. Includes built-in CORS instructions in case standard host rules prevent communication.

---

## 🎯 Prompt Engineering Parameters Dictionary

| Parameter | Recommended Range | Description |
| :--- | :--- | :--- |
| **Temperature** | `0.1 - 0.9` | Controls randomness. Lower values (e.g., `0.2`) are perfect for strict logic, code, or mathematics. Higher values (e.g., `0.8`) encourage creative divergence. |
| **Top-P (Nucleus)** | `0.7 - 0.95` | Discards tokens below a cumulative likelihood threshold, letting the model skip low-quality vocabulary options. |
| **Top-K** | `20 - 60` | Caps the token vocabulary search. Low values (e.g., `30`) prevent odd syntax choices, keeping sentences clean and cohesive. |
| **num_ctx** | `2048 - 8192` | Sets memory retention limit. Shorter windows require fewer hardware resources, while larger ones allow deep conversations. |
| **Repeat Penalty** | `1.0 - 1.2` | Discourages the assistant from repeating phrases consecutively. |

---

## 💻 Local Setup & Run Guide

To connect this web interface to your local machine, browsers enforce Cross-Origin Resource Sharing (CORS) rules. Make sure you launch Ollama with appropriate wildcard origins:

### Step 1: Start Ollama with CORS Allowed

#### 🍎 macOS & 🐧 Linux
Run this command in your terminal before launching requests:
```bash
OLLAMA_ORIGINS="*" ollama serve
```

#### 🪟 Windows (PowerShell)
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

### Step 2: Open Browser Permissions
Ensure your browser has granted **Microphone Access** to this application. If you are viewing the application within an embedded iFrame, open the app in a **New Tab** using the external link to prompt the native microphone authorization dialog.

---

## 🐍 Running the Local Python Client

The **Python Script** tab in the web console automatically updates a standalone client with your custom parameters.

### 1. Install local dependencies
```bash
pip install SpeechRecognition pyttsx3 requests pyaudio
```

### 2. Run the script
Save the generated code as `ollama_voice_assistant.py` and run it:
```bash
python ollama_voice_assistant.py
```
*(Mac Users: If PyAudio fails to install, run `brew install portaudio` before pip install).*
