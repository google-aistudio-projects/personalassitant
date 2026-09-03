export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;
}

export type OperatingSystem = 'macos' | 'windows' | 'linux' | 'unknown';

export interface VoiceConfig {
  ollamaUrl: string;
  model: string;
  wakeWord: string;
  systemPrompt: string;
  voiceName: string;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  continuousListening: boolean;
  // Sessional Context & Memory Control (Cross-Platform / Low-RAM optimizations)
  enableSessionContext: boolean;
  maxContextTurns: number;
  keepAlive: string; // '0s' (unload immediately), '1m', '5m', '10m', '-1' (indefinite)
  lowVramMode: boolean; // Eco / Low-RAM mode (fits low VRAM laptops on Windows, Mac, Linux)
  targetOS: OperatingSystem;
  // Finer LLM parameters
  temperature: number;
  topP: number;
  topK: number;
  numCtx: number;
  repeatPenalty: number;
}

export interface ResponseMetrics {
  promptEvalCount: number;
  evalCount: number;
  promptEvalDurationMs: number;
  evalDurationMs: number;
  loadDurationMs: number;
  totalDurationMs: number;
  tokensPerSecond: number;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'system' | 'listening' | 'user' | 'assistant' | 'error';
  message: string;
  metrics?: ResponseMetrics;
}

export interface MetricsRun {
  id: string;
  timestamp: string;
  model: string;
  prompt: string;
  response: string;
  temperature: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalDurationMs: number;
  generationDurationMs: number;
  tokensPerSec: number;
}

export interface OllamaModel {
  name: string;
  size?: number;
  format?: string;
  family?: string;
}

