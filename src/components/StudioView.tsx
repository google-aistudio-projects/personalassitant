import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceConfig, MetricsRun, ResponseMetrics, ChatMessage } from '../types';
import VoiceWaveform from './VoiceWaveform';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Download, 
  FileText, 
  Code, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Zap, 
  Clock, 
  Database, 
  Eye, 
  FileCode2, 
  Layers, 
  ListOrdered, 
  Terminal, 
  Maximize2,
  Minimize2,
  ChevronDown,
  History,
  Sliders,
  Share2,
  MessageSquare,
  Cpu,
  Bird,
  Feather
} from 'lucide-react';

interface StudioViewProps {
  config: VoiceConfig;
  onChangeConfig?: React.Dispatch<React.SetStateAction<VoiceConfig>>;
  status: 'idle' | 'listening_wake' | 'recording_command' | 'processing' | 'speaking' | 'disabled';
  runs: MetricsRun[];
  latestMetrics: ResponseMetrics | null;
  sessionMessages?: ChatMessage[];
  onClearSessionContext?: () => void;
  onPurgeVram?: () => void;
  isPurgingVram?: boolean;
  purgeSuccess?: boolean;
  onToggleLowVramMode?: (enable?: boolean) => void;
  isSpeaking: boolean;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onSpeakText: (text: string) => void;
  onSendQuery: (prompt: string) => void;
  onSelectTab: (tab: 'studio' | 'models' | 'voice' | 'config' | 'dashboard' | 'python' | 'monitoring' | 'logs') => void;
}

