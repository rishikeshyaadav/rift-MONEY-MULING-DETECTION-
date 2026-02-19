"use client";

import { useState } from 'react';
import { Upload, AlertCircle, FileText, Download } from 'lucide-react';
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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [edgeData, setEdgeData] = useState<EdgeData[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = async (file: File): Promise<EdgeData[]> => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());

    // Check headers
    // Expected: transaction_id, sender_id, receiver_id, amount, timestamp

    const data: EdgeData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',');
      if (values.length < 5) continue; // Basic validation

      // Simple mapping assuming order or finding index
      // Using index for speed based on prompt spec order
      // Order: transaction_id, sender_id, receiver_id, amount, timestamp
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
      // 1. Parse CSV for frontend graph
      const edges = await parseCSV(file);
      setEdgeData(edges);

      // 2. Send to Backend
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. See console.");
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
    <main className="min-h-screen bg-black text-gray-100 p-8 font-sans selection:bg-red-900 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              CEREBRO <span className="text-gray-500 font-light">| Graph Forensics</span>
            </h1>
            <p className="text-gray-400 mt-2">Advanced Financial Crime Detection Prototype</p>
          </div>
          <div className="px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-gray-400">System Active</span>
          </div>
        </header>

        {/* Upload Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center transition-all hover:border-red-500/30 group">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-red-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">
                {file ? file.name : "Drop Transaction CSV"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Required columns: transaction_id, sender_id, receiver_id, amount, timestamp
              </p>
            </div>
          </label>

          {file && (
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isLoading ? 'Processing Neural Graph...' : 'Run Forensics Analysis'}
            </button>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Total Accounts" value={result.summary.total_accounts_analyzed} />
              <StatCard label="Flagged Accounts" value={result.summary.suspicious_accounts_flagged} highlight />
              <StatCard label="Fraud Rings" value={result.summary.fraud_rings_detected} highlight />
              <StatCard label="Processing Time" value={`${result.summary.processing_time_seconds}s`} />
            </div>

            {/* Graph Visualization */}
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-semibold text-gray-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Network Topology
                </h3>
                <div className="text-xs text-gray-500">
                  Interactive: Zoom/Pan/Drag
                </div>
              </div>
              <GraphViz suspicious_accounts={result.suspicious_accounts} edgeData={edgeData} />
            </div>

            {/* Fraud Rings Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Detected Fraud Rings</h3>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Report (JSON)
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-800/50 uppercase tracking-wider text-xs font-medium text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Ring ID</th>
                      <th className="px-6 py-4">Pattern Type</th>
                      <th className="px-6 py-4">Risk Score</th>
                      <th className="px-6 py-4">Member Accounts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {result.fraud_rings.map((ring) => (
                      <tr key={ring.ring_id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-white">{ring.ring_id}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs border border-red-500/20">
                            {ring.pattern_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white font-bold">{ring.risk_score}</td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {ring.member_accounts.join(', ')}
                        </td>
                      </tr>
                    ))}
                    {result.fraud_rings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-600 italic">
                          No fraud rings detected in this dataset.
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

function StatCard({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex flex-col gap-1">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-3xl font-bold ${highlight ? 'text-red-500' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
