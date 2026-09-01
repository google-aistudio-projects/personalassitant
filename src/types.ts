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

