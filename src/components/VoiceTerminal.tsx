import React, { useRef, useEffect } from 'react';
import { TerminalLog } from '../types';
import { Terminal, Trash2, Mic, VolumeX, ShieldCheck, Play, ArrowRight, CornerDownLeft } from 'lucide-react';

interface VoiceTerminalProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  onStopSpeaking: () => void;
  isSpeaking: boolean;
  manualText: string;
  setManualText: (text: string) => void;
  onSendManualText: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  isListening: boolean;
}

export default function VoiceTerminal({
  logs,
  onClearLogs,
  onStopSpeaking,
  isSpeaking,
  manualText,
  setManualText,
  onSendManualText,
  onStartListening,
  onStopListening,
  isListening,
}: VoiceTerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSendManualText();
    }
  };

  const getLogColor = (type: TerminalLog['type']) => {
    switch (type) {
      case 'system':
        return 'text-slate-400';
      case 'listening':
        return 'text-sky-400';
      case 'user':
        return 'text-emerald-400';
      case 'assistant':
        return 'text-pink-400';
      case 'error':
        return 'text-rose-400 font-semibold';
      default:
        return 'text-white';
    }
  };

  const getLogTag = (type: TerminalLog['type']) => {
    switch (type) {
      case 'system':
        return '[SYS]';
      case 'listening':
        return '[MIC]';
      case 'user':
        return '[YOU]';
      case 'assistant':
        return '[LLM]';
      case 'error':
        return '[ERR]';
      default:
        return '[LOG]';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
      {/* Terminal Header */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-300 font-mono tracking-wider uppercase">Voice Communication Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Speech Interrupt Button */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg border border-pink-500/30 transition-all font-mono animate-pulse"
              title="Interrupt speech synthesis"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop Voice
            </button>
          )}

          {/* Toggle Listening Button */}
          <button
            onClick={isListening ? onStopListening : onStartListening}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-lg border transition-all ${
              isListening
                ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            {isListening ? 'Disable Voice' : 'Enable Voice'}
          </button>

          {/* Clear Button */}
          <button
            onClick={onClearLogs}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Clear Terminal Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal logs content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800">
        {logs.length === 0 ? (
          <div className="text-slate-600 h-full flex flex-col items-center justify-center gap-2 select-none">
            <ShieldCheck className="w-8 h-8 text-slate-700 animate-pulse" />
            <span>Terminal initialized. Awaiting system wake triggers...</span>
            <span className="text-[10px] text-slate-700">Click "Enable Voice" above to begin voice interaction.</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 items-start hover:bg-slate-900/30 py-0.5 px-1 rounded transition-colors">
              <span className="text-slate-600 select-none text-[10px] pt-0.5">{log.timestamp}</span>
              <span className={`select-none font-bold shrink-0 ${getLogColor(log.type)}`}>
                {getLogTag(log.type)}
              </span>
              <span className={`whitespace-pre-wrap flex-1 ${log.type === 'user' ? 'text-emerald-300' : log.type === 'assistant' ? 'text-slate-200' : 'text-slate-400'}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Keyboard/Text Input Fallback */}
      <div className="bg-slate-900 p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
            placeholder="Type manually here... (Fallback for quiet rooms or if Mic/CORS is blocked)"
          />
          <button
            onClick={onSendManualText}
            disabled={!manualText.trim()}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white rounded-lg text-xs font-mono transition flex items-center gap-1 font-semibold"
          >
            Send <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