export default function StudioView({
  config,
  onChangeConfig,
  status,
  runs,
  latestMetrics,
  sessionMessages = [],
  onClearSessionContext,
  onPurgeVram,
  isPurgingVram = false,
  purgeSuccess = false,
  onToggleLowVramMode,
  isSpeaking,
  isListening,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onSpeakText,
  onSendQuery,
  onSelectTab,
}: StudioViewProps) {
  const [promptText, setPromptText] = useState('');
  const [activeViewMode, setActiveViewMode] = useState<'markdown' | 'raw'>('markdown');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const outputOnlyRef = useRef<HTMLDivElement>(null);

  // Active run to display (latest or selected from history)
  const activeRun = selectedRunId 
    ? runs.find(r => r.id === selectedRunId) || (runs.length > 0 ? runs[runs.length - 1] : null)
    : (runs.length > 0 ? runs[runs.length - 1] : null);

  // Auto-scroll textarea or resize dynamically
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!promptText.trim() || status === 'processing') return;
    const query = promptText.trim();
    onSendQuery(query);
    // Don't clear immediately if user wants to tweak, or clear if desired
  };

  const handleClearPrompt = () => {
    setPromptText('');
    textareaRef.current?.focus();
  };

  const applyTemplate = (templatePrompt: string) => {
    setPromptText(templatePrompt);
    textareaRef.current?.focus();
  };

  // Copy whole response as Markdown
  const handleCopyResponse = async () => {
    if (!activeRun?.response) return;
    try {
      await navigator.clipboard.writeText(activeRun.response);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    } catch (e) {
      console.error('Failed to copy response', e);
    }
  };

  // Copy code snippet
  const handleCopyCode = async (codeText: string, id: string) => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (e) {
      console.error('Failed to copy code snippet', e);
    }
  };

  // Export to .md file
  const handleExportMarkdown = () => {
    if (!activeRun) return;
    const title = activeRun.prompt.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_') || 'response';
    const content = `# Prompt Query\n> ${activeRun.prompt}\n\n**Model:** \`${activeRun.model}\`  \n**Date:** ${new Date().toLocaleString()}  \n**Tokens:** ${activeRun.totalTokens} (${activeRun.tokensPerSec.toFixed(1)} t/s)\n\n---\n\n## Response\n\n${activeRun.response}\n`;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ollama_${title}_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to standalone styled .html file
  const handleExportHTML = () => {
    if (!activeRun) return;
    const title = activeRun.prompt.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_') || 'response';
    
    // Generate clean HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ollama Response - ${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.2.0/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 900px;
      margin: 0 auto;
      padding: 45px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .header-box {
      background: #0f172a;
      color: #f8fafc;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .header-box h1 { margin: 0 0 10px 0; font-size: 20px; color: #38bdf8; }
    .header-box p { margin: 0; font-size: 14px; opacity: 0.9; }
    .meta-tags { display: flex; gap: 12px; margin-top: 15px; font-size: 12px; font-family: monospace; color: #94a3b8; }
    .markdown-body {
      background: #ffffff;
      padding: 36px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      border: 1px solid #e2e8f0;
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #090d16; color: #f1f5f9; }
      .markdown-body { background: #0f172a; color: #f1f5f9; border-color: #1e293b; }
    }
    @media print {
      body { background: white; color: black; padding: 10px; }
      .header-box { background: #eee; color: black; border: 1px solid #ccc; }
      .markdown-body { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>Prompt Query</h1>
    <p>"${activeRun.prompt.replace(/"/g, '&quot;')}"</p>
    <div class="meta-tags">
      <span>Model: ${activeRun.model}</span>
      <span>Speed: ${activeRun.tokensPerSec.toFixed(1)} t/s</span>
      <span>Tokens: ${activeRun.totalTokens}</span>
      <span>Date: ${new Date().toLocaleString()}</span>
    </div>
  </div>
  <article class="markdown-body">
    <div style="white-space: pre-wrap; font-family: inherit;">${activeRun.response.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </article>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ollama_${title}_${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Trigger Print / PDF export dialog - EXPORTS OUTPUT ONLY (No input prompts)
  const handlePrintPDF = () => {
    if (!activeRun) return;
    
    // Extract rendered output HTML directly (excluding any prompt headers or interactive buttons)
    let outputHtml = '';
    if (outputOnlyRef.current) {
      const clone = outputOnlyRef.current.cloneNode(true) as HTMLElement;
      // Strip out interactive buttons like "Copy Code"
      clone.querySelectorAll('button').forEach(btn => btn.remove());
      // Strip out any elements with select-none utility class
      clone.querySelectorAll('.select-none').forEach(el => el.remove());
      outputHtml = clone.innerHTML;
    } else {
      // Clean fallback if rendered DOM node is unavailable
      outputHtml = `<div style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65;">${activeRun.response.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    }

    const docFileName = `Ollama_Output_${activeRun.model.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${docFileName}</title>
    <style>
      @page {
        margin: 18mm 15mm 18mm 15mm;
        size: auto;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        padding: 30px 40px;
        color: #0f172a;
        background-color: #ffffff;
        line-height: 1.65;
        max-width: 860px;
        margin: 0 auto;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Clean metadata bar: ONLY model name & generation info, ZERO input prompt */
      .doc-meta-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        margin-bottom: 24px;
        border-bottom: 2px solid #e2e8f0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        color: #64748b;
      }
      .doc-meta-bar strong {
        color: #0284c7;
        font-weight: 600;
      }
      /* Output document styling */
      .output-content {
        font-size: 14px;
        color: #0f172a;
      }
      .output-content h1, .output-content h2, .output-content h3, .output-content h4 {
        color: #0f172a !important;
        font-weight: 700;
        margin-top: 24px;
        margin-bottom: 10px;
        line-height: 1.3;
      }
      .output-content h1 {
        font-size: 20px;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 8px;
      }
      .output-content h2 {
        font-size: 17px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
      }
      .output-content h3 {
        font-size: 15px;
      }
      .output-content p {
        margin: 10px 0 14px 0;
        color: #1e293b !important;
        line-height: 1.65;
      }
      .output-content ul, .output-content ol {
        margin: 10px 0 14px 0;
        padding-left: 24px;
        color: #1e293b !important;
      }
      .output-content li {
        margin: 4px 0;
        color: #1e293b !important;
      }
      .output-content blockquote {
        border-left: 4px solid #0284c7 !important;
        background: #f8fafc !important;
        color: #334155 !important;
        margin: 16px 0;
        padding: 10px 16px;
        border-radius: 0 8px 8px 0;
        font-style: italic;
      }
      .output-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .output-content th, .output-content td {
        border: 1px solid #cbd5e1 !important;
        padding: 8px 12px;
        text-align: left;
        color: #0f172a !important;
      }
      .output-content th {
        background-color: #f1f5f9 !important;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 10px;
        letter-spacing: 0.05em;
      }
      .output-content pre {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0;
        overflow-x: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #0f172a !important;
        white-space: pre-wrap;
      }
      .output-content code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        background: #f1f5f9 !important;
        color: #0f172a !important;
        padding: 2px 5px;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }
      .output-content pre code {
        background: transparent !important;
        border: none !important;
        padding: 0;
      }
      .output-content strong {
        color: #0f172a !important;
        font-weight: 600;
      }
      /* Clean normalization for dark theme classes captured from DOM */
      .bg-slate-950, .bg-slate-900, .bg-slate-800, .bg-indigo-950\\/20 {
        background: #f8fafc !important;
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
      }
      .text-white, .text-slate-200, .text-slate-300, .text-slate-400 {
        color: #0f172a !important;
      }
      .text-sky-300, .text-sky-400, .text-indigo-300, .text-indigo-400 {
        color: #0369a1 !important;
      }
      .text-emerald-300, .text-emerald-400 {
        color: #047857 !important;
      }
      .border-slate-800, .border-slate-700 {
        border-color: #cbd5e1 !important;
      }
      button, .no-print {
        display: none !important;
      }
      @media print {
        body {
          padding: 0;
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="doc-meta-bar">
      <span>Model Output: <strong>${activeRun.model}</strong></span>
      <span>${activeRun.timestamp} • ${activeRun.totalTokens} tokens (${activeRun.tokensPerSec.toFixed(1)} t/s)</span>
    </div>
    <div class="output-content">
      ${outputHtml}
    </div>
    <script>
      window.onload = function() {
        window.print();
        setTimeout(function() { window.close(); }, 500);
      };
    </script>
  </body>
</html>`;

    // Attempt popup window print first
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      // Fallback for iframe environments or strict popup blockers
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
      const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (doc) {
        doc.write(htmlContent);
        doc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 1000);
        }, 300);
      }
    }
  };

  const wordCount = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;
  const charCount = promptText.length;

  return (
    <div className="w-full space-y-6">
      {/* Studio Banner & Mode Controls */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Bird className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold text-base sm:text-lg flex items-center gap-2">
                Peacock Studio
              </h2>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                <Feather className="w-2.5 h-2.5" />
                {config.model}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal Assistant built using Llama and Gemini AI Studio • Request sending & structured Markdown response aggregation.
            </p>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Hands-free Voice Toggle */}
          <button
            onClick={isListening ? onStopListening : onStartListening}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all border shadow-sm ${
              isListening 
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Toggle Hands-Free Speech Engine"
          >
            {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
            <span>{isListening ? `Listening for "${config.wakeWord}"` : 'Enable Hands-Free Mic'}</span>
          </button>

          {/* Quick Voice Waveform Drawer Toggle */}
          <button
            onClick={() => setShowWaveform(!showWaveform)}
            className={`px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
              showWaveform ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300' : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title="Toggle Audio Visualizer"
          >
            {showWaveform ? 'Waveform: ON' : 'Waveform: OFF'}
          </button>

          {/* History Drawer Toggle */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
              showHistoryDrawer ? 'bg-sky-950/80 border-sky-600 text-sky-300' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Session Logs ({runs.length})</span>
          </button>
        </div>
      </div>

      {/* Sessional Context Buffer & Memory Status Indicator */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.enableSessionContext ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-300 font-semibold">
              Context Memory: {config.enableSessionContext ? `Active (Chaining ${config.maxContextTurns || 2} turns)` : 'Disabled (Stateless)'}
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <span className="text-slate-400 text-[11px]">
            {sessionMessages.length > 0 ? (
              <span>Buffer contains <strong className="text-sky-300">{Math.floor(sessionMessages.length / 2)} turn(s)</strong> ({sessionMessages.length} total messages)</span>
            ) : (
              <span className="text-slate-500">Context buffer empty (fresh conversation)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {sessionMessages.length > 0 && (
            <>
              <button
                onClick={() => setShowContextPreview(!showContextPreview)}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3 text-sky-400" />
                <span>{showContextPreview ? 'Hide Context Turns' : 'Inspect Context'}</span>
              </button>

              {onClearSessionContext && (
                <button
                  onClick={onClearSessionContext}
                  className="text-[11px] px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded transition-colors flex items-center gap-1"
                  title="Clear conversation history to reset context and free VRAM"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Reset Context</span>
                </button>
              )}
            </>
          )}

          {onChangeConfig && (
            <button
              onClick={() => onChangeConfig(prev => ({ ...prev, enableSessionContext: !prev.enableSessionContext }))}
              className={`text-[11px] px-2.5 py-1 rounded border font-semibold transition-all ${
                config.enableSessionContext
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {config.enableSessionContext ? 'Context Chaining: ON' : 'Context Chaining: OFF'}
            </button>
          )}
        </div>
      </div>

      {/* Context Inspection Drawer */}
      <AnimatePresence>
        {showContextPreview && sessionMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
                <MessageSquare className="w-3.5 h-3.5" /> Active Messages Sent to Ollama in Next Request
              </span>
              <span className="text-[10px] text-slate-500">Only the last {config.maxContextTurns * 2} messages will be passed to stay light on VRAM</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {sessionMessages.slice(-config.maxContextTurns * 2).map((msg, i) => (
                <div key={msg.id || i} className={`p-2.5 rounded-lg border text-left ${msg.role === 'user' ? 'bg-sky-950/30 border-sky-800/60 text-sky-100' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <strong className={msg.role === 'user' ? 'text-sky-400 uppercase' : 'text-emerald-400 uppercase'}>{msg.role}</strong>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="line-clamp-2 text-xs font-sans">{msg.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Waveform Bar if active or enabled */}
      <AnimatePresence>
        {showWaveform && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <VoiceWaveform 
              status={status} 
              wakeWord={config.wakeWord} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session History Drawer (Collapsible) */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-400" /> Previous Generations in this Session
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Click a query to load its complete markdown view</span>
            </div>

            {runs.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-4 text-center">No runs recorded yet. Send your first prompt below!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {runs.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    onClick={() => setSelectedRunId(r.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      (selectedRunId === r.id || (!selectedRunId && idx === runs.length - 1))
                        ? 'bg-sky-950/40 border-sky-600/80 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                      <span>{r.timestamp}</span>
                      <span className="text-emerald-400 font-semibold">{r.tokensPerSec.toFixed(1)} t/s</span>
                    </div>
                    <p className="text-xs font-medium line-clamp-1 text-slate-200">
                      "{r.prompt}"
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>{r.totalTokens} tokens</span>
                      <span>•</span>
                      <span>{(r.totalDurationMs / 1000).toFixed(2)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Studio Grid: Top/Bottom or Side-by-Side Spacious Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* REQUEST SENDING PANE (Prompt Box) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                    Request Sending Window
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                </div>
              </div>

              {/* Quick Template Pills */}
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Templates:</span>
                <button
                  onClick={() => applyTemplate("Write an in-depth, structured markdown report with key takeaways, bulleted metrics, and a comparison table analyzing: ")}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-md font-mono shrink-0 transition-colors"
                >
                  📊 Analysis Report
                </button>
                <button
                  onClick={() => applyTemplate("Provide a clean Python implementation with detailed docstrings, error handling, markdown explanations, and usage examples for: ")}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-md font-mono shrink-0 transition-colors"
                >
                  🐍 Python Code
                </button>
                <button
                  onClick={() => applyTemplate("Summarize the core principles, pros/cons, and future outlook in clear markdown sections for: ")}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-md font-mono shrink-0 transition-colors"
                >
                  📋 Executive Summary
                </button>
                <button
                  onClick={() => applyTemplate("Compare and contrast the architectures, performance tradeoffs, and recommended use cases between: ")}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-md font-mono shrink-0 transition-colors"
                >
                  ⚖️ Comparison
                </button>
              </div>

              {/* Large Input Textarea */}
              <div className="relative rounded-xl border border-slate-800 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 bg-slate-950 transition-all">
                <textarea
                  ref={textareaRef}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={8}
                  placeholder={`Type your extensive prompt here, or use voice commands...\n\nExamples:\n• "Compare PostgreSQL vs SQLite for local AI applications with a comparison table."\n• "Explain how attention mechanisms work with step-by-step math."\n\n(Tip: Press Ctrl+Enter or Cmd+Enter to send)`}
                  className="w-full bg-transparent p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-y font-sans leading-relaxed min-h-[180px]"
                />

                {/* Status Bar inside Textarea bottom */}
                <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/60 rounded-b-xl flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Target: <strong className="text-slate-300">{config.model}</strong>
                  </span>
                  <span>Ctrl+Enter to Send</span>
                </div>
              </div>
            </div>

            {/* Prompt Actions */}
            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearPrompt}
                  disabled={!promptText}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-all disabled:opacity-30 disabled:hover:text-slate-400"
                  title="Clear prompt text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectTab('models')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition font-mono"
                  title="Adjust Temperature, Top-P, Context & Models"
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tuning ({config.temperature})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {status === 'processing' ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-mono font-semibold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Generating Response...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!promptText.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-sky-500 disabled:hover:to-indigo-600 text-white rounded-xl text-xs font-mono font-semibold shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Generate Response</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Mini-Card */}
          {latestMetrics && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Latest Generation Speed
                </span>
                <span className="text-emerald-400 font-bold">{latestMetrics.tokensPerSecond.toFixed(1)} tokens/sec</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                <div>
                  <span className="block text-slate-500">Latency</span>
                  <span className="text-slate-200 font-semibold">{(latestMetrics.totalDurationMs / 1000).toFixed(2)}s</span>
                </div>
                <div>
                  <span className="block text-slate-500">Input / Output</span>
                  <span className="text-slate-200 font-semibold">{latestMetrics.promptEvalCount} / {latestMetrics.evalCount} tok</span>
                </div>
                <div>
                  <span className="block text-slate-500">Decode Phase</span>
                  <span className="text-slate-200 font-semibold">{latestMetrics.evalDurationMs.toFixed(0)}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RESPONSE AGGREGATION PANE (Expansive Markdown Viewer & Transformation Suite) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col min-h-[620px]">
            
            {/* Header & Transformation Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                  Response Aggregation Window
                </h3>
              </div>

              {/* View Switcher and Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Markdown View Toggle */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono select-none">
                  <button
                    onClick={() => setActiveViewMode('markdown')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      activeViewMode === 'markdown' 
                        ? 'bg-slate-800 text-white font-semibold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Rendered Markdown Preview"
                  >
                    <Eye className="w-3 h-3" /> Formatted MD
                  </button>
                  <button
                    onClick={() => setActiveViewMode('raw')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      activeViewMode === 'raw' 
                        ? 'bg-slate-800 text-white font-semibold shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Raw Markdown Source Code"
                  >
                    <Code className="w-3 h-3" /> Raw Source
                  </button>
                </div>

                {/* Read Aloud TTS */}
                {isSpeaking ? (
                  <button
                    onClick={onStopSpeaking}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg font-mono transition-all animate-pulse"
                    title="Stop Voice Narration"
                  >
                    <VolumeX className="w-3.5 h-3.5" /> Stop Voice
                  </button>
                ) : (
                  <button
                    onClick={() => activeRun?.response && onSpeakText(activeRun.response)}
                    disabled={!activeRun?.response}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-mono transition-all disabled:opacity-30"
                    title="Speak Response Aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Read Aloud
                  </button>
                )}

                {/* Copy Markdown */}
                <button
                  onClick={handleCopyResponse}
                  disabled={!activeRun?.response}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-mono transition-all disabled:opacity-30"
                  title="Copy Full Markdown Output"
                >
                  {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedResponse ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* Export Options Dropdown or Direct Buttons */}
                <div className="flex items-center gap-1">
                  {/* Export as .md */}
                  <button
                    onClick={handleExportMarkdown}
                    disabled={!activeRun?.response}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded-lg font-mono transition-all disabled:opacity-30"
                    title="Download as Markdown file (.md)"
                  >
                    <Download className="w-3.5 h-3.5" /> .MD
                  </button>

                  {/* Export as .html */}
                  <button
                    onClick={handleExportHTML}
                    disabled={!activeRun?.response}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded-lg font-mono transition-all disabled:opacity-30"
                    title="Download as standalone HTML file (.html)"
                  >
                    <FileCode2 className="w-3.5 h-3.5" /> .HTML
                  </button>

                  {/* Print / Save as PDF */}
                  <button
                    onClick={handlePrintPDF}
                    disabled={!activeRun?.response}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-700/50 rounded-lg font-mono transition-all disabled:opacity-30"
                    title="Print or Export to PDF (Output only - excludes input prompt)"
                  >
                    <Printer className="w-3.5 h-3.5" /> PDF / Print
                  </button>
                </div>
              </div>
            </div>

            {/* Response Content View */}
            <div className="flex-1 py-4 overflow-y-auto select-text scrollbar-thin scrollbar-thumb-slate-800">
              {!activeRun ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 text-slate-600 shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-medium text-base mb-1">Awaiting Generation Query</h4>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                    Submit a prompt in the Request Sending Window or say <strong className="text-sky-400 font-mono font-semibold">"{config.wakeWord}"</strong> to see extensive, fully-formatted markdown responses rendered here.
                  </p>
                </div>
              ) : activeViewMode === 'raw' ? (
                /* Raw Markdown Source */
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {activeRun.response}
                </div>
              ) : (
                /* Formatted Markdown Rendered Document */
                <div ref={printContainerRef} className="space-y-4 px-2">
                  {/* Context Header for the Query */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Query Prompt</span>
                      <p className="text-xs text-sky-200 font-medium italic leading-relaxed">
                        "{activeRun.prompt}"
                      </p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-400 shrink-0">
                      <span className="text-emerald-400 font-bold block">{activeRun.tokensPerSec.toFixed(1)} t/s</span>
                      <span>{activeRun.totalTokens} tokens</span>
                    </div>
                  </div>

                  {/* Markdown Renderer with Custom Styled Tags */}
                  <div ref={outputOnlyRef} id="studio-rendered-output" className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-3 font-sans">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-xl font-bold text-white border-b border-slate-800 pb-2 mt-6 mb-3 flex items-center gap-2" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-lg font-semibold text-sky-300 mt-5 mb-2 flex items-center gap-2" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-base font-semibold text-indigo-300 mt-4 mb-2" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-3 text-slate-300 leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-6 space-y-1.5 my-3 text-slate-300 marker:text-sky-400" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-6 space-y-1.5 my-3 text-slate-300 marker:text-emerald-400 font-mono text-xs" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="pl-1" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-indigo-500 bg-indigo-950/20 px-4 py-2 my-4 rounded-r-lg text-slate-300 italic" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 bg-slate-950">
                            <table className="min-w-full divide-y divide-slate-800 text-xs font-mono" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-slate-900 text-sky-400 uppercase tracking-wider text-[10px]" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                          <th className="px-4 py-2.5 text-left font-semibold" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="px-4 py-2.5 text-slate-300 border-t border-slate-800/60" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-white" {...props} />
                        ),
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          const codeId = Math.random().toString();

                          if (!inline) {
                            return (
                              <div className="relative my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
                                <div className="bg-slate-900/90 px-4 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 select-none">
                                  <span className="text-sky-400 font-bold uppercase">{match ? match[1] : 'code'}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(codeString, codeId)}
                                    className="flex items-center gap-1 px-2 py-0.5 hover:bg-slate-800 hover:text-white rounded transition-colors text-[10px]"
                                  >
                                    {copiedCodeId === codeId ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy Code</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <div className="p-4 overflow-x-auto text-emerald-300 leading-normal">
                                  <code>{children}</code>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-700/60" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {activeRun.response}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Metadata & Export Summary */}
            {activeRun && (
              <div className="pt-3 border-t border-slate-800/80 mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
                <div className="flex items-center gap-3">
                  <span>Model: <strong className="text-indigo-400">{activeRun.model}</strong></span>
                  <span>•</span>
                  <span>Generated at {activeRun.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Export:</span>
                  <button onClick={handleExportMarkdown} className="hover:text-emerald-400 underline transition-colors">Markdown</button>
                  <span>|</span>
                  <button onClick={handleExportHTML} className="hover:text-indigo-400 underline transition-colors">HTML</button>
                  <span>|</span>
                  <button onClick={handlePrintPDF} className="hover:text-sky-400 underline transition-colors" title="Export Output to PDF">PDF (Output Only)</button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
