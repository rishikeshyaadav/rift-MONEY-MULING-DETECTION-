"use client";

import { useState, useEffect } from 'react';
import { Upload, AlertCircle, Download, ShieldAlert, Activity, Network, Loader2 } from 'lucide-react';
import GraphViz from '@/components/GraphViz';

interface AnalysisResult {
  suspicious_accounts: any[];
  fraud_rings: any[];
  summary: {
    total_accounts_analyzed: number;
    suspicious_accounts_flagged: number;
    fraud_rings_detected: number;
    processing_time_seconds: number;
  };
}

interface EdgeData {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing Neural Graph...");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [edgeData, setEdgeData] = useState<EdgeData[]>([]);

  // Hacker-style loading sequence
  useEffect(() => {
    if (!isLoading) return;
    const steps = [
      "Initializing Neural Graph...",
      "Analyzing Transaction Topology...",
      "Detecting Temporal Smurfing...",
      "Isolating Shell Networks...",
      "Compiling Forensics Report..."
    ];
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % steps.length;
      setLoadingText(steps[step]);
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = async (file: File): Promise<EdgeData[]> => {
    const text = await file.text();
    const lines = text.split('\n');
    const data: EdgeData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',');
      if (values.length < 5) continue;
      data.push({
        transaction_id: values[0].trim(),
        sender_id: values[1].trim(),
        receiver_id: values[2].trim(),
        amount: parseFloat(values[3].trim()),
        timestamp: values[4].trim()
      });
    }
    return data;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setResult(null);
    setEdgeData([]);

    try {
      const edges = await parseCSV(file);
      setEdgeData(edges);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Error: ${res.statusText}`);
      const json = await res.json();
      setResult(json);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Ensure backend is running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_analysis_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-slate-300 font-sans selection:bg-red-500/30 overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 space-y-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 to-orange-400 text-transparent bg-clip-text">
              CEREBRO <span className="text-neutral-600 font-light">| Graph Forensics</span>
            </h1>
            <p className="text-neutral-500 mt-2 font-mono text-sm uppercase tracking-widest">
              Advanced Financial Crime Detection Engine
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-emerald-400">System Active</span>
          </div>
        </header>

        {/* Dropzone & Action Area */}
        {!result && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-neutral-700 rounded-3xl bg-neutral-900/50 backdrop-blur-xl hover:bg-neutral-800/80 hover:border-red-500/50 transition-all duration-300 cursor-pointer shadow-2xl"
              >
                <div className="w-20 h-20 mb-6 bg-neutral-950 rounded-full flex items-center justify-center border border-neutral-800 group-hover:scale-110 group-hover:border-red-500/50 transition-transform duration-300 shadow-xl">
                  <Upload className="w-8 h-8 text-neutral-400 group-hover:text-red-500 transition-colors" />
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{file.name}</p>
                    <p className="text-emerald-500 font-mono text-sm mt-2">Dataset Loaded Ready for Analysis</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xl font-medium text-neutral-300">Drag & Drop Transaction Ledger</p>
                    <p className="text-neutral-500 font-mono text-xs mt-2">Requires: transaction_id, sender_id, receiver_id, amount, timestamp</p>
                  </div>
                )}
              </label>
            </div>

            {/* Action Button */}
            {file && (
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-mono">{loadingText}</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-6 h-6" />
                    Initialize Neural Forensics
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Results Dashboard */}
        {result && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Transactions" value={result.summary.total_accounts_analyzed} icon={<Network className="w-5 h-5 text-neutral-400" />} />
              <StatCard title="Flagged Accounts" value={result.summary.suspicious_accounts_flagged} highlight icon={<ShieldAlert className="w-5 h-5 text-red-500" />} />
              <StatCard title="Fraud Rings Detected" value={result.summary.fraud_rings_detected} highlight icon={<AlertCircle className="w-5 h-5 text-orange-500" />} />
              <StatCard title="Processing Latency" value={`${result.summary.processing_time_seconds}s`} icon={<Activity className="w-5 h-5 text-emerald-500" />} />
            </div>

            {/* Neural Graph Container */}
            <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-red-500" />
                  Network Topology Visualization
                </h3>
                <span className="text-xs font-mono text-neutral-500">Interactive: Zoom / Pan / Drag Nodes</span>
              </div>
              <GraphViz suspicious_accounts={result.suspicious_accounts} edgeData={edgeData} />
            </div>

            {/* Fraud Rings Table */}
            <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Isolated Fraud Rings
                </h3>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                  <Download className="w-4 h-4" />
                  Export JSON Payload
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-neutral-400 font-mono text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-5 font-medium">Ring ID</th>
                      <th className="px-6 py-5 font-medium">Pattern Signature</th>
                      <th className="px-6 py-5 font-medium">Nodes</th>
                      <th className="px-6 py-5 font-medium">Risk Score</th>
                      <th className="px-6 py-5 font-medium">Member Accounts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {result.fraud_rings.map((ring) => (
                      <tr key={ring.ring_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5 font-mono text-white font-bold">{ring.ring_id}</td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-mono border border-red-500/20">
                            {ring.pattern_type}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-neutral-300 font-mono">{ring.member_accounts.length}</td>
                        <td className="px-6 py-5 text-white font-black">{ring.risk_score}</td>
                        <td className="px-6 py-5 font-mono text-xs text-neutral-400 max-w-md truncate">
                          {ring.member_accounts.join(' → ')}
                        </td>
                      </tr>
                    ))}
                    {result.fraud_rings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 font-mono">
                          No distinct fraud rings detected in current dataset topology.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value, highlight = false, icon }: { title: string, value: string | number, highlight?: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-6 rounded-3xl shadow-xl hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(220,38,38,0.1)] transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-neutral-400 font-mono text-xs uppercase tracking-widest">{title}</span>
        <div className="p-2 bg-black/30 rounded-lg border border-neutral-800 group-hover:border-neutral-600 transition-colors">
          {icon}
        </div>
      </div>
      <span className={`text-4xl font-black tracking-tight ${highlight ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}