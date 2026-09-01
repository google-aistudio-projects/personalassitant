import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceConfig, TerminalLog, OllamaModel, MetricsRun, ResponseMetrics, ChatMessage } from './types';
import StudioView from './components/StudioView';
import OllamaConfig from './components/OllamaConfig';
import MetricsDashboard from './components/MetricsDashboard';
import PythonScriptView from './components/PythonScriptView';
import VoiceTerminal from './components/VoiceTerminal';
import { 
  Volume2, 
  Sparkles, 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  HelpCircle, 
  Activity, 
  Cpu, 
  Sliders, 
  FileCode, 
  RefreshCw,
  LayoutDashboard,
  Mic,
  Layers,
  ChevronRight,
  ExternalLink,
  Trash2,
  Zap
} from 'lucide-react';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const playChime = (type: 'wake' | 'success' | 'error') => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'wake') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start();
      
      osc.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.4);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140.00, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    console.warn('AudioContext not supported or blocked by browser autoplays.', e);
  }
};

export default function App() {
  // App states
  const [config, setConfig] = useState<VoiceConfig>({
    ollamaUrl: 'http://localhost:11434',
    model: 'llama3.2',
    wakeWord: 'computer',
    systemPrompt: "You are Arun's highly efficient, hands-free personal voice assistant. Respond with clear, structured Markdown.",
    voiceName: 'default',
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0,
    continuousListening: true,
    // Context & Memory Optimization (Ideal for 2016 MacBooks & low-RAM laptops)
    enableSessionContext: true,
    maxContextTurns: 2, // 2 previous turns prevents VRAM explosion while giving full continuity
    keepAlive: '0s', // '0s' unloads model from VRAM immediately after generation
    lowVramMode: true,
    // Hyperparameters
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    numCtx: 2048, // 2048 context is super lightweight on 2016 Mac
    repeatPenalty: 1.1
  });

  // Navigation: studio (default), config (Voice Setup), dashboard (Workbench), python (Python Script), logs (Live Terminal)
  const [activeTab, setActiveTab] = useState<'studio' | 'config' | 'dashboard' | 'python' | 'logs'>('studio');
  const [status, setStatus] = useState<'idle' | 'listening_wake' | 'recording_command' | 'processing' | 'speaking' | 'disabled'>(
    SpeechRecognition ? 'idle' : 'disabled'
  );
  
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'failed'>('idle');
  const [manualText, setManualText] = useState('');
  
  // Session conversation memory for continuous context
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isPurgingVram, setIsPurgingVram] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  // Initial runs for workbench & studio display
  const [runs, setRuns] = useState<MetricsRun[]>([
    {
      id: 'initial-run-1',
      timestamp: '21:15:00',
      model: 'llama3.2',
      prompt: 'Provide a structured comparison between PostgreSQL and SQLite for modern local AI applications.',
      response: `### Database Comparison for Local AI Applications

When architecting local artificial intelligence applications, selecting the appropriate storage engine determines memory footprint, query latency, and concurrency handling.

---

### Core Architecture Comparison

| Feature | SQLite | PostgreSQL |
| :--- | :--- | :--- |
| **Deployment Mode** | Serverless / Single File | Client-Server Architecture |
| **Vector Extension** | \`sqlite-vss\` / \`sqlite-vec\` | \`pgvector\` |
| **RAM Footprint** | Extremely Low (< 20MB) | Medium-High (> 150MB) |
| **Concurrency** | Single-writer / Multiple-readers | High Concurrent Multi-Write (MVCC) |
| **Best Used For** | Embedded Desktop Apps & CLI tools | Microservices, Multi-tenant Dashboards |

---

### Recommended Python Code Snippet

\`\`\`python
import sqlite3

def init_local_ai_db(db_path: str = "ai_workspace.db"):
    """Initialize local SQLite storage for assistant session records."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversation_history (
            id TEXT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            prompt TEXT NOT NULL,
            response TEXT NOT NULL,
            tokens_generated INTEGER
        )
    """)
    conn.commit()
    return conn
\`\`\`

> **Key Takeaway:** For single-user hands-free assistants running locally on Ollama, **SQLite** delivers zero-configuration convenience with exceptional write performance.`,
      temperature: 0.3,
      promptTokens: 38,
      completionTokens: 236,
      totalTokens: 274,
      totalDurationMs: 3850,
      generationDurationMs: 3400,
      tokensPerSec: 69.4
    }
  ]);

  const [latestMetrics, setLatestMetrics] = useState<ResponseMetrics | null>({
    promptEvalCount: 38,
    evalCount: 236,
    promptEvalDurationMs: 220,
    evalDurationMs: 3400,
    loadDurationMs: 230,
    totalDurationMs: 3850,
    tokensPerSecond: 69.4
  });

  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Speech engine refs
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const configRef = useRef(config);
  const statusRef = useRef(status);
  const isSpeakingRef = useRef(false);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isSpeakingRef.current = (status === 'speaking'); }, [status]);

  // Log helper
  const addLog = (type: TerminalLog['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { id: Math.random().toString(), timestamp, type, message }]);
  };

  // Connect & fetch available models from Ollama
  const checkOllamaConnection = async () => {
    setConnectionStatus('checking');
    setIsRefreshingModels(true);
    addLog('system', `Checking connection to Ollama at ${config.ollamaUrl}...`);
    try {
      const res = await fetch(`${config.ollamaUrl}/api/tags`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        setAvailableModels(models);
        setConnectionStatus('connected');
        addLog('system', `Successfully connected! Found ${models.length} local model(s).`);
        
        if (models.length > 0) {
          const currentExists = models.some((m: any) => m.name === config.model);
          if (!currentExists) {
            setConfig(prev => ({ ...prev, model: models[0].name }));
            addLog('system', `Auto-selected installed model: ${models[0].name}`);
          }
        }
      } else {
        throw new Error('Non-200 response');
      }
    } catch (err) {
      setConnectionStatus('failed');
      addLog('error', `Could not connect to Ollama. Ensure your local Ollama server is running (with CORS enabled via OLLAMA_ORIGINS="*")`);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    checkOllamaConnection();
    addLog('system', 'Voice Terminal initialized. SpeechRecognition Engine ' + (SpeechRecognition ? 'Ready' : 'Not Supported'));
    if (!SpeechRecognition) {
      addLog('error', 'Your browser does not support Web Speech Recognition. Use Chrome or configure the Local Python Client!');
    }
  }, []);

  // Voice Speech Synthesis Handler
  const speakResponse = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      addLog('error', 'Speech synthesis is not supported on this browser.');
      return;
    }

    // Clean text of heavy markdown symbols for cleaner narration
    const cleanSpeechText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*`_~|]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    if (config.voiceName !== 'default') {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === config.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.rate = config.voiceRate;
    utterance.pitch = config.voicePitch;
    utterance.volume = config.voiceVolume;

    utterance.onstart = () => {
      setStatus('speaking');
      addLog('assistant', text);
    };

    utterance.onend = () => {
      handleSpeechCompleted();
    };

    utterance.onerror = (e) => {
      console.error('TTS utterance error:', e);
      handleSpeechCompleted();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechCompleted = () => {
    if (configRef.current.continuousListening && isListeningRef.current) {
      startListeningLoop();
    } else {
      setStatus('idle');
    }
  };

  // Interrupt Speech Synthesis
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    addLog('system', 'Speech stopped by user.');
    if (configRef.current.continuousListening && isListeningRef.current) {
      startListeningLoop();
    } else {
      setStatus('idle');
    }
  };

  // Send query to Ollama API with Sessionful Context Chaining & VRAM Management
  const sendQueryToOllama = async (prompt: string) => {
    setStatus('processing');
    const cleanUrl = config.ollamaUrl.endsWith('/') ? config.ollamaUrl.slice(0, -1) : config.ollamaUrl;
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let assistantText = "";
      let responseData: any = {};

      if (config.enableSessionContext) {
        // Take past turns (maxContextTurns pairs of user/assistant messages)
        const recentTurns = sessionMessages.slice(-Math.max(1, config.maxContextTurns) * 2);
        const chatMessages = [
          { role: 'system', content: config.systemPrompt },
          ...recentTurns.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: prompt }
        ];

        addLog('system', `Contacting "${config.model}" via /api/chat with ${recentTurns.length / 2} prior turn(s) context...`);

        const response = await fetch(`${cleanUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages: chatMessages,
            stream: false,
            keep_alive: config.keepAlive || (config.lowVramMode ? "0s" : "5m"),
            options: {
              temperature: config.temperature,
              top_p: config.topP,
              top_k: config.topK,
              num_ctx: config.numCtx,
              repeat_penalty: config.repeatPenalty
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server returned status code ${response.status}`);
        }

        responseData = await response.json();
        assistantText = responseData.message?.content || responseData.response || "No response received.";
      } else {
        addLog('system', `Contacting "${config.model}" in single-turn stateless mode...`);
        const response = await fetch(`${cleanUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            prompt: `System Instructions: ${config.systemPrompt}\n\nUser: ${prompt}`,
            stream: false,
            keep_alive: config.keepAlive || (config.lowVramMode ? "0s" : "5m"),
            options: {
              temperature: config.temperature,
              top_p: config.topP,
              top_k: config.topK,
              num_ctx: config.numCtx,
              repeat_penalty: config.repeatPenalty
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server returned status code ${response.status}`);
        }

        responseData = await response.json();
        assistantText = responseData.response || "No response received.";
      }

      const endTime = performance.now();
      const clientTotalDuration = endTime - startTime;

      const totalDurationMs = responseData.total_duration ? (responseData.total_duration / 1000000) : clientTotalDuration;
      const loadDurationMs = responseData.load_duration ? (responseData.load_duration / 1000000) : (totalDurationMs * 0.05);
      const promptEvalDurationMs = responseData.prompt_eval_duration ? (responseData.prompt_eval_duration / 1000000) : (totalDurationMs * 0.15);
      const evalDurationMs = responseData.eval_duration ? (responseData.eval_duration / 1000000) : (totalDurationMs * 0.8);
      
      const promptEvalCount = responseData.prompt_eval_count || Math.max(5, Math.round((config.systemPrompt.length + prompt.length) / 4));
      const evalCount = responseData.eval_count || Math.max(1, Math.round(assistantText.length / 4));
      const tokensPerSecond = evalDurationMs > 0 ? (evalCount / (evalDurationMs / 1000)) : 35.0;

      const computedMetrics = {
        promptEvalCount,
        evalCount,
        promptEvalDurationMs,
        evalDurationMs,
        loadDurationMs,
        totalDurationMs,
        tokensPerSecond
      };

      setLatestMetrics(computedMetrics);

      const runTimestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newRun: MetricsRun = {
        id: Math.random().toString(),
        timestamp: runTimestamp,
        model: config.model,
        prompt: prompt,
        response: assistantText,
        temperature: config.temperature,
        promptTokens: promptEvalCount,
        completionTokens: evalCount,
        totalTokens: promptEvalCount + evalCount,
        totalDurationMs,
        generationDurationMs: evalDurationMs,
        tokensPerSec: tokensPerSecond
      };

      setRuns(prev => [...prev, newRun]);

      // Save to active session memory
      setSessionMessages(prev => [
        ...prev,
        { id: Math.random().toString(), role: 'user', content: prompt, timestamp: runTimestamp },
        { id: Math.random().toString(), role: 'assistant', content: assistantText, timestamp: runTimestamp, tokens: evalCount }
      ]);

      if (config.keepAlive === '0s' || config.lowVramMode) {
        addLog('system', `⚡ [Low-VRAM Engine] Query completed. Model memory cleared immediately (keep_alive: 0s).`);
      }

      playChime('success');
      speakResponse(assistantText);

    } catch (err: any) {
      playChime('error');
      const errorMsg = err.name === 'AbortError' 
        ? 'Ollama request timed out (60s). If your model is large, switch to Low-VRAM mode or a lighter model like llama3.2:1b.'
        : `Request Failed: Could not contact Ollama. Ensure your local Ollama server is running (with CORS enabled via OLLAMA_ORIGINS="*")`;
      addLog('error', errorMsg);
      
      if (configRef.current.continuousListening && isListeningRef.current) {
        startListeningLoop();
      } else {
        setStatus('idle');
      }
    }
  };

  // Manual VRAM purge / eviction
  const handlePurgeVram = async () => {
    setIsPurgingVram(true);
    addLog('system', `[VRAM Engine] Sending explicit memory eviction for model "${config.model}"...`);
    try {
      const cleanUrl = config.ollamaUrl.endsWith('/') ? config.ollamaUrl.slice(0, -1) : config.ollamaUrl;
      const res = await fetch(`${cleanUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          keep_alive: 0
        })
      });
      if (res.ok) {
        addLog('system', `✓ VRAM Evicted: Model "${config.model}" unloaded from RAM/GPU memory. System memory reclaimed.`);
        setPurgeSuccess(true);
        setTimeout(() => setPurgeSuccess(false), 2500);
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (e: any) {
      addLog('error', `VRAM purge request failed: ${e.message || 'Check Ollama'}`);
    } finally {
      setIsPurgingVram(false);
    }
  };

  const handleClearSessionContext = () => {
    setSessionMessages([]);
    addLog('system', 'Session context buffer cleared. Next query will start fresh.');
  };

  const handleToggleLowVramMode = (enable?: boolean) => {
    const target = enable !== undefined ? enable : !config.lowVramMode;
    if (target) {
      setConfig(prev => ({
        ...prev,
        lowVramMode: true,
        numCtx: 2048,
        maxContextTurns: 2,
        keepAlive: '0s'
      }));
      addLog('system', '⚡ 2016 Mac Low-VRAM Profile ACTIVATED (Context: 2048, 2 turns history, keep_alive: 0s instant memory unload).');
    } else {
      setConfig(prev => ({
        ...prev,
        lowVramMode: false,
        numCtx: 4096,
        maxContextTurns: 5,
        keepAlive: '5m'
      }));
      addLog('system', 'Standard Memory Profile restored (Context: 4096, 5 turns history, keep_alive: 5m).');
    }
  };

  // Web Speech recognition loop
  const startListeningLoop = () => {
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    const hasWakeWord = configRef.current.wakeWord !== 'none';
    setStatus(hasWakeWord ? 'listening_wake' : 'recording_command');
    
    if (hasWakeWord) {
      addLog('listening', `Standby active. Listening for wake word "${configRef.current.wakeWord}"...`);
    } else {
      addLog('listening', `Microphone active. Listening for command...`);
    }

    let finalTranscript = '';

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
    };

    rec.onend = () => {
      const phrase = finalTranscript.trim().toLowerCase();
      if (phrase) {
        addLog('user', `Voice heard: "${phrase}"`);
        
        if (statusRef.current === 'listening_wake') {
          const targetWake = configRef.current.wakeWord.toLowerCase();
          if (phrase.includes(targetWake)) {
            playChime('wake');
            addLog('system', `Wake word "${configRef.current.wakeWord}" triggered! Capturing command...`);
            setStatus('recording_command');
            
            setTimeout(() => {
              startFocusedCommandCapture();
            }, 100);
          } else {
            if (isListeningRef.current) {
              startListeningLoop();
            }
          }
        } else {
          sendQueryToOllama(phrase);
        }
      } else {
        if (isListeningRef.current && statusRef.current !== 'processing' && statusRef.current !== 'speaking') {
          startListeningLoop();
        }
      }
    };

    rec.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech Recognition Error:', e.error);
        if (e.error === 'not-allowed') {
          addLog('error', 'Microphone permission denied. Open app in a new tab to grant access.');
          isListeningRef.current = false;
          setStatus('disabled');
        }
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
    }
  };

  const startFocusedCommandCapture = () => {
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    let capturedCommand = '';

    rec.onresult = (event: any) => {
      if (event.results.length > 0) {
        capturedCommand = event.results[0][0].transcript;
      }
    };

    rec.onend = () => {
      const text = capturedCommand.trim();
      if (text) {
        addLog('user', `Command: "${text}"`);
        sendQueryToOllama(text);
      } else {
        addLog('system', 'No command detected. Returning to standby.');
        if (isListeningRef.current) {
          startListeningLoop();
        } else {
          setStatus('idle');
        }
      }
    };

    rec.onerror = (e: any) => {
      console.warn('Capture error:', e.error);
    };

    try {
      rec.start();
    } catch (e) {}
  };

  const handleStartListening = () => {
    if (!SpeechRecognition) {
      addLog('error', 'Speech recognition not supported on this browser.');
      return;
    }
    isListeningRef.current = true;
    addLog('system', 'Voice interaction engine started.');
    startListeningLoop();
  };

  const handleStopListening = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
    addLog('system', 'Voice interaction engine stopped.');
  };

  const handleSendManualText = () => {
    if (!manualText.trim()) return;
    const query = manualText.trim();
    addLog('user', `[Manual Text] "${query}"`);
    setManualText('');
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    sendQueryToOllama(query);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Application Header */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-base tracking-tight text-white">Arun's Personal Assistant</h1>
                <span className="text-[10px] bg-sky-950 text-sky-400 font-mono font-bold px-1.5 py-0.5 rounded border border-sky-800/50">Studio Edition</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Built using <span className="text-slate-300 font-medium">Llama</span> & <span className="text-sky-300 font-medium">Gemini AI Studio</span>
              </p>
            </div>
          </div>

          {/* Primary View Navigation Switcher */}
          <nav className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner select-none overflow-x-auto">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'studio' 
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Studio
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'config' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-orange-400" /> Voice Setup
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Workbench
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'python' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Python Script
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTab === 'logs' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-slate-300" /> Terminal
            </button>
          </nav>

          {/* Model Status & Memory Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Low-VRAM 2016 MacBook Preset Toggle */}
            <button
              onClick={() => handleToggleLowVramMode()}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all ${
                config.lowVramMode 
                  ? 'bg-amber-950/60 border-amber-600/60 text-amber-300 shadow-sm' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle 2016 MacBook / Low-RAM Mode (2048 ctx, 2 turns history, 0s keep_alive)"
            >
              <Zap className={`w-3.5 h-3.5 ${config.lowVramMode ? 'text-amber-400 fill-amber-400/20' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">2016 Mac Mode:</span>
              <span className="font-bold">{config.lowVramMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Manual VRAM Eviction / Purge Button */}
            <button
              onClick={handlePurgeVram}
              disabled={isPurgingVram}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-mono transition-all ${
                purgeSuccess 
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              title="Explicitly evict model from GPU VRAM / CPU RAM"
            >
              {isPurgingVram ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              ) : purgeSuccess ? (
                <span className="text-emerald-400 font-bold text-[11px]">✓ Evicted</span>
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden md:inline">{isPurgingVram ? 'Purging...' : purgeSuccess ? 'VRAM Cleared' : 'Purge VRAM'}</span>
            </button>

            {/* Model Status Badge Shortcut */}
            <button
              onClick={() => setActiveTab('config')}
              className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 font-mono transition-all group"
              title="Click to configure active Ollama model"
            >
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : connectionStatus === 'failed' ? 'bg-rose-400' : 'bg-amber-400'}`} />
              <span>Target: <span className="text-white font-semibold group-hover:text-sky-300 transition-colors">{config.model}</span></span>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-400 ml-0.5">✎</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Multi-Panel Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        
        {/* Help Banner if Voice Engine needs mic access */}
        {!SpeechRecognition && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-800/50 rounded-2xl text-xs text-amber-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Web Speech Recognition is not supported by your current browser environment. Type in the prompt box or run the standalone Python script locally!</span>
            </div>
            <button
              onClick={() => setActiveTab('python')}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition shrink-0"
            >
              View Python Script
            </button>
          </div>
        )}

        {/* View Routing */}
        <div className="flex-1">
          {activeTab === 'studio' ? (
            /* STUDIO VIEW: Full-canvas Request Sending & Structured Response Aggregation */
            <StudioView
              config={config}
              onChangeConfig={setConfig}
              status={status}
              runs={runs}
              latestMetrics={latestMetrics}
              sessionMessages={sessionMessages}
              onClearSessionContext={handleClearSessionContext}
              onPurgeVram={handlePurgeVram}
              isPurgingVram={isPurgingVram}
              purgeSuccess={purgeSuccess}
              onToggleLowVramMode={handleToggleLowVramMode}
              isSpeaking={status === 'speaking'}
              isListening={isListeningRef.current}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              onStopSpeaking={stopSpeaking}
              onSpeakText={speakResponse}
              onSendQuery={sendQueryToOllama}
              onSelectTab={(tab) => setActiveTab(tab as any)}
            />
          ) : activeTab === 'config' ? (
            /* VOICE SETUP: Full view for model, wake-words, TTS, and LLM hyperparameters */
            <OllamaConfig
              config={config}
              onChange={setConfig}
              onRefreshModels={async () => {
                await checkOllamaConnection();
                return availableModels;
              }}
              availableModels={availableModels}
              isRefreshingModels={connectionStatus === 'checking'}
              connectionStatus={connectionStatus}
              onPurgeVram={handlePurgeVram}
              isPurgingVram={isPurgingVram}
              purgeSuccess={purgeSuccess}
              onClearSessionContext={handleClearSessionContext}
              sessionTurnsCount={Math.floor(sessionMessages.length / 2)}
              onToggleLowVramMode={handleToggleLowVramMode}
            />
          ) : activeTab === 'dashboard' ? (
            /* WORKBENCH: Full view for telemetry charts, latency breakdowns, and prompt advice */
            <MetricsDashboard
              runs={runs}
              latestMetrics={latestMetrics}
              currentModel={config.model}
            />
          ) : activeTab === 'python' ? (
            /* PYTHON SCRIPT: Standalone synchronized client generator */
            <PythonScriptView config={config} />
          ) : (
            /* TERMINAL LOGS: Raw interactive terminal view */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Real-Time Speech Engine Diagnostics & Command Pipeline</span>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  Return to Studio <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <VoiceTerminal
                logs={logs}
                onClearLogs={() => setLogs([])}
                onStopSpeaking={stopSpeaking}
                isSpeaking={status === 'speaking'}
                manualText={manualText}
                setManualText={setManualText}
                onSendManualText={handleSendManualText}
                onStartListening={handleStartListening}
                onStopListening={handleStopListening}
                isListening={isListeningRef.current}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between max-w-7xl mx-auto w-full">
        <span>Arun's Personal Assistant • Built using Llama & Gemini AI Studio</span>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Ollama Port: 11434</span>
          <span>•</span>
          <button onClick={() => setActiveTab('config')} className="hover:text-slate-300 transition-colors">Model: {config.model}</button>
          <span>•</span>
          <button onClick={() => setActiveTab('python')} className="hover:text-slate-300 transition-colors">Local Python Client</button>
        </div>
      </footer>
    </div>
  );
}
