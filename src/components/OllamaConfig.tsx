import React, { useEffect, useState } from 'react';
import { VoiceConfig, OllamaModel } from '../types';
import { 
  Settings, 
  RefreshCw, 
  Volume2, 
  ShieldAlert, 
  Cpu, 
  Check, 
  AlertCircle, 
  Sliders, 
  Mic, 
  Sparkles, 
  Compass, 
  Flame, 
  Code, 
  BookOpen, 
  Zap,
  Trash2,
  HardDrive,
  MessageSquare
} from 'lucide-react';

interface OllamaConfigProps {
  config: VoiceConfig;
  onChange: (newConfig: VoiceConfig) => void;
  onRefreshModels: () => Promise<OllamaModel[]>;
  availableModels: OllamaModel[];
  isRefreshingModels: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'idle';
  onPurgeVram?: () => void;
  isPurgingVram?: boolean;
  purgeSuccess?: boolean;
  onClearSessionContext?: () => void;
  sessionTurnsCount?: number;
  onToggleLowVramMode?: (enable?: boolean) => void;
}

export default function OllamaConfig({
  config,
  onChange,
  onRefreshModels,
  availableModels,
  isRefreshingModels,
  connectionStatus,
  onPurgeVram,
  isPurgingVram = false,
  purgeSuccess = false,
  onClearSessionContext,
  sessionTurnsCount = 0,
  onToggleLowVramMode
}: OllamaConfigProps) {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        let voices = window.speechSynthesis.getVoices();
        voices = voices.filter(v => v.lang.startsWith('en'));
        setBrowserVoices(voices.length > 0 ? voices : window.speechSynthesis.getVoices());
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...config,
      [name]: value
    });
  };

  const handleNumberChange = (name: keyof VoiceConfig, value: number) => {
    onChange({
      ...config,
      [name]: value
    });
  };

  // Preset Configurations
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    switch (presetName) {
      case 'low_vram_mac':
        onChange({
          ...config,
          lowVramMode: true,
          numCtx: 2048,
          maxContextTurns: 2,
          keepAlive: '0s',
          temperature: 0.6
        });
        break;
      case 'voice_assistant':
        onChange({
          ...config,
          systemPrompt: 'You are a highly efficient, hands-free voice assistant. Respond conversationally, concisely, and limit answers to 2-3 clear sentences optimized for speech recitation.',
          temperature: 0.6,
          topP: 0.9,
          topK: 40,
          repeatPenalty: 1.15
        });
        break;
      case 'code_architect':
        onChange({
          ...config,
          systemPrompt: 'You are an expert full-stack software engineer. Provide structured, production-ready code with type annotations, docstrings, and comprehensive Markdown explanations.',
          temperature: 0.2,
          topP: 0.85,
          topK: 30,
          repeatPenalty: 1.05
        });
        break;
      case 'analytical_report':
        onChange({
          ...config,
          systemPrompt: 'You are a senior data analyst and researcher. Structure all outputs using Markdown with clear headings, bulleted takeaways, comparisons, and tables where applicable.',
          temperature: 0.3,
          topP: 0.9,
          topK: 40,
          repeatPenalty: 1.1
        });
        break;
      case 'creative_divergent':
        onChange({
          ...config,
          systemPrompt: 'You are a creative writer and brainstormer. Provide evocative, highly descriptive ideas, analogies, and narrative depth.',
          temperature: 1.0,
          topP: 0.95,
          topK: 60,
          repeatPenalty: 1.1
        });
        break;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Voice & Inference Settings</h2>
            <p className="text-xs text-slate-400">
              Manage endpoint connectivity, speech narration, and hyperparameter tuning for local models.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <Check className="w-3.5 h-3.5" /> OLLAMA ONLINE ({availableModels.length} models)
            </span>
          )}
          {connectionStatus === 'failed' && (
            <button
              onClick={() => setShowCorsHelp(!showCorsHelp)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse hover:bg-rose-500/20 transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5" /> CONNECTION FAILED (CORS GUIDE)
            </button>
          )}
          {connectionStatus === 'checking' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> CHECKING STATUS...
            </span>
          )}
        </div>
      </div>

      {/* CORS instructions */}
      {showCorsHelp && (
        <div className="p-5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs text-amber-300 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-semibold text-sm text-white">How to enable local Ollama CORS for Web Browsers</span>
            </div>
            <button
              onClick={() => setShowCorsHelp(false)}
              className="text-amber-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
          <p className="leading-relaxed text-slate-300">
            Browsers enforce Cross-Origin Resource Sharing (CORS) security. To allow this web studio to query your local Ollama instance on port 11434, launch Ollama with the origins wildcard set:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200">
              <p className="text-slate-500 mb-1"># macOS / Linux Terminal:</p>
              <p className="text-emerald-400">OLLAMA_ORIGINS="*" ollama serve</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200">
              <p className="text-slate-500 mb-1"># Windows PowerShell:</p>
              <p className="text-emerald-400">$env:OLLAMA_ORIGINS="*" ; ollama serve</p>
            </div>
          </div>
          <button
            onClick={() => { onRefreshModels(); setShowCorsHelp(false); }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition"
          >
            Retry Connection Now
          </button>
        </div>
      )}

      {/* Preset Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2.5">
          Quick Configuration Presets:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('low_vram_mac')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === 'low_vram_mac' || config.lowVramMode
                ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md' 
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-400 mb-1">
              <Zap className="w-3.5 h-3.5" /> 2016 Mac Mode
            </div>
            <p className="text-[11px] text-slate-400">2048 ctx, 0s keep_alive, 2 turns history.</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('voice_assistant')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === 'voice_assistant' 
                ? 'bg-sky-950/60 border-sky-500 text-white shadow-md' 
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs text-sky-400 mb-1">
              <Mic className="w-3.5 h-3.5" /> Voice Companion
            </div>
            <p className="text-[11px] text-slate-400">Concise, 2-sentence conversational outputs.</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('code_architect')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === 'code_architect' 
                ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md' 
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400 mb-1">
              <Code className="w-3.5 h-3.5" /> Code & Logic
            </div>
            <p className="text-[11px] text-slate-400">Deterministic temp (0.2), typed docs & markdown.</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('analytical_report')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === 'analytical_report' 
                ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md' 
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" /> Deep Analysis
            </div>
            <p className="text-[11px] text-slate-400">Structured sections, comparison tables, metrics.</p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('creative_divergent')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === 'creative_divergent' 
                ? 'bg-orange-950/60 border-orange-500 text-white shadow-md' 
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs text-orange-400 mb-1">
              <Flame className="w-3.5 h-3.5" /> Creative & Ideas
            </div>
            <p className="text-[11px] text-slate-400">High temp (1.0), exploratory vocabulary pool.</p>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Memory & Context Engines + Ollama Service */}
        <div className="space-y-6">

          {/* VRAM & MEMORY PROFILE (2016 MacBook Fix) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" /> VRAM & Memory Footprint Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300">
                2016 Mac Fix
              </span>
            </div>

            {/* Low VRAM Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Low-VRAM Optimization Profile</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Limits context window to 2048 and sets <code className="text-sky-300 font-mono">keep_alive: 0s</code> to unload the model immediately after responding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onToggleLowVramMode) {
                    onToggleLowVramMode();
                  } else {
                    onChange({ ...config, lowVramMode: !config.lowVramMode });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 ${
                  config.lowVramMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config.lowVramMode ? 'ENABLED (0s Keep-Alive)' : 'DISABLED'}
              </button>
            </div>

            {/* Keep Alive Selector */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                <span className="text-slate-300">Ollama VRAM Keep-Alive (`keep_alive`)</span>
                <span className="text-sky-400 font-bold">{config.keepAlive || '0s'}</span>
              </div>
              <select
                name="keepAlive"
                value={config.keepAlive || '0s'}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="0s">0s — Unload immediately (Zero VRAM idle - Best for 2016 Mac)</option>
                <option value="1m">1m — Unload after 1 minute of inactivity</option>
                <option value="5m">5m — Standard (Keep in VRAM for 5 minutes)</option>
                <option value="15m">15m — Keep loaded for 15 minutes</option>
                <option value="-1">-1 — Keep in VRAM indefinitely (High memory)</option>
              </select>
            </div>

            {/* Manual Purge Action Bar */}
            {onPurgeVram && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Manual VRAM Cleanup:</span>
                <button
                  type="button"
                  onClick={onPurgeVram}
                  disabled={isPurgingVram}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 transition font-bold"
                >
                  {isPurgingVram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{isPurgingVram ? 'Evicting VRAM...' : purgeSuccess ? '✓ VRAM Cleared!' : 'Evict Model from VRAM'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SESSIONFUL CONTEXT & CONTINUOUS MEMORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Sessional Context (Gemini / ChatGPT Style)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                Multi-Turn Memory
              </span>
            </div>

            {/* Enable Context Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Continuous Multi-Turn Context</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sends conversational history into subsequent requests so Ollama remembers previous answers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...config, enableSessionContext: !config.enableSessionContext })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 ${
                  config.enableSessionContext
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config.enableSessionContext ? 'CHAINING ON' : 'STATELESS (OFF)'}
              </button>
            </div>

            {/* Max History Turns Slider */}
            {config.enableSessionContext && (
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Max Memory Retention ({config.maxContextTurns || 2} turns)</span>
                  <span className="text-sky-400 font-bold">{(config.maxContextTurns || 2) * 2} messages</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={config.maxContextTurns || 2}
                  onChange={(e) => handleNumberChange('maxContextTurns', parseInt(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>1 Turn (Lowest VRAM)</span>
                  <span>2 Turns (Mac default)</span>
                  <span>6 Turns (Deep Memory)</span>
                </div>
              </div>
            )}

            {/* Context Buffer Status & Reset */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-400">
                Active Buffer: <strong className="text-white">{sessionTurnsCount} turn(s)</strong>
              </span>
              {onClearSessionContext && (
                <button
                  type="button"
                  onClick={onClearSessionContext}
                  disabled={sessionTurnsCount === 0}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-300 disabled:opacity-40 border border-slate-700 rounded transition"
                >
                  Clear Memory Buffer
                </button>
              )}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-sky-400" /> Ollama Connection & Model Target
            </h3>

            {/* Server Endpoint */}
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                Ollama Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="ollamaUrl"
                  value={config.ollamaUrl}
                  onChange={handleTextChange}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  placeholder="http://localhost:11434"
                />
                <button
                  type="button"
                  onClick={onRefreshModels}
                  disabled={isRefreshingModels}
                  className="px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-2 font-mono text-xs font-semibold"
                  title="Discover local models"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingModels ? 'animate-spin' : ''}`} />
                  <span>Fetch Models</span>
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                Active Ollama Model Tag
              </label>
              {availableModels.length > 0 ? (
                <select
                  name="model"
                  value={config.model}
                  onChange={handleTextChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  {availableModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name} {model.size ? `(${(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB)` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    name="model"
                    value={config.model}
                    onChange={handleTextChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                    placeholder="llama3.2"
                  />
                  <span className="absolute right-3.5 top-3 text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    Manual Tag
                  </span>
                </div>
              )}
            </div>

            {/* Wake Word Selector */}
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                Wake Word Activation
              </label>
              <select
                name="wakeWord"
                value={config.wakeWord}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="computer">"Computer" (Star Trek Classic)</option>
                <option value="ollama">"Ollama" (Direct Model Trigger)</option>
                <option value="assistant">"Assistant" (Natural Assistant)</option>
                <option value="jarvis">"Jarvis" (Sci-Fi / Tony Stark)</option>
                <option value="none">None (Direct click-to-speak / always ready)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Saying this word wakes up the microphone listening engine and starts command capture.
              </p>
            </div>

            {/* System Instructions Prompt */}
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                System Instructions / Personality
              </label>
              <textarea
                name="systemPrompt"
                value={config.systemPrompt}
                onChange={handleTextChange}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-sky-500 font-sans"
                placeholder="Instruct the model on tone, format, and structure..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Voice Synthesis & LLM Tuning Parameters */}
        <div className="space-y-6">
          
          {/* TTS Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Volume2 className="w-4 h-4 text-emerald-400" /> Speech Synthesis (Read Aloud)
            </h3>

            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                Narrator Voice Profile
              </label>
              <select
                name="voiceName"
                value={config.voiceName}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-sans"
              >
                <option value="default">Default System Voice</option>
                {browserVoices.map((voice, idx) => (
                  <option key={idx} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-400">Speech Rate</span>
                  <span className="text-sky-400 font-bold">{config.voiceRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={config.voiceRate}
                  onChange={(e) => handleNumberChange('voiceRate', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-400">Voice Pitch</span>
                  <span className="text-sky-400 font-bold">{config.voicePitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={config.voicePitch}
                  onChange={(e) => handleNumberChange('voicePitch', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Hyperparameters Slider Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <span>Hyperparameter Sampling Tuning</span>
              </div>
              <span className="text-[10px] text-slate-500">Fine-grain Ollama Options</span>
            </h3>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-slate-300">Temperature (Creativity vs Determinism)</span>
                <span className="text-orange-400 font-bold">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={config.temperature}
                onChange={(e) => handleNumberChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-orange-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>0.0 (Strict / Code)</span>
                <span>0.7 (Balanced)</span>
                <span>1.4 (Creative / Wild)</span>
              </div>
            </div>

            {/* Top-P and Top-K */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Top-P (Nucleus)</span>
                  <span className="text-emerald-400 font-bold">{config.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={config.topP}
                  onChange={(e) => handleNumberChange('topP', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Top-K</span>
                  <span className="text-sky-400 font-bold">{config.topK}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={config.topK}
                  onChange={(e) => handleNumberChange('topK', parseInt(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>
            </div>

            {/* Context Length and Repeat Penalty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Repeat Penalty</span>
                  <span className="text-pink-400 font-bold">{config.repeatPenalty}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={config.repeatPenalty}
                  onChange={(e) => handleNumberChange('repeatPenalty', parseFloat(e.target.value))}
                  className="w-full accent-pink-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Context Window</span>
                  <span className="text-indigo-400 font-bold">{config.numCtx} tok</span>
                </div>
                <select
                  name="numCtx"
                  value={config.numCtx}
                  onChange={(e) => handleNumberChange('numCtx', parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="2048">2048 (Low RAM / Fast)</option>
                  <option value="4096">4096 (Standard)</option>
                  <option value="8192">8192 (High Context)</option>
                  <option value="16384">16384 (Long Context)</option>
                  <option value="32768">32768 (Max Context)</option>
                </select>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
