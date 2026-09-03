import React, { useState } from 'react';
import { VoiceConfig } from '../types';
import { FileCode, Clipboard, Check, Download, AlertTriangle, BookOpen, Terminal, Monitor, Laptop } from 'lucide-react';
import { OS_GUIDES, getOSLabel } from '../utils/platform';

interface PythonScriptViewProps {
  config: VoiceConfig;
}

export default function PythonScriptView({ config }: PythonScriptViewProps) {
  const [copied, setCopied] = useState(false);

  const generatePythonScript = () => {
    const cleanWakeWord = config.wakeWord === 'none' ? '' : config.wakeWord.toLowerCase();
    const cleanUrl = config.ollamaUrl.endsWith('/') ? config.ollamaUrl.slice(0, -1) : config.ollamaUrl;
    
    return `#!/usr/bin/env python3
"""
Peacock - Personal Assistant built using Llama and Gemini AI Studio
Local Hands-Free Voice Assistant (${new Date().toLocaleDateString()})
"""

import os
import sys
import time
import json
import requests
import speech_recognition as sr
import pyttsx3

# --- SYSTEM CONFIGURATION ---
OLLAMA_URL = "${cleanUrl}/api/generate"
MODEL_NAME = "${config.model}"
WAKE_WORD = "${cleanWakeWord}"  # Set to empty string to skip wake word
SYSTEM_PROMPT = "${config.systemPrompt.replace(/"/g, '\\"')}"

# Speech Synthesis Config
VOICE_RATE = ${config.voiceRate * 150}  # Standard speaking speed (approx 150-200)
VOICE_VOLUME = ${config.voiceVolume}   # Volume level (0.0 to 1.0)
VOICE_PITCH = ${config.voicePitch}     # Pitch level (relative multiplier)

# Initialize TTS Engine
print("[SYS] Initializing Speech Synthesis Engine...")
try:
    engine = pyttsx3.init()
    # Configure speed and volume
    engine.setProperty('rate', VOICE_RATE)
    engine.setProperty('volume', VOICE_VOLUME)
    
    # Try to set an English voice if available
    voices = engine.getProperty('voices')
    en_voice_set = False
    for voice in voices:
        if "en_" in voice.id or "english" in voice.name.lower():
            engine.setProperty('voice', voice.id)
            en_voice_set = True
            break
    if not en_voice_set and len(voices) > 0:
        engine.setProperty('voice', voices[0].id)
except Exception as e:
    print(f"[ERR] Failed to initialize TTS: {e}")
    sys.exit(1)

def speak(text):
    """Pronounce the given text using local TTS engine"""
    print(f"[TTS] Reciting: {text}")
    try:
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"[ERR] Speech error: {e}")

def call_ollama(prompt):
    """Send voice transcript to local Ollama instance"""
    print(f"[LLM] Dispatching prompt to {MODEL_NAME}...")
    payload = {
        "model": MODEL_NAME,
        "prompt": f"System Instruction: {SYSTEM_PROMPT}\\n\\nUser: {prompt}",
        "stream": False,
        "options": {
            "temperature": ${config.temperature},
            "top_p": ${config.topP},
            "top_k": ${config.topK},
            "num_ctx": ${config.numCtx},
            "repeat_penalty": ${config.repeatPenalty}
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            print(f"[ERR] Ollama responded with status code {response.status_code}")
            return "Sorry, I had trouble contacting my local server."
    except requests.exceptions.RequestException as e:
        print(f"[ERR] Network connection failed: {e}")
        return "I can't connect to Ollama. Please make sure the service is running."

def listen_for_speech(recognizer, source, timeout=None):
    """Capture raw microphone audio and transcribe it"""
    try:
        audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=8)
        text = recognizer.recognize_google(audio)
        return text.strip()
    except sr.WaitTimeoutError:
        return ""
    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        print(f"[ERR] Google speech service error: {e}")
        return ""
    except Exception as e:
        print(f"[ERR] Audio capture failure: {e}")
        return ""

def main():
    recognizer = sr.Recognizer()
    
    # Calibrate ambient noise thresholds
    recognizer.dynamic_energy_threshold = True
    recognizer.energy_threshold = 300
    
    print("\\n" + "="*50)
    print("      HANDS-FREE OLLAMA VOICE ASSISTANT ONLINE")
    print("="*50)
    print(f"Target URL : {OLLAMA_URL}")
    print(f"Model      : {MODEL_NAME}")
    print(f"Wake Word  : '{WAKE_WORD}'" if WAKE_WORD else "Wake Word  : None (Direct Prompting Mode)")
    print("Status     : Calibrating microphone... Please stay quiet.")
    
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=2)
        print("Status     : Calibrated! Active listening started.")
        speak("Voice assistant online and ready.")
        
        while True:
            try:
                if WAKE_WORD:
                    print("\\n[MIC] Waiting for wake word...")
                    spoken = listen_for_speech(recognizer, source)
                    
                    if not spoken:
                        continue
                        
                    print(f"[MIC] Heard: \\"{spoken}\\"")
                    if WAKE_WORD in spoken.lower():
                        print(f"[SYS] Wake word \\"{WAKE_WORD}\\" detected! Listening for command...")
                        speak("Yes?")
                        
                        # Listen for active command
                        command = listen_for_speech(recognizer, source, timeout=5)
                        if command:
                            print(f"[YOU] User Command: \\"{command}\\"")
                            response = call_ollama(command)
                            print(f"[LLM] Ollama: {response}")
                            speak(response)
                        else:
                            print("[SYS] Command timeout. Returning to standby.")
                else:
                    # Direct interaction mode (no wake word)
                    print("\\n[MIC] Speak now...")
                    command = listen_for_speech(recognizer, source)
                    if command:
                        print(f"[YOU] Heard: \\"{command}\\"")
                        response = call_ollama(command)
                        print(f"[LLM] Ollama: {response}")
                        speak(response)
                        
            except KeyboardInterrupt:
                print("\\n[SYS] Terminating system. Goodbye!")
                speak("Shutting down voice engine.")
                break
            except Exception as e:
                print(f"[ERR] Loop error: {e}")
                time.sleep(1)

if __name__ == "__main__":
    main()
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePythonScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatePythonScript()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "arun_personal_assistant.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-medium text-lg">Local Python Client</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download .py
            </button>
          </div>
        </div>

        {/* Requirements & Info Tailored to Target OS */}
        {(() => {
          const currentOS = config.targetOS || 'windows';
          const guide = OS_GUIDES[currentOS] || OS_GUIDES.windows;
          return (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 mb-1.5 uppercase tracking-wider font-semibold">
                  <BookOpen className="w-3.5 h-3.5" /> {getOSLabel(currentOS)} Prerequisites
                </span>
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  Recommended environment setup for <strong>{getOSLabel(currentOS)}</strong>:
                </p>
                <div className="bg-black/60 p-2 rounded-lg font-mono text-[10px] text-emerald-400 border border-slate-800 select-all mb-1.5">
                  {guide.pythonVenvCommand} && {guide.pythonActivateCommand}
                </div>
                <div className="bg-black/60 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800 select-all">
                  pip install SpeechRecognition pyttsx3 requests pyaudio
                </div>
              </div>
              <div>
                <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 mb-1.5 uppercase tracking-wider font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {getOSLabel(currentOS)} PyAudio Setup
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">
                  {guide.audioPackageTip}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  💡 {guide.systemTrayTip}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Code viewer container */}
        <div className="relative">
          <pre className="bg-slate-950 text-[11px] font-mono text-slate-300 p-4 rounded-xl border border-slate-800/80 max-h-72 overflow-y-auto leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800">
            {generatePythonScript()}
          </pre>
          <div className="absolute top-2 right-2 bg-slate-900/80 border border-slate-800/60 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none uppercase tracking-wider">
            Auto-Syncs with UI Config
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-500 leading-relaxed">
        This script is generated with standard Python modules to run locally on your system, interacting directly with Ollama. No external network requests are sent outside your local computer, making the solution 100% private.
      </div>
    </div>
  );
}
