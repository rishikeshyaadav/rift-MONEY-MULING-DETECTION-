"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Upload, AlertTriangle, Download, Shield, Activity,
  Users, Clock, ChevronDown, X, Zap, Eye, Search,
  BarChart3, Fingerprint, Network, Terminal, Cpu, Database,
  Wifi, Lock, Layers
} from 'lucide-react';
import GraphViz from '@/components/GraphViz';

/* ─── Types ─── */
interface AnalysisResult {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  summary: {
    total_accounts_analyzed: number;
    suspicious_accounts_flagged: number;
    fraud_rings_detected: number;
    processing_time_seconds: number;
  };
}

interface SuspiciousAccount {
  account_id: string;
  suspicion_score: number;
  detected_patterns: string[];
  ring_id?: string;
}

interface FraudRing {
  ring_id: string;
  member_accounts: string[];
  pattern_type: string;
  risk_score: number;
}

interface EdgeData {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const startTime = performance.now();
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ─── Deep Processing Steps (Hacker Terminal Simulation) ─── */
const TERMINAL_STEPS = [
  { prefix: "INIT", command: "Bootstrapping CEREBRO engine v4.2.1...", icon: Terminal, type: "command" as const },
  { prefix: "LOAD", command: "Parsing CSV dataframe into memory buffer", icon: Database, type: "command" as const },
  { prefix: "GRAPH", command: "Building directed multi-edge graph topology", icon: Network, type: "command" as const },
  { prefix: "AUTH", command: "Validating transaction signature integrity", icon: Lock, type: "status" as const },
  { prefix: "SCAN", command: "Detecting bounded cycles (length ≤ 5)...", icon: Fingerprint, type: "command" as const },
  { prefix: "SCAN", command: "Running temporal smurfing analysis (72h window)", icon: Cpu, type: "warning" as const },
  { prefix: "SCAN", command: "Identifying shell pass-through intermediaries", icon: Eye, type: "command" as const },
  { prefix: "RISK", command: "Computing velocity scores & multipliers", icon: BarChart3, type: "command" as const },
  { prefix: "NET", command: "Isolating fraud ring subgraphs", icon: Wifi, type: "warning" as const },
  { prefix: "DONE", command: "Aggregating final risk assessments", icon: Layers, type: "status" as const },
  { prefix: "OUT", command: "Generating forensic intelligence report", icon: Zap, type: "status" as const },
];

/* ─── Progress Steps (for the progress bar) ─── */
const ANALYSIS_STEPS = [
  { label: "Parsing CSV data...", icon: Search },
  { label: "Building directed graph...", icon: Network },
  { label: "Detecting bounded cycles...", icon: Fingerprint },
  { label: "Analyzing smurfing patterns...", icon: Users },
  { label: "Identifying shell pass-throughs...", icon: Eye },
  { label: "Computing risk scores...", icon: BarChart3 },
  { label: "Generating report...", icon: Zap },
];

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [edgeData, setEdgeData] = useState<EdgeData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [terminalStep, setTerminalStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'graph' | 'table' | 'accounts'>('graph');
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedRing, setExpandedRing] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  /* ─── File Parsing ─── */
  const parseCSV = async (f: File): Promise<EdgeData[]> => {
    const text = await f.text();
    const lines = text.split('\n');
    const data: EdgeData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const v = line.split(',');
      if (v.length < 5) continue;
      data.push({
        transaction_id: v[0].trim(),
        sender_id: v[1].trim(),
        receiver_id: v[2].trim(),
        amount: parseFloat(v[3].trim()),
        timestamp: v[4].trim(),
      });
    }
    return data;
  };

  /* ─── Drag & Drop ─── */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.endsWith('.csv')) setFile(f);
    }
  }, []);

  /* ─── Analysis ─── */
  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setResult(null);
    setEdgeData([]);
    setCurrentStep(0);
    setTerminalStep(0);
    setElapsedTime(0);

    try {
      // Terminal step progression (fast hacker terminal feel)
      const termInterval = setInterval(() => {
        setTerminalStep(prev => {
          if (prev < TERMINAL_STEPS.length - 1) return prev + 1;
          clearInterval(termInterval);
          return prev;
        });
      }, 320);

      // Progress step progression
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
          clearInterval(stepInterval);
          return prev;
        });
      }, 500);

      // Elapsed timer
      const timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);

      const edges = await parseCSV(file);
      setEdgeData(edges);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);
      clearInterval(termInterval);
      clearInterval(timerInterval);

      if (!res.ok) throw new Error(`Server error: ${res.statusText}`);

      const json = await res.json();
      setResult(json);
      setCurrentStep(ANALYSIS_STEPS.length);
      setTerminalStep(TERMINAL_STEPS.length);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (error: any) {
      console.error(error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Export ─── */
  const handleExport = (format: 'json' | 'csv') => {
    if (!result) return;
    setShowExportMenu(false);

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'fraud_analysis_report.json');
    } else {
      const rows = ['account_id,suspicion_score,detected_patterns,ring_id'];
      result.suspicious_accounts.forEach(acc => {
        rows.push(`${acc.account_id},${acc.suspicion_score},"${acc.detected_patterns.join(';')}",${acc.ring_id || ''}`);
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      downloadBlob(blob, 'suspicious_accounts.csv');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Reset ─── */
  const handleReset = () => {
    setFile(null);
    setResult(null);
    setEdgeData([]);
    setCurrentStep(0);
    setTerminalStep(0);
    setActiveTab('graph');
    setSearchFilter('');
    setElapsedTime(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ─── Filtered data ─── */
  const filteredRings = result?.fraud_rings.filter(r =>
    r.ring_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.member_accounts.some(a => a.toLowerCase().includes(searchFilter.toLowerCase()))
  ) || [];

  const filteredAccounts = result?.suspicious_accounts.filter(a =>
    a.account_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.detected_patterns.some(p => p.toLowerCase().includes(searchFilter.toLowerCase()))
  ) || [];

  return (
    <>
      {/* Background effects */}
      <div className="bg-mesh" />
      <div className="noise-overlay" />

      <main className="relative z-10 min-h-screen p-6 md:p-10 font-sans">
        <div className="max-w-[1400px] mx-auto space-y-8">

          {/* ═══ HEADER ═══ */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <Shield className="w-8 h-8 text-red-500" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  <span className="gradient-text">CEREBRO</span>
                  <span className="text-gray-600 font-light ml-2">|</span>
                  <span className="text-gray-400 font-light ml-2 text-lg md:text-xl">Graph Forensics</span>
                </h1>
              </div>
              <p className="text-gray-500 text-sm ml-11">
                Advanced Financial Crime Detection · Real-time Network Analysis
              </p>
            </div>

            <div className="flex items-center gap-3">
              {result && (
                <button
                  onClick={handleReset}
                  className="glass glass-hover rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-all"
                >
                  <X className="w-4 h-4" />
                  New Analysis
                </button>
              )}
              <div className="glass rounded-lg px-4 py-2.5 flex items-center gap-2.5 badge-online">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">Engine Online</span>
              </div>
            </div>
          </header>

          {/* ═══ UPLOAD SECTION ═══ */}
          {!result && (
            <div
              className={`glass rounded-2xl p-10 text-center transition-all duration-500 group cursor-pointer animate-fade-in-up ${isDragging ? 'dropzone-active' : 'hover:border-red-500/20'
                } ${file ? 'animate-border-glow' : ''}`}
              style={{ animationDelay: '0.1s' }}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                className="hidden"
                id="csv-upload"
              />

              {!file ? (
                <div className="flex flex-col items-center gap-5">
                  <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-red-500/20 scale-110' : 'bg-gray-800/50 group-hover:bg-red-500/10'
                    }`}>
                    <Upload className={`w-9 h-9 transition-all duration-300 ${isDragging ? 'text-red-400 animate-float' : 'text-gray-500 group-hover:text-red-400'
                      }`} />
                    {isDragging && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50 animate-pulse-ring" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {isDragging ? 'Release to Upload' : 'Drop Transaction CSV'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1.5">
                      or click to browse · Required:
                      <code className="ml-1 px-1.5 py-0.5 bg-gray-800 rounded text-[11px] text-gray-400">
                        transaction_id, sender_id, receiver_id, amount, timestamp
                      </code>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Activity className="w-9 h-9 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white flex items-center gap-2 justify-center">
                      {file.name}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="w-5 h-5 rounded-full bg-gray-800 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB · Ready for analysis
                    </p>
                  </div>

                  {/* ─── Premium Analysis Button ─── */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                    disabled={isLoading}
                    className="btn-analyze mt-2 px-10 py-3.5 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 text-sm uppercase tracking-wider"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Run Forensics Analysis
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══ DEEP PROCESSING TERMINAL ═══ */}
          {isLoading && (
            <div className="space-y-4 animate-fade-in-scale">
              {/* Terminal Header */}
              <div className="terminal-container rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">cerebro://forensics-engine</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-gray-600 font-mono">
                      {elapsedTime.toFixed(1)}s elapsed
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-red-400 font-mono uppercase tracking-widest">LIVE</span>
                    </div>
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="px-5 py-4 space-y-1 max-h-[320px] overflow-y-auto">
                  {TERMINAL_STEPS.slice(0, terminalStep + 1).map((step, i) => {
                    const isDone = i < terminalStep;
                    const isActive = i === terminalStep;
                    return (
                      <div
                        key={i}
                        className={`terminal-line flex items-center gap-2 transition-opacity duration-300 ${isDone ? 'opacity-50' : 'opacity-100'}`}
                      >
                        <span className="text-gray-700 select-none">❯</span>
                        <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${step.type === 'status' ? 'text-green-400 bg-green-500/10' :
                            step.type === 'warning' ? 'text-amber-400 bg-amber-500/10' :
                              'text-red-400 bg-red-500/10'
                          }`}>
                          {step.prefix}
                        </span>
                        <span className={`${step.type === 'status' ? 'text-green-300/80' :
                            step.type === 'warning' ? 'text-amber-300/80' :
                              'text-cyan-300/80'
                          }`}>
                          {step.command}
                        </span>
                        {isDone && <span className="text-green-500 text-xs ml-auto">✓ done</span>}
                        {isActive && <span className="terminal-cursor ml-1" />}
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
                      Analysis Progress
                    </span>
                    <span className="text-[10px] text-red-400 font-mono font-bold">
                      {Math.min(Math.round(((currentStep + 1) / ANALYSIS_STEPS.length) * 100), 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
                    <div
                      className="progress-bar h-full rounded-full"
                      style={{ width: `${((currentStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Step Grid Below Terminal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ANALYSIS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i === currentStep;
                  const isDone = i < currentStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-500 glass ${isActive ? 'border-red-500/20 !bg-red-500/5' :
                          isDone ? 'opacity-40' : 'opacity-20'
                        }`}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-red-400 animate-pulse' :
                          isDone ? 'text-green-400' : 'text-gray-600'
                        }`} />
                      <span className={`text-[11px] truncate ${isActive ? 'text-white font-medium' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                      {isDone && <span className="ml-auto text-green-400 text-[10px]">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ RESULTS ═══ */}
          {result && (
            <div ref={resultsRef} className="space-y-6">

              {/* ─── Summary Stats ─── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                <StatCard
                  icon={Users}
                  label="Total Accounts"
                  value={result.summary.total_accounts_analyzed}
                  color="cyan"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Flagged Accounts"
                  value={result.summary.suspicious_accounts_flagged}
                  color="red"
                />
                <StatCard
                  icon={Fingerprint}
                  label="Fraud Rings"
                  value={result.summary.fraud_rings_detected}
                  color="orange"
                />
                <StatCard
                  icon={Clock}
                  label="Processing Time"
                  value={result.summary.processing_time_seconds}
                  suffix="s"
                  color="green"
                  decimals={4}
                />
              </div>

              {/* ─── Tab Navigation ─── */}
              <div className="flex items-center gap-1 glass-strong rounded-xl p-1.5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {([
                  { id: 'graph' as const, label: 'Network Graph', icon: Network },
                  { id: 'table' as const, label: 'Fraud Rings', icon: Fingerprint },
                  { id: 'accounts' as const, label: 'Suspicious Accounts', icon: AlertTriangle },
                ]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                      ? 'tab-active text-red-400'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'table' && result.fraud_rings.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold">
                        {result.fraud_rings.length}
                      </span>
                    )}
                    {tab.id === 'accounts' && result.suspicious_accounts.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold">
                        {result.suspicious_accounts.length}
                      </span>
                    )}
                  </button>
                ))}

                {/* Search + Export on the right */}
                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="bg-transparent border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/30 w-36 transition-all focus:w-48"
                    />
                  </div>

                  {/* Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg text-sm text-white transition-all border border-gray-700/50 hover:border-gray-600"
                    >
                      <Download className="w-4 h-4" />
                      Export
                      <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-2 glass-strong rounded-lg overflow-hidden z-50 min-w-[160px] animate-fade-in-scale shadow-2xl" style={{ animationDuration: '0.15s' }}>
                        <button
                          onClick={() => handleExport('json')}
                          className="w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] text-left transition-colors"
                        >
                          📄 Export JSON
                        </button>
                        <button
                          onClick={() => handleExport('csv')}
                          className="w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] text-left transition-colors border-t border-gray-800"
                        >
                          📊 Export CSV
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Tab Content ─── */}

              {/* GRAPH TAB */}
              {activeTab === 'graph' && (
                <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in-scale scanline" style={{ animationDelay: '0.1s' }}>
                  <div className="p-4 border-b border-gray-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-500" />
                      Transaction Network Topology
                    </h3>
                    <span className="text-xs text-gray-600">Click a node to inspect · Scroll to zoom · Drag to pan</span>
                  </div>
                  <GraphViz suspicious_accounts={result.suspicious_accounts} edgeData={edgeData} />
                </div>
              )}

              {/* FRAUD RINGS TAB */}
              {activeTab === 'table' && (
                <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in-scale">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-800/50">
                          <th className="px-6 py-4 text-xs uppercase tracking-wider font-medium text-gray-500">Ring ID</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-wider font-medium text-gray-500">Pattern</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-wider font-medium text-gray-500">Member Count</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-wider font-medium text-gray-500">Risk Score</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-wider font-medium text-gray-500">Members</th>
                          <th className="px-6 py-4 text-xs uppercase tracking-wider font-medium text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody className="stagger-children">
                        {filteredRings.map((ring) => (
                          <tr
                            key={ring.ring_id}
                            className="table-row-hover border-b border-gray-800/30 cursor-pointer"
                            onClick={() => setExpandedRing(expandedRing === ring.ring_id ? null : ring.ring_id)}
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-white font-bold text-xs bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                                {ring.ring_id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-400 text-xs border border-red-500/15 font-medium">
                                {ring.pattern_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white font-bold">{ring.member_accounts.length}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                                    style={{ width: `${ring.risk_score}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold text-sm">{ring.risk_score}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 flex-wrap">
                                {ring.member_accounts.slice(0, 3).map(acc => (
                                  <span key={acc} className="font-mono text-[11px] px-2 py-0.5 bg-gray-800/60 text-gray-300 rounded-md">
                                    {acc}
                                  </span>
                                ))}
                                {ring.member_accounts.length > 3 && (
                                  <span className="text-gray-500 text-xs">+{ring.member_accounts.length - 3} more</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${expandedRing === ring.ring_id ? 'rotate-180' : ''
                                }`} />
                            </td>
                          </tr>
                        ))}
                        {filteredRings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-2 text-gray-600">
                                <Shield className="w-8 h-8" />
                                <span className="text-sm">No fraud rings match your filter</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUSPICIOUS ACCOUNTS TAB */}
              {activeTab === 'accounts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {filteredAccounts.map((acc) => (
                    <AccountCard key={acc.account_id} account={acc} />
                  ))}
                  {filteredAccounts.length === 0 && (
                    <div className="col-span-full glass rounded-2xl p-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <Shield className="w-8 h-8" />
                        <span className="text-sm">No accounts match your filter</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   STAT CARD COMPONENT (Premium with Glassmorphism)
   ═══════════════════════════════════════════════════════ */
function StatCard({
  icon: Icon, label, value, color, suffix = '', decimals = 0
}: {
  icon: any; label: string; value: number; color: 'red' | 'cyan' | 'orange' | 'green';
  suffix?: string; decimals?: number;
}) {
  const animatedValue = useAnimatedCounter(
    decimals > 0 ? Math.floor(value) : value,
    800
  );
  const displayValue = decimals > 0 ? value.toFixed(decimals) : animatedValue;

  const colorMap = {
    red: {
      icon: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/10',
      glow: 'bg-red-500/5',
      accent: 'from-red-500/20 to-transparent',
    },
    cyan: {
      icon: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/10',
      glow: 'bg-cyan-500/5',
      accent: 'from-cyan-500/20 to-transparent',
    },
    orange: {
      icon: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/10',
      glow: 'bg-orange-500/5',
      accent: 'from-orange-500/20 to-transparent',
    },
    green: {
      icon: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/10',
      glow: 'bg-green-500/5',
      accent: 'from-green-500/20 to-transparent',
    },
  };
  const c = colorMap[color];

  return (
    <div className={`stat-card stat-card-${color} glass-strong rounded-xl p-5 flex flex-col gap-3 ${c.border}`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${c.accent}`} />
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center backdrop-blur-sm`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
      </div>
      <div className="animate-count-up">
        <span className="text-3xl font-black text-white tracking-tight">
          {displayValue}{suffix}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACCOUNT CARD COMPONENT (Premium with micro-interactions)
   ═══════════════════════════════════════════════════════ */
function AccountCard({ account }: { account: SuspiciousAccount }) {
  const riskLevel = account.suspicion_score >= 80 ? 'CRITICAL' : account.suspicion_score >= 50 ? 'HIGH' : 'MEDIUM';
  const riskColor = account.suspicion_score >= 80 ? 'text-red-400 bg-red-500/10 border-red-500/20' : account.suspicion_score >= 50 ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

  return (
    <div className="account-card glass-strong rounded-xl p-5 flex flex-col gap-4 group">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <span className="font-mono text-white font-bold text-sm">{account.account_id}</span>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${riskColor}`}>
          {riskLevel}
        </span>
      </div>

      {/* Score */}
      <div>
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
          <span>Risk Score</span>
          <span className="text-white font-bold text-sm">{account.suspicion_score}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-1000 ease-out"
            style={{ width: `${account.suspicion_score}%` }}
          />
        </div>
      </div>

      {/* Patterns */}
      <div className="flex flex-wrap gap-1.5">
        {account.detected_patterns.map(p => (
          <span key={p} className="px-2 py-1 text-[10px] bg-red-500/10 text-red-400 rounded-md border border-red-500/15 font-medium">
            {p.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Ring ID */}
      {account.ring_id && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800/50">
          <Fingerprint className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">Ring:</span>
          <span className="font-mono text-xs text-cyan-400">{account.ring_id}</span>
        </div>
      )}
    </div>
  );
}
