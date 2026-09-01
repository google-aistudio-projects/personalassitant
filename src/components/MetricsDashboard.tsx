import React, { useState } from 'react';
import { MetricsRun, ResponseMetrics } from '../types';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Zap, 
  Clock, 
  Database, 
  Sliders, 
  Compass, 
  Info, 
  ShieldCheck, 
  BookOpen, 
  Flame, 
  Award,
  HelpCircle,
  TrendingUp,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface MetricsDashboardProps {
  runs: MetricsRun[];
  latestMetrics: ResponseMetrics | null;
  currentModel: string;
}

export default function MetricsDashboard({ runs, latestMetrics, currentModel }: MetricsDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'realtime' | 'history' | 'guide'>('realtime');
  const [showParamTip, setShowParamTip] = useState<string | null>(null);

  // Default mock analysis in case there's no latest metrics
  const displayMetrics = latestMetrics || (runs.length > 0 ? {
    promptEvalCount: runs[runs.length - 1].promptTokens,
    evalCount: runs[runs.length - 1].completionTokens,
    promptEvalDurationMs: runs[runs.length - 1].totalDurationMs * 0.15,
    evalDurationMs: runs[runs.length - 1].generationDurationMs,
    loadDurationMs: runs[runs.length - 1].totalDurationMs * 0.05,
    totalDurationMs: runs[runs.length - 1].totalDurationMs,
    tokensPerSecond: runs[runs.length - 1].tokensPerSec
  } : {
    promptEvalCount: 52,
    evalCount: 118,
    promptEvalDurationMs: 120,
    evalDurationMs: 3100,
    loadDurationMs: 50,
    totalDurationMs: 3270,
    tokensPerSecond: 38.0
  });

  const totalTokens = displayMetrics.promptEvalCount + displayMetrics.evalCount;
  const promptPercent = Math.round((displayMetrics.promptEvalCount / (totalTokens || 1)) * 100);
  const completionPercent = Math.round((displayMetrics.evalCount / (totalTokens || 1)) * 100);

  const parameterGuides = [
    {
      name: 'Temperature',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      desc: 'Controls randomness/creativity in response generation.',
      details: 'Lower values (e.g. 0.2) make output deterministic and focused, perfect for code/facts. Higher values (e.g. 0.8) boost creative divergence but can increase hallucinations.'
    },
    {
      name: 'Top-P (Nucleus)',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
      desc: 'Filters tokens according to cumulative probability.',
      details: 'A value of 0.9 means only the pool of tokens representing the top 90% likelihood will be considered. Works closely with Temperature to shape response texture.'
    },
    {
      name: 'Top-K',
      icon: <Sliders className="w-4 h-4 text-sky-400" />,
      desc: 'Limits model consideration to the K highest ranked options.',
      details: 'A lower value (e.g., 40) limits choice vocabulary, making language crisp and tight. Higher K values let models draw from rare word structures.'
    },
    {
      name: 'Context Length (num_ctx)',
      icon: <Database className="w-4 h-4 text-indigo-400" />,
      desc: 'Specifies the maximum token window capacity.',
      details: 'Configuring this (e.g. 2048 vs 8192) limits how far back the assistant remembers previous prompts. High context uses more local host RAM/VRAM.'
    },
    {
      name: 'Repeat Penalty',
      icon: <RefreshCw className="w-4 h-4 text-pink-400" />,
      desc: 'Deters repetitive text sequences.',
      details: 'A higher penalty (e.g. 1.2) discourages model loops or re-asserting the exact same phrases consecutively.'
    }
  ];

  // Prompt Engineering advice based on the active run or user prompt
  const analyzePromptStructure = (text: string) => {
    const hasSystem = text.toLowerCase().includes('system') || text.toLowerCase().includes('instruction');
    const isLong = text.split(/\s+/).length > 20;
    const hasFormat = text.toLowerCase().includes('format') || text.toLowerCase().includes('list') || text.toLowerCase().includes('json');
    const hasFewShot = text.toLowerCase().includes('example') || text.toLowerCase().includes('e.g.');

    return {
      hasSystem,
      isLong,
      hasFormat,
      hasFewShot,
      score: (hasSystem ? 25 : 0) + (isLong ? 25 : 0) + (hasFormat ? 25 : 0) + (hasFewShot ? 25 : 0)
    };
  };

  const currentPromptText = runs.length > 0 ? runs[runs.length - 1].prompt : "";
  const advice = analyzePromptStructure(currentPromptText || "Write standard request here...");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        {/* Header Tabs */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-medium text-lg">LLM Learning Workbench</h2>
          </div>
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono select-none">
            <button
              onClick={() => setActiveSubTab('realtime')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeSubTab === 'realtime' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Latest Run
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeSubTab === 'history' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Session Stats
            </button>
            <button
              onClick={() => setActiveSubTab('guide')}
              className={`px-2.5 py-1 rounded-md transition-all ${activeSubTab === 'guide' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Prompt Guide
            </button>
          </div>
        </div>

        {/* SECURE LOCAL NOTICE */}
        <div className="mb-4 bg-emerald-950/20 border border-emerald-800/30 px-3 py-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span><strong>100% Privacy Commitment:</strong> No cloud data leakage or internet logs.</span>
          </div>
          <span className="text-[10px] text-emerald-500/80 uppercase font-mono font-bold tracking-wider">OFFLINE MODE READY</span>
        </div>

        {/* TAB 1: Real-time Performance Metrics */}
        {activeSubTab === 'realtime' && (
          <div className="space-y-4">
            {/* Top Speed & Total Latency Metrics Panel */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 relative overflow-hidden group">
                <div className="absolute right-2 top-2 bg-emerald-500/10 text-emerald-400 p-1 rounded">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Generation Speed</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                  {displayMetrics.tokensPerSecond.toFixed(1)} <span className="text-xs font-normal text-slate-500">t/s</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Tokens per second speed</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute right-2 top-2 bg-sky-500/10 text-sky-400 p-1 rounded">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Latency</span>
                <span className="text-2xl font-bold font-mono text-sky-400 block mt-1">
                  {(displayMetrics.totalDurationMs / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">s</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Full execution loop time</span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 relative overflow-hidden col-span-2 md:col-span-1">
                <div className="absolute right-2 top-2 bg-indigo-500/10 text-indigo-400 p-1 rounded">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Total Vocabulary</span>
                <span className="text-2xl font-bold font-mono text-indigo-400 block mt-1">
                  {totalTokens} <span className="text-xs font-normal text-slate-500">tok</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {displayMetrics.promptEvalCount} in / {displayMetrics.evalCount} out
                </span>
              </div>
            </div>

            {/* Token Distribution Bar graph visualizer */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400 uppercase">Token Context Allocation</span>
                <span className="text-xs font-mono text-slate-500">
                  {promptPercent}% Prompt vs {completionPercent}% Response
                </span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full hover:opacity-90 transition-opacity" style={{ width: `${promptPercent}%` }} title={`Prompt Tokens: ${displayMetrics.promptEvalCount}`} />
                <div className="bg-emerald-400 h-full hover:opacity-90 transition-opacity" style={{ width: `${completionPercent}%` }} title={`Completion Tokens: ${displayMetrics.evalCount}`} />
              </div>
              <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-indigo-500" /> Prompt: {displayMetrics.promptEvalCount} tokens
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-400" /> Completion: {displayMetrics.evalCount} tokens
                </span>
              </div>
            </div>

            {/* Performance Timeline breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
              <span className="text-xs font-mono text-slate-400 uppercase block">Generation Phase Timeline</span>
              
              <div className="space-y-2 text-xs font-mono">
                {/* Load duration */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                    <span>Model Boot / Load time</span>
                    <span className="text-slate-300">{displayMetrics.loadDurationMs.toFixed(0)} ms</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, (displayMetrics.loadDurationMs / (displayMetrics.totalDurationMs || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* Prompt Evaluation */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                    <span>Prompt Evaluation (Prefill)</span>
                    <span className="text-slate-300">{displayMetrics.promptEvalDurationMs.toFixed(0)} ms</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (displayMetrics.promptEvalDurationMs / (displayMetrics.totalDurationMs || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* Completion Generation */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                    <span>Token Generation (Decode)</span>
                    <span className="text-slate-300">{displayMetrics.evalDurationMs.toFixed(0)} ms</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (displayMetrics.evalDurationMs / (displayMetrics.totalDurationMs || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time prompt guidance insights based on latest query */}
            {currentPromptText && (
              <div className="bg-indigo-950/20 border border-indigo-800/40 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-indigo-300 font-semibold text-xs">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Interactive Prompting Insights</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1.5">
                  <p>Your prompt received a structural composition score of <strong className="text-emerald-400">{advice.score}/100</strong>.</p>
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-400">
                    {advice.hasSystem ? (
                      <li className="text-slate-300">✓ Robust: Implements a specific target System Instruction.</li>
                    ) : (
                      <li>💡 Try declaring explicit target constraints or behavior rules using a <strong>System Prompt</strong>.</li>
                    )}
                    {advice.hasFormat ? (
                      <li className="text-slate-300">✓ Format-safe: Specifically instructs the LLM on how to output responses.</li>
                    ) : (
                      <li>💡 Improve output reliability by specifying a desired output schema (e.g. "Response format: short JSON" or "Limit responses to 2 short sentences").</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Historical metrics over the session runs */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            {runs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                <p>No query performance records saved yet.</p>
                <p className="text-[10px] text-slate-600 mt-2">Submit a voice query or type in the terminal log to generate analytics charts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generation speed comparison chart over time */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs font-mono text-slate-400 uppercase mb-3 block">Token Generation Velocity (Tokens/Sec)</span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={runs}>
                        <defs>
                          <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} label={{ value: 't/s', angle: -90, position: 'insideLeft', fill: '#64748b', style: { fontSize: 9 } }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <Area type="monotone" dataKey="tokensPerSec" stroke="#10b981" fillOpacity={1} fill="url(#colorSpeed)" name="Speed (t/s)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Token sizes comparison stacked chart */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-xs font-mono text-slate-400 uppercase mb-3 block">Prompt vs Completion Token Load</span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={runs}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', fontFamily: 'monospace' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="promptTokens" stackId="a" fill="#6366f1" name="Input Tokens" />
                        <Bar dataKey="completionTokens" stackId="a" fill="#10b981" name="Output Tokens" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Prompt Engineering Parameters Guide */}
        {activeSubTab === 'guide' && (
          <div className="space-y-3.5">
            <span className="text-xs font-mono text-slate-400 uppercase block mb-1">Prompt Parameters Dictionary</span>
            
            <div className="space-y-2.5">
              {parameterGuides.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition-colors cursor-pointer"
                  onClick={() => setShowParamTip(showParamTip === item.name ? null : item.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-xs text-white font-semibold font-mono">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {showParamTip === item.name ? 'Hide' : 'Learn more'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    {item.desc}
                  </p>
                  
                  {showParamTip === item.name && (
                    <div className="mt-2.5 pt-2 border-t border-slate-900 text-[11px] text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded">
                      {item.details}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick recipe list */}
            <div className="bg-indigo-950/20 border border-indigo-900/40 p-3.5 rounded-xl">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Prompt Parameter Quick Recipes
              </span>
              <ul className="text-[11px] text-slate-400 space-y-2">
                <li>🎯 <strong className="text-white">Strict Logic / Code / Math:</strong> Temperature: <code className="text-indigo-300 bg-indigo-950/60 px-1 rounded font-mono">0.1 - 0.2</code>, Top-P: <code className="text-indigo-300 bg-indigo-950/60 px-1 rounded font-mono">0.8</code>. Prevents off-topic answers and maintains consistent structure.</li>
                <li>🎨 <strong className="text-white">Immersive / Brainstorming:</strong> Temperature: <code className="text-indigo-300 bg-indigo-950/60 px-1 rounded font-mono">0.8 - 0.9</code>, Top-P: <code className="text-indigo-300 bg-indigo-950/60 px-1 rounded font-mono">0.95</code>. Allows rich divergent paths and colorful words.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 mt-6 text-[11px] text-slate-500 leading-relaxed font-mono flex items-center justify-between">
        <span>Active Learning Model: <strong className="text-indigo-400">{currentModel}</strong></span>
        <span className="text-[10px] text-emerald-500 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/30 font-bold uppercase">Ready</span>
      </div>
    </div>
  );
}
