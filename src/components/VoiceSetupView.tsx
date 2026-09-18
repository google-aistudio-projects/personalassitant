import React, { useEffect, useState } from 'react';
import { VoiceConfig } from '../types';
import { 
  Volume2, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Radio, 
  Sparkles, 
  ShieldCheck, 
  Headphones, 
  Sliders, 
  MessageSquare,
  Zap,
  VolumeX,
  CheckCircle2
} from 'lucide-react';

interface VoiceSetupViewProps {
  config: VoiceConfig;
  onChange: (newConfig: VoiceConfig) => void;
  isListening?: boolean;
  onToggleListening?: () => void;
}

export default function VoiceSetupView({
  config,
  onChange,
}: VoiceSetupViewProps) {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [testPhrase, setTestPhrase] = useState(
    'Hello! I am your Peacock voice companion running locally on your PC. How can I help you today?'
  );
  const [dictationTestText, setDictationTestText] = useState('');
  const testInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Load available speech synthesis voices from the browser/OS
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        let voices = window.speechSynthesis.getVoices();
        // Prioritize English voices but include all
        const english = voices.filter(v => v.lang.startsWith('en'));
        setBrowserVoices(english.length > 0 ? english : voices);
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

  // Test Speech Synthesis (Voice Audition)
  const handleAuditionVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isAuditioning) {
      window.speechSynthesis.cancel();
      setIsAuditioning(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testPhrase);

    if (config.voiceName && config.voiceName !== 'default') {
      const selected = browserVoices.find(v => v.name === config.voiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.rate = config.voiceRate;
    utterance.pitch = config.voicePitch;
    utterance.volume = config.voiceVolume ?? 1.0;

    utterance.onstart = () => setIsAuditioning(true);
    utterance.onend = () => setIsAuditioning(false);
    utterance.onerror = () => setIsAuditioning(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg tracking-tight">Voice & Audio Synthesis Setup</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Audio Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure speech synthesis narration, wake-word voice triggers, and speech recognition input.
            </p>
          </div>
        </div>

        {/* Live Test Audition Button */}
        <button
          type="button"
          onClick={handleAuditionVoice}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all shadow-md ${
            isAuditioning
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title="Test speech output using current voice, pitch, and speed settings"
        >
          {isAuditioning ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isAuditioning ? 'Stop Speaking' : 'Audition Voice Output'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: Windows Voice Typing (Win + H) Setup & Practice */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-sky-400" /> Windows Voice Typing (Speech-to-Text)
              </h3>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30 text-[10px] font-mono">
                Native OS
              </span>
            </div>

            {/* Quick Shortcut Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/50 via-indigo-950/30 to-slate-950 border border-sky-800/60 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Press Windows Key + H
                </span>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Windows built-in voice-over-text typing provides instant dictation with zero browser latency and automatic punctuation.
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-sky-300 font-mono font-bold text-xs shadow-inner">
                <span>⊞ Win</span>
                <span>+</span>
                <span>H</span>
              </div>
            </div>

            {/* Practice / Test Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1">
                  <span>Dictation Test Pad</span>
                </label>
                {dictationTestText && (
                  <button
                    onClick={() => setDictationTestText('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-mono"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <div className="relative rounded-xl border border-slate-800 focus-within:border-sky-500 bg-slate-950">
                <textarea
                  ref={testInputRef}
                  value={dictationTestText}
                  onChange={(e) => setDictationTestText(e.target.value)}
                  rows={3}
                  placeholder="Click here and press Win + H on your keyboard to test speech-to-text dictation..."
                  className="w-full bg-transparent p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
                />
                <div className="px-3 py-1.5 border-t border-slate-900 bg-slate-950/80 rounded-b-xl flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Click box ➔ Press Win + H ➔ Speak</span>
                  {dictationTestText && <span className="text-emerald-400">✓ Dictation received</span>}
                </div>
              </div>
            </div>

            {/* Why Windows Voice Typing is Better */}
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-sky-400 font-mono font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Zero CPU & RAM Overhead for Transcription</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Windows handles speech recognition at the operating system level, leaving 100% of your Intel i7 CPU cores and RAM dedicated to running Ollama LLM inferences.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatic Punctuation & Capitalization</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Automatically inserts question marks, periods, commas, and capitalizes proper nouns without requiring manual punctuation tags.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-teal-400 font-mono font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Voice Punctuation Commands</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed font-mono">
                  Say "comma", "period", "new line", or "question mark" anytime to format prompts while speaking.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Column 2: Text-to-Speech (TTS) Narrator Voice Settings */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Volume2 className="w-4 h-4 text-emerald-400" /> Speech Synthesis (Read Aloud)
            </h3>

            {/* Voice Profile Selector */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  Narrator Voice Profile
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {browserVoices.length} System Voices
                </span>
              </div>
              <select
                name="voiceName"
                value={config.voiceName}
                onChange={handleTextChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
              >
                <option value="default">Default Windows / Browser System Voice</option>
                {browserVoices.map((voice, idx) => (
                  <option key={idx} value={voice.name}>
                    {voice.name} ({voice.lang}) {voice.default ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate & Pitch Sliders */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Speech Rate</span>
                  <span className="text-emerald-400 font-bold">{config.voiceRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={config.voiceRate}
                  onChange={(e) => handleNumberChange('voiceRate', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Fast)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300">Voice Pitch</span>
                  <span className="text-sky-400 font-bold">{config.voicePitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={config.voicePitch}
                  onChange={(e) => handleNumberChange('voicePitch', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>0.5x (Deep)</span>
                  <span>1.0x (Natural)</span>
                  <span>1.5x (High)</span>
                </div>
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-slate-300">Output Volume</span>
                <span className="text-teal-400 font-bold">{Math.round((config.voiceVolume ?? 1.0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.voiceVolume ?? 1.0}
                onChange={(e) => handleNumberChange('voiceVolume', parseFloat(e.target.value))}
                className="w-full accent-teal-500 bg-slate-950 rounded-lg appearance-none h-2 cursor-pointer"
              />
            </div>

            {/* Custom Audition Phrase Input */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 text-[11px] font-mono mb-1">
                Audition Test Phrase:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPhrase}
                  onChange={(e) => setTestPhrase(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAuditionVoice}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-mono font-semibold border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-emerald-400" />
                  <span>Test</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
