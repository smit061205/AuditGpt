import { useState, useEffect } from "react";

const TERMINAL_LOGS = [
  { time: 0, text: "> Initializing AuditGPT Forensics Engine v2.4..." },
  { time: 600, text: "> Establishing secure connection to SEBI XBRL Database..." },
  { time: 1500, text: "[OK] Connection established (Latency: 42ms)" },
  { time: 2200, text: "> Extracting 10-year consolidated statements..." },
  { time: 3200, text: "[OK] 10 years of Balance Sheets and P&L ingested" },
  { time: 3800, text: "> Querying 5 closest industry peers for benchmarking..." },
  { time: 5100, text: "[OK] Peer median baselines calculated" },
  { time: 6000, text: "> Booting LLaMA 3.1 8B inference engine..." },
  { time: 7200, text: "> Running multi-turn anomaly detection..." },
  { time: 8800, text: "[OK] Financial anomalies mapped" },
  { time: 9500, text: "> Analyzing 10 years of Auditor Notes for hedging sentiment..." },
  { time: 11000, text: "[OK] Sentiment trajectory calculated" },
  { time: 11500, text: "> Synthesizing final AuditGPT Fraud Profile..." }
];

export default function LoadingSpinner() {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timers = [];
    const startTime = Date.now();
    
    // Simulate progress bar (0 to 100% over 13 seconds)
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 13000) * 100, 99);
      setProgress(newProgress);
    }, 100);
    timers.push(progressTimer);

    // Sequence logs
    TERMINAL_LOGS.forEach((log) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, log]);
      }, log.time);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-2xl mx-auto mt-10">
      {/* Outer Glow Ring */}
      <div className="relative w-20 h-20 flex items-center justify-center mb-10">
        <div className="absolute inset-0 rounded-full border-2 border-[#1c1c1c]"></div>
        <div className="absolute inset-0 rounded-full border-2 border-[#06b6d4] border-t-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
        <div 
          className="absolute inset-3 rounded-full border-2 border-[#38bdf8] border-b-transparent animate-spin" 
          style={{ animationDirection: "reverse", animationDuration: "1s" }}
        ></div>
        <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]">
          🛡️
        </span>
      </div>

      <div className="w-full flex justify-between items-end mb-3 px-1">
        <h3 className="font-display font-bold text-xs md:text-sm text-slate-400 uppercase tracking-widest">
          Forensic Extraction in Progress
        </h3>
        <span className="font-mono text-xs font-bold text-[#06b6d4]">{progress.toFixed(0)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[#111111] rounded-full overflow-hidden mb-8 border border-[#1c1c1c]">
        <div 
          className="h-full bg-gradient-to-r from-[#06b6d4] to-[#38bdf8] transition-all duration-[100ms] ease-linear shadow-[0_0_10px_#06b6d4]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Terminal Window */}
      <div className="w-full bg-[#050505] border border-[#1c1c1c] rounded-xl p-5 md:p-6 font-mono text-[11px] md:text-xs overflow-hidden shadow-2xl relative h-[280px] flex flex-col justify-end">
        <div className="absolute top-0 left-0 w-full h-8 bg-[#0a0a0a] border-b border-[#1c1c1c] flex items-center px-4 gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>
          <span className="ml-4 text-[#64748b] text-[10px] uppercase font-bold tracking-wider">AuditGPT Terminal</span>
        </div>
        
        <div className="flex flex-col gap-2.5 mt-8">
          {logs.map((log, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-3 animate-[fadeIn_0.15s_ease-out] ${
                log.text.startsWith('[OK]') ? 'text-[#4ade80]' : 'text-[#94a3b8]'
              }`}
            >
              {log.text.startsWith('[OK]') ? (
                 <span className="text-[#4ade80] font-bold shrink-0 mt-0.5">✔</span>
              ) : (
                 <span className="text-[#06b6d4] shrink-0 mt-0.5">▶</span>
              )}
              <span className="leading-relaxed">{log.text}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-slate-500 mt-1">
            <span className="animate-pulse text-[#06b6d4] text-sm">█</span>
          </div>
        </div>
      </div>
    </div>
  );
}
