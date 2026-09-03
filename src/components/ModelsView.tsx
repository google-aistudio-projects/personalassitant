import React, { useState } from 'react';
import { VoiceConfig, OllamaModel } from '../types';
import { 
  Cpu, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Sliders, 
  HardDrive, 
  Sparkles, 
  Layers, 
  Terminal, 
  Clipboard, 
  Folder, 
  Zap, 
  Download, 
  CheckCircle2, 
  ExternalLink,
  Search,
  Box,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { OS_GUIDES } from '../utils/platform';

interface ModelsViewProps {
  config: VoiceConfig;
  onChange: (newConfig: VoiceConfig) => void;
  availableModels: OllamaModel[];
  onRefreshModels: () => Promise<any>;
  isRefreshingModels: boolean;
  connectionStatus: 'checking' | 'connected' | 'failed' | 'idle';
  onClearSessionContext?: () => void;
  sessionTurnsCount?: number;
}

export default function ModelsView({
  config,
  onChange,
  availableModels,
  onRefreshModels,
  isRefreshingModels,
  connectionStatus,
  onClearSessionContext,
  sessionTurnsCount = 0
}: ModelsViewProps) {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [manualModelInput, setManualModelInput] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Common popular models available in Ollama library
  const recommendedModels = [
    { name: 'llama3.2', desc: 'Meta Llama 3.2 (3B) - Ultra-fast, ideal for 32GB RAM & laptop CPUs', tag: 'Fast / Daily' },
    { name: 'deepseek-r1:8b', desc: 'DeepSeek R1 (8B) - State-of-the-art reasoning and code architecture', tag: 'Reasoning' },
    { name: 'mistral:7b', desc: 'Mistral 7B v0.3 - Strong balanced reasoning and voice conversational flow', tag: 'Balanced' },
    { name: 'qwen2.5:7b', desc: 'Qwen 2.5 (7B) - High precision multilingual & structured markdown outputs', tag: 'High Precision' },
    { name: 'phi3:mini', desc: 'Microsoft Phi-3 Mini (3.8B) - Compact, high mathematical & logic density', tag: 'Lightweight' },
  ];

  // Helper for model size display
  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

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

  // Filtered available models on the PC
  const filteredModels = availableModels.filter(m => 
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    switch (presetName) {
      case 'balanced_pc':
        onChange({
          ...config,
          lowVramMode: false,
          numCtx: 4096,
          maxContextTurns: 4,
          keepAlive: '5m',
          temperature: 0.7
        });
        break;
      case 'performance_gpu':
        onChange({
          ...config,
          lowVramMode: false,
          numCtx: 8192,
          maxContextTurns: 6,
          keepAlive: '15m',
          temperature: 0.7
        });
        break;
      case 'eco_laptop':
        onChange({
          ...config,
          lowVramMode: true,
          numCtx: 2048,
          maxContextTurns: 2,
          keepAlive: '0s',
          temperature: 0.6
        });
        break;
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-bold text-lg tracking-tight">Windows PC Ollama Models Manager</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Active: {config.model}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select from installed local models in <code className="text-slate-300 font-mono">%USERPROFILE%\.ollama\models</code>, scan your PC, or configure inference hyperparameters.
            </p>
          </div>
        </div>

        {/* Scan / Refresh Action */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefreshModels}
            disabled={isRefreshingModels}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl shadow-md font-mono text-xs font-semibold transition-all"
            title="Scan Windows PC for installed Ollama models"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingModels ? 'animate-spin' : ''}`} />
            <span>{isRefreshingModels ? 'Scanning PC...' : 'Scan Local Models'}</span>
          </button>

          {connectionStatus === 'connected' ? (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" /> {availableModels.length} Models Found
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" /> Ollama Offline
            </span>
          )}
        </div>
      </div>

      {/* WINDOWS CORS LAUNCH GUIDE (IF OFFLINE) */}
      {connectionStatus !== 'connected' && (
        <div className="bg-slate-900 border border-rose-800/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Ollama Not Detected on Port 11434</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const cmd = `$env:OLLAMA_ORIGINS="*" ; ollama serve`;
                navigator.clipboard.writeText(cmd);
                setCopiedCommand(true);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <Clipboard className="w-3.5 h-3.5 text-teal-400" />
              {copiedCommand ? 'Copied PowerShell Command!' : 'Copy Windows Command'}
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-2 leading-relaxed">
            Windows requires enabling CORS origins so the browser can query local models. Open <strong>PowerShell</strong> and run:
          </p>
          <div className="bg-black/70 p-3 rounded-xl font-mono text-emerald-400 text-xs border border-slate-800 select-all mb-2">
            $env:OLLAMA_ORIGINS="*" ; ollama serve
          </div>
          <p className="text-[11px] text-slate-400">
            Tip: If Ollama is running in the Windows System Tray (near your clock), right-click and choose <strong>Exit Ollama</strong> before running the PowerShell command above.
          </p>
        </div>
      )}

      {/* SECTION 1: CHOOSE FROM EXISTING MODELS ON WINDOWS PC */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" /> Installed Models on Your PC ({availableModels.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any model to immediately set it as the active target for voice and studio queries.
            </p>
          </div>

          {/* Search Box */}
          {availableModels.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                placeholder="Filter installed models..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500 w-52"
              />
            </div>
          )}
        </div>

        {/* Existing Models Grid */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredModels.map((m) => {
              const isSelected = config.model === m.name;
              return (
                <div
                  key={m.name}
                  onClick={() => onChange({ ...config, model: m.name })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-gradient-to-br from-sky-950/80 to-slate-900 border-sky-500 text-white shadow-lg shadow-sky-500/10' 
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <Box className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="font-mono font-bold text-sm text-white block truncate max-w-[180px]">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatSize(m.size)}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 hover:text-slate-300">
                          Select
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono space-y-0.5 mt-2 pt-2 border-t border-slate-800/80">
                      {m.family && <div>Family: <strong className="text-slate-300">{m.family}</strong></div>}
                      {m.format && <div>Format: <span className="text-slate-400">{m.format.toUpperCase()}</span></div>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...config, model: m.name });
                    }}
                    className={`mt-3 w-full py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                      isSelected 
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isSelected ? 'Currently Selected' : 'Switch to this Model'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
            <HardDrive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              {availableModels.length === 0 ? 'No models detected on local Ollama server' : 'No models matched your search'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Make sure Ollama is running on your PC. You can pull any model below or enter a custom model tag manually.
            </p>
          </div>
        )}

        {/* Custom / Manual Model Input */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={manualModelInput}
              onChange={(e) => setManualModelInput(e.target.value)}
              placeholder="Enter custom model tag (e.g. llama3.2, mistral, deepseek-r1:8b)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => {
                if (manualModelInput.trim()) {
                  onChange({ ...config, model: manualModelInput.trim() });
                  setManualModelInput('');
                }
              }}
              disabled={!manualModelInput.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-semibold border border-slate-700 transition"
            >
              Set Active
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Model Directory:</span>
            <code className="text-slate-300 bg-black/40 px-2 py-1 rounded border border-slate-800 text-[11px]">
              %USERPROFILE%\.ollama\models
            </code>
          </div>
        </div>
      </div>

      {/* SECTION 2: POPULAR OLLAMA LIBRARY MODELS & PULL COMMANDS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Download className="w-4 h-4 text-emerald-400" /> Windows Terminal Pull Commands
        </h3>
        <p className="text-xs text-slate-400">
          Want to install another model on your Windows PC? Open PowerShell or Windows Terminal and run any of these commands:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendedModels.map((item) => {
            const isCurrent = config.model.toLowerCase().includes(item.name.toLowerCase());
            return (
              <div key={item.name} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-white">{item.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <code className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-1 rounded border border-slate-800 select-all truncate">
                    ollama run {item.name}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`ollama run ${item.name}`);
                      setCopiedCommand(true);
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 shrink-0"
                    title="Copy command"
                  >
                    <Clipboard className="w-3 h-3 text-teal-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: INFERENCE HYPERPARAMETERS & RUNTIME MEMORY ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Endpoint & Memory Controls */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <HardDrive className="w-4 h-4 text-purple-400" /> Ollama Endpoint & Model Memory Residency
            </h3>

            {/* Endpoint */}
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                Ollama Endpoint URL
              </label>
              <input
                type="text"
                name="ollamaUrl"
                value={config.ollamaUrl}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                placeholder="http://localhost:11434"
              />
            </div>

            {/* Keep-Alive Residency */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  Model Residency (Keep-Alive)
                </label>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {config.keepAlive === '0s' ? 'Instant Eviction (0s)' : config.keepAlive === '-1' ? 'Indefinite Residency' : config.keepAlive}
                </span>
              </div>
              <select
                name="keepAlive"
                value={config.keepAlive}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="0s">0s - Unload model immediately after reply (Zero idle VRAM/RAM)</option>
                <option value="1m">1 minute - Unload after 60s idle</option>
                <option value="5m">5 minutes (Recommended for 32GB RAM PC) - Keeps model warm</option>
                <option value="15m">15 minutes - Long working session</option>
                <option value="-1">Indefinite (-1) - Never unload model</option>
              </select>
            </div>

            {/* Continuous Context Multi-turn */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Conversational History Memory</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Retains previous user & assistant turns in context for natural follow-ups.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...config, enableSessionContext: !config.enableSessionContext })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border shrink-0 ${
                  config.enableSessionContext
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config.enableSessionContext ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Max History Turns Slider */}
            {config.enableSessionContext && (
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Memory Depth ({config.maxContextTurns || 4} turns)</span>
                  <span className="text-sky-400 font-bold">{(config.maxContextTurns || 4) * 2} messages</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={config.maxContextTurns || 4}
                  onChange={(e) => handleNumberChange('maxContextTurns', parseInt(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
              </div>
            )}

            {/* Context Buffer Status & Reset */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-400">
                Active Context Turns: <strong className="text-white">{sessionTurnsCount} turn(s)</strong>
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
        </div>

        {/* Right: Hyperparameters & Sampling Sliders */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <span>LLM Sampling & Token Parameters</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Native Ollama API</span>
            </h3>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-slate-300">Temperature</span>
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
                <span>0.0 (Strict / Logic)</span>
                <span>0.7 (Balanced)</span>
                <span>1.4 (Creative)</span>
              </div>
            </div>

            {/* Context Window Length */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-slate-300">Context Window (num_ctx)</span>
                <span className="text-indigo-400 font-bold">{config.numCtx} tokens</span>
              </div>
              <select
                name="numCtx"
                value={config.numCtx}
                onChange={(e) => handleNumberChange('numCtx', parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="2048">2048 (Low-RAM / Rapid turnaround)</option>
                <option value="4096">4096 (Standard Windows 32GB RAM default)</option>
                <option value="8192">8192 (Deep Context Document Analysis)</option>
                <option value="16384">16384 (High Context)</option>
                <option value="32768">32768 (Max Context Window)</option>
              </select>
            </div>

            {/* Top-P and Top-K */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Top-P</span>
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
            </div>

            {/* System Persona Prompt */}
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1.5 uppercase tracking-wider">
                System Instructions / Persona
              </label>
              <textarea
                name="systemPrompt"
                value={config.systemPrompt}
                onChange={handleTextChange}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-sky-500 font-sans"
                placeholder="Instruct the model on tone, persona, and output style..."
              />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
