import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles, HelpCircle } from 'lucide-react';

interface VoiceWaveformProps {
  status: 'idle' | 'listening_wake' | 'recording_command' | 'processing' | 'speaking' | 'disabled';
  wakeWord: string;
}

export default function VoiceWaveform({ status, wakeWord }: VoiceWaveformProps) {
  const [bars, setBars] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);

  // Animate bars when active
  useEffect(() => {
    if (status !== 'recording_command' && status !== 'speaking') {
      setBars(Array(10).fill(6));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev =>
        prev.map(() => {
          const min = status === 'recording_command' ? 12 : 8;
          const max = status === 'recording_command' ? 56 : 40;
          return Math.floor(Math.random() * (max - min + 1) + min);
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'text-slate-400 bg-slate-900 border-slate-800';
      case 'listening_wake':
        return 'text-sky-400 bg-sky-950/40 border-sky-800/60 shadow-[0_0_20px_rgba(14,165,233,0.15)]';
      case 'recording_command':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]';
      case 'processing':
        return 'text-violet-400 bg-violet-950/40 border-violet-800/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]';
      case 'speaking':
        return 'text-pink-400 bg-pink-950/40 border-pink-800/60 shadow-[0_0_25px_rgba(236,72,153,0.25)]';
      case 'disabled':
      default:
        return 'text-slate-500 bg-slate-950 border-slate-900';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'idle':
        return 'System Standby';
      case 'listening_wake':
        return `Listening for Wake Word: "${wakeWord}"`;
      case 'recording_command':
        return 'Listening to your command... Speak now!';
      case 'processing':
        return 'Ollama is thinking...';
      case 'speaking':
        return 'Ollama Speaking';
      case 'disabled':
        return 'Voice Interaction Disabled';
      default:
        return 'Off';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm relative overflow-hidden h-72">
      {/* Background glow overlay */}
      <div className={`absolute inset-0 opacity-10 transition-all duration-700 bg-radial ${
        status === 'listening_wake' ? 'from-sky-500 via-transparent' :
        status === 'recording_command' ? 'from-emerald-500 via-transparent' :
        status === 'processing' ? 'from-violet-500 via-transparent' :
        status === 'speaking' ? 'from-pink-500 via-transparent' : 'from-transparent'
      } to-transparent`} />

      {/* Ripple effects for active state */}
      {status === 'listening_wake' && (
        <div className="absolute w-40 h-40 rounded-full border border-sky-500/20 animate-ping opacity-70 pointer-events-none" />
      )}
      {status === 'recording_command' && (
        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30 animate-ping opacity-80 pointer-events-none" />
      )}

      {/* Main visualization container */}
      <div className="relative z-10 flex items-center justify-center mb-6 h-32">
        {status === 'processing' ? (
          <div className="relative flex items-center justify-center">
            {/* Thinking / Spinner visualization */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              className="w-24 h-24 rounded-full border-4 border-violet-500/20 border-t-violet-500 border-r-violet-400"
            />
            <div className="absolute flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
          </div>
        ) : status === 'disabled' || status === 'idle' ? (
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
            status === 'disabled' ? 'border-slate-800 bg-slate-950 text-slate-600' : 'border-slate-700 bg-slate-800 text-slate-300'
          }`}>
            {status === 'disabled' ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </div>
        ) : (
          /* Active Voice Waveform Visualization */
          <div className="flex items-center gap-1 h-20 px-6">
            {bars.map((height, index) => (
              <motion.div
                key={index}
                initial={{ height: 12 }}
                animate={{ height: height }}
                className={`w-1.5 rounded-full ${
                  status === 'listening_wake' ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' :
                  status === 'recording_command' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' :
                  status === 'speaking' ? 'bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.6)]' : 'bg-slate-500'
                }`}
                style={{ transition: 'height 0.12s ease-in-out' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text Status Label */}
      <div className="z-10 text-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border uppercase tracking-wider ${getStatusColor()}`}>
          <span className={`w-2 h-2 rounded-full ${
            status === 'listening_wake' ? 'bg-sky-400 animate-pulse' :
            status === 'recording_command' ? 'bg-emerald-400 animate-ping' :
            status === 'processing' ? 'bg-violet-400 animate-pulse' :
            status === 'speaking' ? 'bg-pink-400 animate-pulse' : 'bg-slate-500'
          }`} />
          {status === 'listening_wake' ? 'STANDBY' : status}
        </span>
        <h3 className="text-white font-medium text-lg mt-3 select-none">
          {getStatusLabel()}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {status === 'listening_wake' && `Say "${wakeWord}" aloud to activate, then state your request.`}
          {status === 'recording_command' && "Speak clearly. The system will process when you stop talking."}
          {status === 'processing' && "Waiting for Ollama's response..."}
          {status === 'speaking' && "Press 'Stop' in the logs below to interrupt speech at any time."}
          {status === 'idle' && "Press 'Start Listening' to begin voice detection."}
          {status === 'disabled' && "Web speech API is disabled or permissions were not granted."}
        </p>
      </div>
    </div>
  );
}
