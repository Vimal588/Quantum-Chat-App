import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Cpu,
  Clock,
  Database,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  BarChart3,
  LineChart as LineChartIcon,
  Flame,
  Binary,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import api from '../services/api';
import { useThemeStore } from '../store/useThemeStore';

export default function BenchmarkPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [message, setMessage] = useState('Hii');
  const [iterations, setIterations] = useState(1);
  const [warmup, setWarmup] = useState(true);
  const [reuseKey, setReuseKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Results & Summary state
  const [benchmarkResponse, setBenchmarkResponse] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeChartTab, setActiveChartTab] = useState('times'); // 'times' | 'sizes' | 'history'

  // Expiry Simulation State
  const [expiryWindowSec, setExpiryWindowSec] = useState(30);
  const [simulatedMsg, setSimulatedMsg] = useState(null);
  const [simRemaining, setSimRemaining] = useState(null);
  const simTimerRef = useRef(null);

  // Load summary & initial benchmark
  useEffect(() => {
    loadSummary();
    loadHistory();
    runComparisonBenchmark('Hii', 1, true, false);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const loadSummary = async () => {
    try {
      const res = await api.get('/benchmark/summary');
      setSummary(res.data);
    } catch (err) {
      console.warn('Could not fetch summary:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/benchmark/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Could not fetch history:', err);
    }
  };

  const runComparisonBenchmark = async (msgToTest, iters, doWarmup, doReuse) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/benchmark/compare', {
        message: msgToTest || message,
        iterations: iters !== undefined ? iters : iterations,
        warmup: doWarmup !== undefined ? doWarmup : warmup,
        reuseKey: doReuse !== undefined ? doReuse : reuseKey
      });
      setBenchmarkResponse(res.data);
      // Reload summary and history after new run
      loadSummary();
      loadHistory();
    } catch (err) {
      console.error('Benchmark execution error:', err);
      setError(err.response?.data?.message || 'Failed to execute cryptography benchmark.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAndCompare = (e) => {
    e.preventDefault();
    if (!message || message.trim().length === 0) return;
    runComparisonBenchmark(message, iterations, warmup, reuseKey);
  };

  // Expiry Simulation Handlers
  const handleStartExpirySimulation = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryWindowSec * 1000);

    const newSimMsg = {
      id: 'sim-' + Math.random().toString(36).substring(2, 9),
      plaintext: message || 'Hii',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      algorithm: 'ML-KEM-768 + AES-256-GCM',
      status: 'DELIVERED',
      isExpired: false
    };

    setSimulatedMsg(newSimMsg);
    setSimRemaining(expiryWindowSec);

    simTimerRef.current = setInterval(() => {
      setSimRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(simTimerRef.current);
          setSimulatedMsg((msg) => (msg ? { ...msg, status: 'EXPIRED', isExpired: true } : null));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      alert('No benchmark history available to export.');
      return;
    }

    const headers = [
      'Timestamp',
      'RunID',
      'MessageSnippet',
      'Iterations',
      'RSA_KeyGen_µs',
      'RSA_Encrypt_µs',
      'RSA_Decrypt_µs',
      'ECC_KeyGen_µs',
      'ECC_Encrypt_µs',
      'ECC_Decrypt_µs',
      'PQC_KeyGen_µs',
      'PQC_Encrypt_µs',
      'PQC_Decrypt_µs',
      'PQC_Ciphertext_Bytes',
      'PQC_PublicKey_Bytes'
    ];

    const rows = history.map((item, idx) => [
      `"${item.createdAt || item.timestamp || new Date().toISOString()}"`,
      `"${item.id || item.benchmarkId || `run-${idx + 1}`}"`,
      `"${(item.messageSnippet || item.plaintext || item.message || '').replace(/"/g, '""')}"`,
      item.iterations || 1,
      Math.round(item.rsaKeygenUs || item.keyGenTimeMicros || 0),
      Math.round(item.rsaEncryptUs || item.encryptionTimeMicros || 0),
      Math.round(item.rsaDecryptUs || item.decryptionTimeMicros || 0),
      Math.round(item.eccKeygenUs || 0),
      Math.round(item.eccEncryptUs || 0),
      Math.round(item.eccDecryptUs || 0),
      Math.round(item.pqcKeygenUs || 0),
      Math.round(item.pqcEncryptUs || 0),
      Math.round(item.pqcDecryptUs || 0),
      item.pqcCiphertextSizeBytes || 1088,
      item.pqcKeySizeBytes || 1184
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crypto_benchmark_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe model unwrapping
  const rsaResult = benchmarkResponse?.rsa || benchmarkResponse?.results?.RSA;
  const eccResult = benchmarkResponse?.ecc || benchmarkResponse?.results?.ECC;
  const pqcResult = benchmarkResponse?.pqc || benchmarkResponse?.results?.PQC;

  const getKeygenUs = (r) => (r ? (r.keygenTimeUs ?? r.keyGenTimeMicros ?? 0) : 0);
  const getEncryptUs = (r) => (r ? (r.encryptionTimeUs ?? r.encryptionTimeMicros ?? 0) : 0);
  const getDecryptUs = (r) => (r ? (r.decryptionTimeUs ?? r.decryptionTimeMicros ?? 0) : 0);
  const getKeygenMs = (r) => (r ? (r.keygenTimeMs ?? r.keyGenTimeMillis ?? (getKeygenUs(r) / 1000)) : 0);
  const getEncryptMs = (r) => (r ? (r.encryptionTimeMs ?? r.encryptionTimeMillis ?? (getEncryptUs(r) / 1000)) : 0);
  const getDecryptMs = (r) => (r ? (r.decryptionTimeMs ?? r.decryptionTimeMillis ?? (getDecryptUs(r) / 1000)) : 0);
  const getDeliveryStatus = (r) => (r ? (r.deliveryStatus || r.messageDeliveryStatus || 'DELIVERED') : '--');

  // Summary card helpers
  const totalRuns = summary?.totalMessagesSent ?? summary?.totalBenchmarksRun ?? history.length;
  const totalOps = summary?.totalEncryptionOperations ?? (history.length * 3);
  const avgEncUs = summary?.averageEncryptionTimeMicros > 0
    ? summary.averageEncryptionTimeMicros
    : (summary?.avgRsaEncryptUs && summary?.avgEccEncryptUs && summary?.avgPqcEncryptUs)
    ? (summary.avgRsaEncryptUs + summary.avgEccEncryptUs + summary.avgPqcEncryptUs) / 3
    : getEncryptUs(pqcResult);
  const avgDecUs = summary?.averageDecryptionTimeMicros > 0
    ? summary.averageDecryptionTimeMicros
    : (summary?.avgRsaDecryptUs && summary?.avgEccDecryptUs && summary?.avgPqcDecryptUs)
    ? (summary.avgRsaDecryptUs + summary.avgEccDecryptUs + summary.avgPqcDecryptUs) / 3
    : getDecryptUs(pqcResult);

  // Chart data preparation
  const timeChartData = [
    {
      metric: 'Key Generation',
      RSA: Math.round(getKeygenUs(rsaResult)),
      ECC: Math.round(getKeygenUs(eccResult)),
      PQC: Math.round(getKeygenUs(pqcResult)),
      unit: 'µs'
    },
    {
      metric: 'Encryption (Wrap+AES)',
      RSA: Math.round(getEncryptUs(rsaResult)),
      ECC: Math.round(getEncryptUs(eccResult)),
      PQC: Math.round(getEncryptUs(pqcResult)),
      unit: 'µs'
    },
    {
      metric: 'Decryption (Unwrap+AES)',
      RSA: Math.round(getDecryptUs(rsaResult)),
      ECC: Math.round(getDecryptUs(eccResult)),
      PQC: Math.round(getDecryptUs(pqcResult)),
      unit: 'µs'
    }
  ];

  const sizeChartData = [
    {
      category: 'Public Key',
      RSA: rsaResult?.publicKeySizeBytes || 0,
      ECC: eccResult?.publicKeySizeBytes || 0,
      PQC: pqcResult?.publicKeySizeBytes || 0,
      unit: 'bytes'
    },
    {
      category: 'Ciphertext Wire Size',
      RSA: rsaResult?.ciphertextSizeBytes || 0,
      ECC: eccResult?.ciphertextSizeBytes || 0,
      PQC: pqcResult?.ciphertextSizeBytes || 0,
      unit: 'bytes'
    },
    {
      category: 'Private Key',
      RSA: rsaResult?.privateKeySizeBytes || 0,
      ECC: eccResult?.privateKeySizeBytes || 0,
      PQC: pqcResult?.privateKeySizeBytes || 0,
      unit: 'bytes'
    }
  ];

  // History timeline data
  const historyChartData = [];
  if (Array.isArray(history) && history.length > 0) {
    history.forEach((h, idx) => {
      if (!h) return;
      const rawId = h.id || h.benchmarkId || `run-${idx + 1}`;
      const idStr = String(rawId).substring(0, 8);
      const dateVal = h.createdAt || h.timestamp;
      const timeStr = dateVal ? new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `#${idx + 1}`;
      historyChartData.push({
        benchmarkId: idStr,
        time: timeStr,
        RSA_Enc: Math.round(h.rsaEncryptUs ?? h.encryptionTimeMicros ?? 0),
        ECC_Enc: Math.round(h.eccEncryptUs ?? 0),
        PQC_Enc: Math.round(h.pqcEncryptUs ?? 0),
        RSA_Dec: Math.round(h.rsaDecryptUs ?? 0),
        PQC_Dec: Math.round(h.pqcDecryptUs ?? 0),
      });
    });
  }

  const runIdSnippet = benchmarkResponse?.benchmarkId
    ? String(benchmarkResponse.benchmarkId).substring(0, 8)
    : benchmarkResponse?.id
    ? String(benchmarkResponse.id).substring(0, 8)
    : 'Latest';

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Cryptography Performance Comparison
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Empirical Benchmark
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl">
              Real-time hardware-level performance evaluation of classical public-key cryptography (RSA-2048, ECC NIST P-256) versus NIST post-quantum standard <strong className="text-teal-400 font-semibold">ML-KEM-768 (FIPS 203)</strong> using monotonic high-resolution timers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadSummary();
                loadHistory();
                runComparisonBenchmark(message, iterations, warmup, reuseKey);
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
              Re-run
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Section A: Overview Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1 */}
          <div className="bg-navy-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Messages Sent</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalRuns}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
              <span className="text-cyan-400 font-semibold">{summary?.recentRuns?.length || history.length}</span> recorded runs
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-navy-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Crypto Ops</span>
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalOps}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              3 parallel suites
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-navy-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Avg Encryption</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 tracking-tight">
              {avgEncUs > 0 ? `${Math.round(avgEncUs)} µs` : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {avgEncUs > 0 ? `${(avgEncUs / 1000).toFixed(2)} ms mean` : 'Across suites'}
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-navy-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Avg Decryption</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 tracking-tight">
              {avgDecUs > 0 ? `${Math.round(avgDecUs)} µs` : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {avgDecUs > 0 ? `${(avgDecUs / 1000).toFixed(2)} ms mean` : 'Across suites'}
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-navy-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Active Algorithm</span>
              <Lock className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-sm font-bold text-teal-300 truncate" title="ML-KEM-768 + AES-256-GCM">
              ML-KEM-768
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              FIPS 203 Standard
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-navy-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Quantum Status</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-cyan-300 flex items-center gap-1">
              Resistant
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Shor-proof Lattice
            </div>
          </div>
        </section>

        {/* Section C: Live Message Testing Panel */}
        <section className="bg-navy-900/70 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-teal-400" />
                Live Message Testing Panel
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Input any plaintext message. Clicking <strong>Send and Compare</strong> performs true parallel key generation, hybrid encapsulation/encryption, and decryption with <code className="text-teal-300 font-mono">System.nanoTime()</code> high-resolution instrumentation.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1 font-mono">Presets:</span>
              {['Hii', 'Attack at dawn 0400Z', 'ML-KEM-768 Lattice Shared Secret', 'Transfer $50,000 to Account #1094'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMessage(p)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  "{p.length > 15 ? p.substring(0, 15) + '…' : p}"
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendAndCompare} className="space-y-4">
            <div className="flex flex-col md:row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message to test (e.g. Hii)"
                  className="w-full bg-navy-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                  required
                />
                <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-500">
                  {new TextEncoder().encode(message).length} bytes
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 hover:from-teal-400 hover:via-cyan-400 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Benchmarks...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Send and Compare
                  </>
                )}
              </button>
            </div>

            {/* Execution Options */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex flex-wrap items-center gap-5">
                {/* Iterations selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">Sample Iterations:</span>
                  <div className="flex items-center bg-navy-950 rounded-lg p-0.5 border border-slate-800">
                    {[1, 5, 10, 20].map((iter) => (
                      <button
                        key={iter}
                        type="button"
                        onClick={() => setIterations(iter)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                          iterations === iter
                            ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {iter}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warm-up toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={warmup}
                    onChange={(e) => setWarmup(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-navy-950 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="flex items-center gap-1 font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    JIT Warm-up Cycle (Clean JIT artifacts)
                  </span>
                </label>

                {/* Key reuse toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={reuseKey}
                    onChange={(e) => setReuseKey(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-navy-950 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="font-mono text-slate-400">
                    Simulate Pre-Shared Public Key (Isolate Enc/Dec)
                  </span>
                </label>
              </div>

              {benchmarkResponse && (
                <div className="text-slate-400 font-mono flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Run ID: {runIdSnippet}
                  </span>
                  <span>•</span>
                  <span>
                    {benchmarkResponse.timestamp
                      ? new Date(benchmarkResponse.timestamp).toLocaleTimeString()
                      : new Date().toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Section B: Algorithm Comparison Table */}
        <section className="bg-navy-900/70 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur space-y-4 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Binary className="w-5 h-5 text-cyan-400" />
                Algorithm Performance Comparison Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Direct empirical comparison on plaintext payload <strong className="text-teal-300">"{benchmarkResponse?.message || message}"</strong> ({benchmarkResponse?.messageSizeBytes || new TextEncoder().encode(message).length} bytes)
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Units: <span className="text-teal-300">µs</span> (microseconds) | <span className="text-cyan-300">ms</span> (milliseconds) | <span className="text-indigo-300">bytes</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-navy-950/80 text-slate-300 uppercase tracking-wider text-[11px] font-mono">
                  <th className="py-3 px-4 font-semibold w-1/4">Metric</th>
                  <th className="py-3 px-4 font-semibold text-rose-300/90 w-1/4">
                    RSA (Classical)
                  </th>
                  <th className="py-3 px-4 font-semibold text-amber-300/90 w-1/4">
                    ECC (Classical)
                  </th>
                  <th className="py-3 px-4 font-semibold text-teal-300 w-1/4">
                    PQC (Post-Quantum)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* Row 1: Algorithm */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Algorithm
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    <span className="font-semibold text-white">RSA-OAEP-2048</span>
                    <span className="block text-[11px] text-slate-400 font-sans">Hybrid AES-256-GCM</span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    <span className="font-semibold text-white">ECC NIST P-256</span>
                    <span className="block text-[11px] text-slate-400 font-sans">ECDH + HKDF + AES-256-GCM</span>
                  </td>
                  <td className="py-3 px-4 text-teal-300">
                    <span className="font-semibold text-teal-200 flex items-center gap-1.5">
                      ML-KEM-768
                      <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 text-[10px] uppercase font-bold border border-teal-500/30">
                        FIPS 203
                      </span>
                    </span>
                    <span className="block text-[11px] text-slate-400 font-sans">M-LWE KEM + HKDF + AES-GCM</span>
                  </td>
                </tr>

                {/* Row 2: Key Generation Time */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Key generation time
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {rsaResult ? (
                      <>
                        <span className="font-bold text-rose-300">{Math.round(getKeygenUs(rsaResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getKeygenMs(rsaResult).toFixed(2)} ms)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {eccResult ? (
                      <>
                        <span className="font-bold text-amber-300">{Math.round(getKeygenUs(eccResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getKeygenMs(eccResult).toFixed(2)} ms)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-teal-300 bg-teal-500/5">
                    {pqcResult ? (
                      <>
                        <span className="font-bold text-teal-300">{Math.round(getKeygenUs(pqcResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-teal-400/80 block font-sans">({getKeygenMs(pqcResult).toFixed(3)} ms) ⚡ Ultra-fast lattice sample</span>
                      </>
                    ) : '--'}
                  </td>
                </tr>

                {/* Row 3: Encryption Time */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Encryption time
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {rsaResult ? (
                      <>
                        <span className="font-bold text-white">{Math.round(getEncryptUs(rsaResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getEncryptMs(rsaResult).toFixed(3)} ms)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {eccResult ? (
                      <>
                        <span className="font-bold text-white">{Math.round(getEncryptUs(eccResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getEncryptMs(eccResult).toFixed(3)} ms)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-teal-300 bg-teal-500/5">
                    {pqcResult ? (
                      <>
                        <span className="font-bold text-teal-300">{Math.round(getEncryptUs(pqcResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getEncryptMs(pqcResult).toFixed(3)} ms) Encapsulation</span>
                      </>
                    ) : '--'}
                  </td>
                </tr>

                {/* Row 4: Decryption Time */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Decryption time
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {rsaResult ? (
                      <>
                        <span className="font-bold text-rose-300">{Math.round(getDecryptUs(rsaResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getDecryptMs(rsaResult).toFixed(2)} ms) Modular exp</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {eccResult ? (
                      <>
                        <span className="font-bold text-white">{Math.round(getDecryptUs(eccResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getDecryptMs(eccResult).toFixed(3)} ms)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-teal-300 bg-teal-500/5">
                    {pqcResult ? (
                      <>
                        <span className="font-bold text-teal-300">{Math.round(getDecryptUs(pqcResult)).toLocaleString()} µs</span>
                        <span className="text-[11px] text-slate-400 block font-sans">({getDecryptMs(pqcResult).toFixed(3)} ms) Decapsulation</span>
                      </>
                    ) : '--'}
                  </td>
                </tr>

                {/* Row 5: Key Size */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Key size (Pub / Priv)
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {rsaResult ? (
                      <>
                        <span className="font-semibold text-white">{rsaResult.publicKeySizeBytes || 0} B</span>
                        <span className="text-slate-400 font-sans"> / {rsaResult.privateKeySizeBytes || 0} B</span>
                        <span className="text-[11px] text-slate-400 block font-sans">X.509 / PKCS#8 DER</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {eccResult ? (
                      <>
                        <span className="font-semibold text-white">{eccResult.publicKeySizeBytes || 0} B</span>
                        <span className="text-slate-400 font-sans"> / {eccResult.privateKeySizeBytes || 0} B</span>
                        <span className="text-[11px] text-slate-400 block font-sans">Compact Weierstrass curve</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-teal-300 bg-teal-500/5">
                    {pqcResult ? (
                      <>
                        <span className="font-semibold text-teal-200">{(pqcResult.publicKeySizeBytes || 0).toLocaleString()} B</span>
                        <span className="text-slate-400 font-sans"> / {(pqcResult.privateKeySizeBytes || 0).toLocaleString()} B</span>
                        <span className="text-[11px] text-cyan-400/80 block font-sans">Lattice polynomial ring R_q = Z_q[X] / (X^256 + 1)</span>
                      </>
                    ) : '--'}
                  </td>
                </tr>

                {/* Row 6: Ciphertext Size */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Ciphertext size (Wire format)
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {rsaResult ? (
                      <>
                        <span className="font-bold text-white">{rsaResult.ciphertextSizeBytes || 0} bytes</span>
                        <span className="text-[11px] text-slate-400 block font-sans">(256B wrapped key + payload)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {eccResult ? (
                      <>
                        <span className="font-bold text-white">{eccResult.ciphertextSizeBytes || 0} bytes</span>
                        <span className="text-[11px] text-slate-400 block font-sans">(91B ephemeral pub + payload)</span>
                      </>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 text-teal-300 bg-teal-500/5">
                    {pqcResult ? (
                      <>
                        <span className="font-bold text-teal-200">{(pqcResult.ciphertextSizeBytes || 0).toLocaleString()} bytes</span>
                        <span className="text-[11px] text-slate-400 block font-sans">(1,088B KEM ciphertext + payload)</span>
                      </>
                    ) : '--'}
                  </td>
                </tr>

                {/* Row 7: Security Against Quantum Attacks */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Security against quantum attacks
                  </td>
                  <td className="py-3 px-4 text-rose-400 font-sans">
                    <div className="flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-300">Vulnerable</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Shor's algorithm breaks integer factorization in polynomial time O((log N)^3).
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-rose-400 font-sans">
                    <div className="flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-300">Vulnerable</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Shor's algorithm solves elliptic curve discrete logarithm in O((log p)^3) operations.
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-teal-300 font-sans bg-teal-500/5">
                    <div className="flex items-start gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-teal-300">Designed to resist known quantum attacks</span>
                        <p className="text-[11px] text-teal-400/80 mt-0.5">
                          Hardness rooted in high-dimensional Module Learning With Errors (M-LWE).
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Row 8: Message Delivery Status */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-300">
                    Message delivery status
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {rsaResult ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {getDeliveryStatus(rsaResult)}
                      </span>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {eccResult ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {getDeliveryStatus(eccResult)}
                      </span>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-4 font-sans bg-teal-500/5">
                    {pqcResult ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                        {getDeliveryStatus(pqcResult)}
                      </span>
                    ) : '--'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section D: Performance Visualizations (Recharts) */}
        <section className="bg-navy-900/70 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Performance Visualizations & Latency Profiles
              </h2>
              <p className="text-xs text-slate-400">
                Interactive charts rendering empirical timings (µs) and wire payload overhead (bytes).
              </p>
            </div>

            {/* Chart tab navigation */}
            <div className="flex items-center bg-navy-950 rounded-xl p-1 border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab('times')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === 'times'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Operation Times (µs)
              </button>
              <button
                onClick={() => setActiveChartTab('sizes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === 'sizes'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Payload & Key Sizes (Bytes)
              </button>
              <button
                onClick={() => setActiveChartTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeChartTab === 'history'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Historical Runs
              </button>
            </div>
          </div>

          {/* Active Chart View */}
          <div className="h-80 w-full pt-2">
            {activeChartTab === 'times' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="metric" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} unit=" µs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#090d16' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a'
                    }}
                    formatter={(val) => [`${val.toLocaleString()} µs (${(val / 1000).toFixed(2)} ms)`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="RSA" fill="#f43f5e" name="RSA-2048-OAEP" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ECC" fill="#f59e0b" name="ECC NIST P-256" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PQC" fill="#14b8a6" name="ML-KEM-768 (PQC)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'sizes' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="category" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} unit=" B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#090d16' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a'
                    }}
                    formatter={(val) => [`${val.toLocaleString()} bytes`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="RSA" fill="#f43f5e" name="RSA-2048" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ECC" fill="#f59e0b" name="ECC P-256" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PQC" fill="#06b6d4" name="ML-KEM-768 (PQC)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'history' && (
              historyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="time" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} unit=" µs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#090d16' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(val) => [`${val.toLocaleString()} µs`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="RSA_Enc" stroke="#f43f5e" name="RSA Encrypt" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ECC_Enc" stroke="#f59e0b" name="ECC Encrypt" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="PQC_Enc" stroke="#14b8a6" name="PQC Encapsulate" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="RSA_Dec" stroke="#fb7185" name="RSA Decrypt" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="PQC_Dec" stroke="#2dd4bf" name="PQC Decapsulate" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <LineChartIcon className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs font-mono">No historical runs recorded yet. Execute "Send and Compare" above to build history.</p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Section E: Message Expiry & Security Policy Simulator */}
        <section className="bg-navy-900/70 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Message Expiry & Ephemeral Retention Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Test time-to-live message expiration policies with live countdowns and status lifecycle verification.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">TTL Window:</span>
              {[10, 30, 60, 300].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setExpiryWindowSec(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    expiryWindowSec === sec
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'bg-navy-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                </button>
              ))}
              <button
                onClick={handleStartExpirySimulation}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                Simulate Expiry
              </button>
            </div>
          </div>

          {/* Educational Security Policy Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300">Cryptographic Boundary & Application Policy Notice:</span>
              <p className="text-slate-300 leading-relaxed">
                Message expiration and auto-deletion are <strong>application-level data retention policies</strong> enforced by the chat server and client applications. While the server drops expired ciphertexts from databases and clients scrub plaintext from memory upon expiration, message expiry <em>cannot mathematically guarantee deletion</em> if a recipient or passive adversary has already captured, cached, or exfiltrated the decrypted content prior to expiration.
              </p>
            </div>
          </div>

          {/* Active Simulation Card */}
          {simulatedMsg ? (
            <div className="bg-navy-950/90 border border-slate-800 rounded-xl p-4.5 space-y-3 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Simulation ID:</span>
                  <span className="text-xs text-white font-bold">{simulatedMsg.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                    {simulatedMsg.algorithm}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Status:</span>
                  {simulatedMsg.isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <Unlock className="w-3 h-3 text-rose-400" />
                      EXPIRED (Scrubbed)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      ACTIVE / DELIVERED
                    </span>
                  )}
                </div>
              </div>

              {/* Countdown bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Remaining Time to Destruction:</span>
                  <span className={`font-bold ${simRemaining === 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {simRemaining} seconds remaining
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      simRemaining === 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-teal-400'
                    }`}
                    style={{ width: `${(simRemaining / expiryWindowSec) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 text-slate-400">
                <div>
                  Payload State:{' '}
                  {simulatedMsg.isExpired ? (
                    <span className="text-rose-400 font-bold">[PURGED FROM CLIENT CACHE & DB]</span>
                  ) : (
                    <span className="text-teal-300 font-bold">"{simulatedMsg.plaintext}" (Decrypted in-memory)</span>
                  )}
                </div>
                <div className="text-right">
                  Expires At: <span className="text-slate-300">{new Date(simulatedMsg.expiresAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
              Click "Simulate Expiry" to trigger a live ephemeral message countdown with active status transitions.
            </div>
          )}
        </section>

        {/* Section F: Granular Cryptographic Implementation Breakdown */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Granular Cryptographic Implementation Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* RSA Deep Dive Card */}
            <div className="bg-navy-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    Classical
                  </span>
                  <span className="text-xs text-slate-400 font-mono">NIST SP 800-56B</span>
                </div>
                <h3 className="text-base font-bold text-white">RSA-2048-OAEP</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hybrid key encapsulation using 2048-bit RSA with Optimal Asymmetric Encryption Padding (OAEP) wrapping a 256-bit AES symmetric key.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardness:</span>
                    <span className="text-slate-200">Integer Factorization (IFP)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Symmetric Cipher:</span>
                    <span className="text-slate-200">AES-256-GCM (128-bit tag)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Library:</span>
                    <span className="text-slate-200">Bouncy Castle / SunJCE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wire Overhead:</span>
                    <span className="text-slate-200">{rsaResult?.encapsulatedKeySizeBytes || rsaResult?.overheadBytes || 284} bytes</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-rose-400/90 font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  Shor's Algorithm: Broken in polynomial time
                </div>
              </div>
            </div>

            {/* ECC Deep Dive Card */}
            <div className="bg-navy-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Classical
                  </span>
                  <span className="text-xs text-slate-400 font-mono">NIST SP 800-56A</span>
                </div>
                <h3 className="text-base font-bold text-white">ECC NIST P-256 (secp256r1)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Elliptic Curve Diffie-Hellman (ECDH) ephemeral key agreement paired with HKDF-SHA-256 key derivation and AES-256-GCM authenticated payload encryption.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardness:</span>
                    <span className="text-slate-200">ECDLP on Weierstrass curve</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">KDF:</span>
                    <span className="text-slate-200">HKDF-Extract + Expand</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Library:</span>
                    <span className="text-slate-200">Java SunEC Provider</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wire Overhead:</span>
                    <span className="text-slate-200">{eccResult?.encapsulatedKeySizeBytes || eccResult?.overheadBytes || 119} bytes</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-rose-400/90 font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  Shor's Algorithm: Discrete log solved in O(n^3)
                </div>
              </div>
            </div>

            {/* PQC Deep Dive Card */}
            <div className="bg-navy-900/70 border border-teal-500/30 rounded-2xl p-5 backdrop-blur flex flex-col justify-between space-y-4 shadow-lg shadow-teal-500/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                    Post-Quantum
                  </span>
                  <span className="text-xs text-teal-400 font-mono">NIST FIPS 203 Standard</span>
                </div>
                <h3 className="text-base font-bold text-teal-200 flex items-center gap-2">
                  ML-KEM-768
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Standardized Module Learning With Errors (M-LWE) Key Encapsulation Mechanism. Establishes quantum-safe symmetric key via HKDF-SHA-256 for AES-256-GCM.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardness:</span>
                    <span className="text-teal-300">Module-LWE Euclidean Lattices</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Security Category:</span>
                    <span className="text-teal-300">NIST Level 3 (~AES-192/256 equivalent)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Library:</span>
                    <span className="text-slate-200">Bouncy Castle v1.79 / MLKEM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wire Overhead:</span>
                    <span className="text-slate-200">{pqcResult?.encapsulatedKeySizeBytes || pqcResult?.overheadBytes || 1116} bytes</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-teal-300 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  Quantum Safe: Resists Shor & Grover cryptanalysis
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section G: Educational Cryptanalysis Comparison */}
        <section className="bg-navy-900/70 border border-slate-800/80 rounded-2xl p-5 md:p-6 backdrop-blur space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              Why Classical Cryptography Fails Against Quantum Computers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300 leading-relaxed font-sans">
            <div className="bg-navy-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
              <h4 className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Shor's Algorithm (1994) & Classical Public Keys
              </h4>
              <p>
                Classical asymmetric algorithms rely on problems whose classical best algorithms require sub-exponential time:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li><strong className="text-slate-200">RSA:</strong> Integer Factorization Problem (IFP). Classically solved via General Number Field Sieve (GNFS).</li>
                <li><strong className="text-slate-200">ECC (ECDH / ECDSA):</strong> Elliptic Curve Discrete Logarithm Problem (ECDLP).</li>
              </ul>
              <p>
                On a Cryptanalytically Relevant Quantum Computer (CRQC), Peter Shor proved that Quantum Fourier Transforms find periodicities in modular arithmetic in strictly <span className="text-rose-300 font-mono font-semibold">polynomial time O((log N)^3)</span>, reducing centuries of classical compute to mere minutes or seconds.
              </p>
            </div>

            <div className="bg-navy-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
              <h4 className="font-bold text-teal-300 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Lattice-Based Post-Quantum Hardness (ML-KEM)
              </h4>
              <p>
                ML-KEM (FIPS 203) is built on Module Learning With Errors (M-LWE). Rather than algebraic periodicity, its security reduces to geometric lattice problems:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li><strong className="text-teal-200">Shortest Vector Problem (SVP):</strong> Finding the shortest non-zero vector in high-dimensional Euclidean space.</li>
                <li><strong className="text-teal-200">Closest Vector Problem (CVP):</strong> Resisting both classical (BKZ) and quantum sieving algorithms.</li>
              </ul>
              <p>
                No known quantum algorithm offers an exponential speedup against lattice problems. Quantum attacks (Grover-enhanced lattice sieving) require <span className="text-teal-300 font-mono font-semibold">~2^192 to 2^256</span> quantum gate operations, guaranteeing digital confidentiality against "Harvest Now, Decrypt Later" adversaries.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
