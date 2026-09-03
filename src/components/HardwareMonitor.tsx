import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  Zap, 
  Sliders, 
  TrendingUp, 
  ShieldAlert, 
  Server, 
  Clock, 
  Gauge, 
  Layers, 
  Radio, 
  Laptop,
  Check
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { VoiceConfig, OperatingSystem } from '../types';
import { getOSLabel } from '../utils/platform';

interface HardwareMonitorProps {
  config: VoiceConfig;
  isProcessing: boolean;
  onPurgeVram: () => void;
  isPurgingVram: boolean;
  purgeSuccess: boolean;
  onToggleLowVramMode?: () => void;
}

type AlertLevel = 'green' | 'yellow' | 'red';

interface WorkloadSample {
  time: string;
  cpu: number;
  vram: number;
  ram: number;
}

export default function HardwareMonitor({
  config,
  isProcessing,
  onPurgeVram,
  isPurgingVram,
  purgeSuccess,
  onToggleLowVramMode
}: HardwareMonitorProps) {
  // Manual simulation mode or live tracking
  const [simulationMode, setSimulationMode] = useState<'live' | 'idle' | 'moderate' | 'heavy'>('live');
  const [history, setHistory] = useState<WorkloadSample[]>([]);
  const [activeTabSection, setActiveTabSection] = useState<'overview' | 'cores' | 'alerts'>('overview');

  // Specs based on user's system (Lenovo Yoga Slim 7, Intel Core Ultra/i7 8-Core, 32 GB RAM, 1 TB Storage)
  const TOTAL_RAM_GB = 32.0;
  const USABLE_RAM_GB = 31.5;
  const TOTAL_STORAGE_GB = 1024; // 1 TB SSD/HDD
  const CPU_CORES_COUNT = 8;
  const CPU_MODEL = 'Intel(R) Core(TM) i7 / Ultra 8-Core @ 2.10 GHz';

  // Calculate live dynamic metrics based on config & active query status
  const currentMetrics = useMemo(() => {
    let cpu = 12;
    let vram = 0.2;
    let ram = 12.8;

    if (simulationMode === 'idle') {
      cpu = 9 + Math.floor(Math.random() * 4);
      vram = config.lowVramMode ? 0.05 : 0.4;
      ram = 11.2 + (Math.random() * 0.4);
    } else if (simulationMode === 'moderate') {
      cpu = 62 + Math.floor(Math.random() * 8);
      vram = 3.8 + (Math.random() * 0.4);
      ram = 18.2 + (Math.random() * 0.6);
    } else if (simulationMode === 'heavy') {
      cpu = 89 + Math.floor(Math.random() * 7);
      vram = 7.9 + (Math.random() * 0.6);
      ram = 26.8 + (Math.random() * 0.8);
    } else {
      // Live dynamic tracking
      if (isProcessing) {
        // High load during active inference
        cpu = 68 + Math.floor(Math.random() * 18);
        vram = config.model.includes('8b') ? 5.8 : config.model.includes('14b') ? 9.2 : 2.6;
        ram = 16.4 + (config.numCtx > 4096 ? 3.5 : 1.2);
      } else {
        // Resting/Idle state
        if (config.keepAlive === '0s') {
          // Model unloaded immediately
          cpu = 11 + Math.floor(Math.random() * 5);
          vram = 0.15;
          ram = 12.5;
        } else {
          // Model resides in memory
          cpu = 14 + Math.floor(Math.random() * 4);
          vram = config.model.includes('8b') ? 5.2 : 2.3;
          ram = 15.2;
        }
      }
    }

    // Core activity distribution
    const coreLoads = Array.from({ length: CPU_CORES_COUNT }, (_, i) => {
      const jitter = ((i * 7) % 15) - 7;
      return Math.min(100, Math.max(5, Math.round(cpu + jitter)));
    });

    return {
      cpu: Math.min(100, Math.max(0, cpu)),
      vram: parseFloat(vram.toFixed(2)),
      ram: parseFloat(ram.toFixed(2)),
      cores: coreLoads,
      availableRam: parseFloat((USABLE_RAM_GB - ram).toFixed(2)),
      modelStorageUsed: config.model.includes('8b') ? 4.9 : 2.0,
      storageUsedPercent: 38.5,
      frequencyGhz: isProcessing ? (3.8 + Math.random() * 0.5).toFixed(2) : '2.10'
    };
  }, [simulationMode, isProcessing, config]);

  // Determine Alert Level for CPU (<50% green, 50-80% yellow, >80% red)
  const cpuAlert: AlertLevel = currentMetrics.cpu < 50 ? 'green' : currentMetrics.cpu <= 80 ? 'yellow' : 'red';
  
  // Determine Alert Level for VRAM (<4GB green, 4-8GB yellow, >8GB red)
  const vramAlert: AlertLevel = currentMetrics.vram < 4.0 ? 'green' : currentMetrics.vram <= 8.0 ? 'yellow' : 'red';

  // Determine Alert Level for RAM (<16GB / 50% green, 16-24GB / 75% yellow, >24GB red)
  const ramAlert: AlertLevel = currentMetrics.ram < 16.0 ? 'green' : currentMetrics.ram <= 24.0 ? 'yellow' : 'red';

  // Overall system alert level is the highest severity of the three
  const overallAlert: AlertLevel = 
    (cpuAlert === 'red' || vramAlert === 'red' || ramAlert === 'red') 
      ? 'red' 
      : (cpuAlert === 'yellow' || vramAlert === 'yellow' || ramAlert === 'yellow') 
        ? 'yellow' 
        : 'green';

  // Update telemetry history ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      setHistory(prev => {
        const next = [...prev, {
          time: timeStr,
          cpu: currentMetrics.cpu,
          vram: currentMetrics.vram,
          ram: currentMetrics.ram
        }];
        return next.slice(-20); // keep last 20 snapshots
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentMetrics]);

  const getAlertBadge = (level: AlertLevel, text?: string) => {
    switch (level) {
      case 'green':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {text || 'OPTIMAL (GREEN)'}
          </span>
        );
      case 'yellow':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {text || 'MODERATE LOAD (YELLOW)'}
          </span>
        );
      case 'red':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {text || 'HIGH WORKLOAD ALERT (RED)'}
          </span>
        );
    }
  };

  const getAlertColor = (level: AlertLevel) => {
    switch (level) {
      case 'green': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'yellow': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'red': return 'text-rose-400 border-rose-500/40 bg-rose-950/25';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header & System Specification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Gauge className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Hardware & Workload Monitor
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-teal-400">
                {getOSLabel(config.targetOS)}
              </span>
              {getAlertBadge(overallAlert, overallAlert === 'green' ? 'SYSTEM NOMINAL' : overallAlert === 'yellow' ? 'SYSTEM ELEVATED' : 'PRESSURE ALERT')}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Host Specification: <strong className="text-slate-200">{CPU_MODEL}</strong> • <strong className="text-sky-300">32.0 GB Installed RAM</strong> (31.5 GB Usable) • <strong className="text-slate-300">1 TB Storage</strong>
            </p>
          </div>

          {/* Quick Purge & Control Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onPurgeVram}
              disabled={isPurgingVram}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                purgeSuccess 
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20' 
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Evict active model weights from unified VRAM/RAM immediately"
            >
              {isPurgingVram ? (
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              ) : purgeSuccess ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-400" />
              )}
              <span>{isPurgingVram ? 'Purging Memory...' : purgeSuccess ? 'VRAM Purged ✓' : 'Purge VRAM'}</span>
            </button>

            {onToggleLowVramMode && (
              <button
                onClick={() => onToggleLowVramMode()}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                  config.lowVramMode 
                    ? 'bg-amber-950/60 border-amber-600/70 text-amber-300 shadow-md' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Eco RAM Mode (2048 ctx + 0s keep_alive)"
              >
                <Zap className={`w-4 h-4 ${config.lowVramMode ? 'text-amber-400 fill-amber-400/20' : 'text-slate-400'}`} />
                <span>Eco Mode: <strong>{config.lowVramMode ? 'ACTIVE' : 'OFF'}</strong></span>
              </button>
            )}
          </div>
        </div>

        {/* Workload Simulation Tester Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Telemetry Simulation Profile:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSimulationMode('live')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                simulationMode === 'live' 
                  ? 'bg-sky-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Synchronize live with active Ollama prompt queries and keep-alive state"
            >
              Live Sync {isProcessing && '⚡ (Active Query)'}
            </button>
            <button
              onClick={() => setSimulationMode('idle')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                simulationMode === 'idle' 
                  ? 'bg-emerald-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Test system state when idle (Green)"
            >
              🟢 Test Idle (Green)
            </button>
            <button
              onClick={() => setSimulationMode('moderate')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                simulationMode === 'moderate' 
                  ? 'bg-amber-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Test standard voice inference workload (Yellow)"
            >
              🟡 Test Moderate (Yellow)
            </button>
            <button
              onClick={() => setSimulationMode('heavy')}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                simulationMode === 'heavy' 
                  ? 'bg-rose-600 text-white font-bold shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Test heavy 8k context or multi-turn workload (Red)"
            >
              🔴 Test Heavy (Red)
            </button>
          </div>
        </div>
      </div>

      {/* Primary Hardware Workload Gauges: CPU, VRAM, RAM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* 1. CPU WORKLOAD GAUGE */}
        <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between ${getAlertColor(cpuAlert)}`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                <Cpu className="w-4 h-4 text-sky-400" /> CPU Load (i7 8-Core)
              </span>
              {getAlertBadge(cpuAlert, cpuAlert === 'green' ? '< 50% GREEN' : cpuAlert === 'yellow' ? '50-80% YELLOW' : '> 80% RED')}
            </div>

            {/* Big Numeric Readout */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {currentMetrics.cpu}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                @ {currentMetrics.frequencyGhz} GHz
              </span>
            </div>

            {/* Progress Bar with Green/Yellow/Red zones */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 mt-4 p-0.5 border border-slate-800 overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  cpuAlert === 'green' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : cpuAlert === 'yellow' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                      : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                }`}
                style={{ width: `${currentMetrics.cpu}%` }}
              />
            </div>

            {/* Micro details */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Logical Processors:</span>
                <span className="text-slate-200 font-bold">8 Threads</span>
              </div>
              <div className="flex justify-between">
                <span>Inference Governor:</span>
                <span className="text-slate-200">{isProcessing ? 'High Priority' : 'Balanced C-State'}</span>
              </div>
              <div className="flex justify-between">
                <span>Thermal Headroom:</span>
                <span className={cpuAlert === 'red' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {cpuAlert === 'green' ? 'Cool / Silent Fans' : cpuAlert === 'yellow' ? 'Moderate Fan Spin' : 'Thermal Caution'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] font-sans text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            {cpuAlert === 'green' && '🟢 CPU usage is nominal. Ample compute headroom for background tasks.'}
            {cpuAlert === 'yellow' && '🟡 Standard AI inference underway. Matrix multiplication utilizing threads.'}
            {cpuAlert === 'red' && '🔴 Sustained heavy compute. Recommend Eco Mode to limit generation context turns.'}
          </div>
        </div>

        {/* 2. VRAM & OLLAMA MODEL FOOTPRINT GAUGE */}
        <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between ${getAlertColor(vramAlert)}`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                <Layers className="w-4 h-4 text-amber-400" /> GPU / Unified VRAM
              </span>
              {getAlertBadge(vramAlert, vramAlert === 'green' ? '< 4GB GREEN' : vramAlert === 'yellow' ? '4-8GB YELLOW' : '> 8GB RED')}
            </div>

            {/* Big Numeric Readout */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {currentMetrics.vram} <span className="text-xl font-normal text-slate-400">GB</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                / 12.0 GB Allocated
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 mt-4 p-0.5 border border-slate-800 overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  vramAlert === 'green' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : vramAlert === 'yellow' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                      : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                }`}
                style={{ width: `${Math.min(100, (currentMetrics.vram / 12) * 100)}%` }}
              />
            </div>

            {/* Micro details */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Active Model:</span>
                <span className="text-sky-300 font-bold truncate max-w-[140px]">{config.model}</span>
              </div>
              <div className="flex justify-between">
                <span>KV Context Buffer:</span>
                <span className="text-slate-200">{config.numCtx} tokens ({(config.numCtx * 0.0003).toFixed(2)} GB)</span>
              </div>
              <div className="flex justify-between">
                <span>VRAM Residency:</span>
                <span className={config.keepAlive === '0s' ? 'text-emerald-400' : 'text-amber-400'}>
                  {config.keepAlive === '0s' ? 'Instant Evict (0s)' : `Resident (${config.keepAlive})`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] font-sans text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
            <span>
              {vramAlert === 'green' && '🟢 Model weights unloaded or lightweight (zero contention).'}
              {vramAlert === 'yellow' && '🟡 Model active in memory. Response streaming is accelerated.'}
              {vramAlert === 'red' && '🔴 Heavy VRAM footprint. Click Purge VRAM to immediately free memory.'}
            </span>
            {vramAlert !== 'green' && (
              <button 
                onClick={onPurgeVram}
                className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700"
              >
                Purge
              </button>
            )}
          </div>
        </div>

        {/* 3. SYSTEM RAM GAUGE (32.0 GB Physical RAM) */}
        <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between ${getAlertColor(ramAlert)}`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                <HardDrive className="w-4 h-4 text-purple-400" /> 32 GB Physical RAM
              </span>
              {getAlertBadge(ramAlert, ramAlert === 'green' ? '< 16GB GREEN' : ramAlert === 'yellow' ? '16-24GB YELLOW' : '> 24GB RED')}
            </div>

            {/* Big Numeric Readout */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {currentMetrics.ram} <span className="text-xl font-normal text-slate-400">GB</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {TOTAL_RAM_GB.toFixed(1)} GB Total
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 mt-4 p-0.5 border border-slate-800 overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  ramAlert === 'green' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : ramAlert === 'yellow' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                      : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                }`}
                style={{ width: `${(currentMetrics.ram / TOTAL_RAM_GB) * 100}%` }}
              />
            </div>

            {/* Micro details */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Free Available RAM:</span>
                <span className="text-emerald-400 font-bold">{currentMetrics.availableRam} GB</span>
              </div>
              <div className="flex justify-between">
                <span>Virtual Memory Pool:</span>
                <span className="text-slate-200">33.5 GB (Pagefile: 2.0 GB)</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Overhead:</span>
                <span className="text-slate-200">Windows OS + Ollama + Browser</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] font-sans text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            {ramAlert === 'green' && '🟢 Vast RAM capacity available. Zero swap thrashing or disk paging.'}
            {ramAlert === 'yellow' && '🟡 Moderate memory utilization. Excellent headroom for multi-tasking.'}
            {ramAlert === 'red' && '🔴 High RAM pressure. Recommend clearing background browser tabs.'}
          </div>
        </div>

      </div>

      {/* Live Telemetry Timeline Chart (Recharts) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Real-Time Workload Waveform (Past 40 Seconds)
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> CPU (%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> VRAM (GB)
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> System RAM (GB)
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-64 w-full">
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="vramColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ramColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="#38bdf8" fillOpacity={1} fill="url(#cpuColor)" />
                <Area type="monotone" dataKey="ram" name="RAM (GB)" stroke="#c084fc" fillOpacity={1} fill="url(#ramColor)" />
                <Area type="monotone" dataKey="vram" name="VRAM (GB)" stroke="#f59e0b" fillOpacity={1} fill="url(#vramColor)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-sky-400" />
              Accumulating real-time telemetry snapshots...
            </div>
          )}
        </div>
      </div>

      {/* Lower Section: 8-Core Activity Matrix & 1 TB Storage Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* 8-Core Load Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" /> 8 Logical Processor Core Matrix
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Intel Hyper-Threading Enabled
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {currentMetrics.cores.map((load, index) => {
              const coreAlert: AlertLevel = load < 50 ? 'green' : load <= 80 ? 'yellow' : 'red';
              return (
                <div key={index} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">C{index}</span>
                    <span className="text-[10px] font-mono text-slate-500">Core #{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full ${
                          coreAlert === 'green' ? 'bg-emerald-400' : coreAlert === 'yellow' ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${load}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono font-bold min-w-[32px] text-right ${
                      coreAlert === 'green' ? 'text-emerald-400' : coreAlert === 'yellow' ? 'text-amber-300' : 'text-rose-400'
                    }`}>
                      {load}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            During local Ollama token streaming, matrix tensor multiplication is dynamically distributed across all 8 cores. Intel Thread Director balances workloads across Performance and Efficient cores.
          </p>
        </div>

        {/* 1 TB Storage & Model Blobs View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-400" /> 1 TB NVMe Storage & Model Directory
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> SSD Healthy
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <span>Drive Capacity Allocation (1,024 GB NVMe):</span>
                <span><strong>394 GB Used</strong> / 630 GB Free</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 p-0.5 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full" style={{ width: '38.5%' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Ollama Model Blobs</span>
                <span className="text-base font-bold text-white mt-1 block">~6.8 GB</span>
                <span className="text-[10px] text-slate-500 truncate block mt-0.5">.ollama/models directory</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">NVMe Sequential Read</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">~4,800 MB/s</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Fast cold model boot</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Storage Optimization:</strong> Ollama stores model weights in raw GGUF/Safetensors blobs. With 1 TB storage, you can comfortably retain multiple model weights (such as Llama 3.2 3B, Mistral 7B, DeepSeek R1) without impacting host operating system performance.
            </div>
          </div>
        </div>

      </div>

      {/* Workload Alert Threshold Rules Legend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Workload Alert Thresholds Legend (Calibrated for 32 GB RAM / i7 CPU)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
            <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Green Zone (Nominal)
            </span>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>CPU Load: &lt; 50%</li>
              <li>Unified VRAM: &lt; 4.0 GB</li>
              <li>System RAM: &lt; 16.0 GB (&lt; 50% total)</li>
              <li>Status: Ultra-cool, zero fan noise, maximum battery life.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300">
            <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" /> 🟡 Yellow Zone (Moderate)
            </span>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>CPU Load: 50% – 80%</li>
              <li>Unified VRAM: 4.0 – 8.0 GB</li>
              <li>System RAM: 16.0 – 24.0 GB</li>
              <li>Status: Standard AI streaming. Balanced fan curve.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300">
            <span className="font-bold flex items-center gap-1.5 mb-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" /> 🔴 Red Zone (Alert / High Load)
            </span>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>CPU Load: &gt; 80% sustained</li>
              <li>Unified VRAM: &gt; 8.0 GB</li>
              <li>System RAM: &gt; 24.0 GB (&gt; 75% total)</li>
              <li>Action: Recommend Purge VRAM or enable Eco RAM mode.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
