import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "./components/Header/Header";
import InputForm from "./components/InputForm/InputForm";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import ReportDisplay from "./components/ReportDisplay/ReportDisplay";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { analyzeCompany } from "./services/api";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisTime, setAnalysisTime] = useState(0);
  const [theaterDone, setTheaterDone] = useState(false);

  const query = searchParams.get("q");

  useEffect(() => {
    if (!query) { setReport(null); return; }
    if (report?.metadata?.id === query) return; // already loaded this company

    // Guard: skip if a request is already in-flight
    if (loading) return;

    let cancelled = false;
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      setAnalysisTime(0);
      const startTime = Date.now();
      try {
        const result = await analyzeCompany(query);
        if (cancelled) return;
        if (result.success) {
          setReport(result.data);
          setAnalysisTime(Date.now() - startTime);
        } else {
          throw new Error(result.error || "Unknown error occurred");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Analysis failed:", err);
        setError({
          message: err.message,
          suggestion: err.response?.data?.suggestion || "Please try another company",
        });
        setReport(null);
      } finally {
        if (!cancelled) {
          // Force the loading theater to finish its 13s run before transitioning
          const elapsed = Date.now() - startTime;
          if (elapsed < 13000) {
            setTimeout(() => {
              if (!cancelled) {
                setLoading(false);
                setTheaterDone(true);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }
            }, 13000 - elapsed);
          } else {
            setLoading(false);
            setTheaterDone(true);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        }
      }
    };

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [query]);

  const handleSearchSubmit = (companyId) => {
    setSearchParams({ q: companyId });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen font-sans flex flex-col" style={{ background: '#000000', color: '#d1d5db' }}>
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center justify-center">
          {(!report && !loading && !theaterDone && !error) && (
            <div className="w-full flex flex-col items-center">

              {/* ── HERO ── */}
              <section className="w-full flex flex-col items-center justify-center py-24 text-center px-4">
                {/* Live badge */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-10 px-5 py-2.5 rounded-lg text-xs font-mono"
                  style={{ background: '#0a0a0a', border: '1px solid #1c1c1c', color: '#9ca3af' }}>
                  <span style={{ color: '#06b6d4', fontWeight: 700 }}>◉ LIVE</span>
                  <span style={{ color: '#374151' }}>|</span>
                  <span>88 NSE companies</span>
                  <span style={{ color: '#374151' }}>|</span>
                  <span>880 financial statements</span>
                  <span style={{ color: '#374151' }}>|</span>
                  <span>~15s per analysis</span>
                </div>

                <h1 className="font-black tracking-tight leading-[1.05] mb-6 m-0 max-w-4xl"
                  style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.2rem)', color: '#ffffff', letterSpacing: '-0.02em' }}>
                  The AI That Reads{' '}
                  <span style={{ color: '#06b6d4' }}>10 Years</span>
                  {' '}of Filings —{' '}
                  <br className="hidden md:block" />
                  and Finds What{' '}
                  <span style={{ color: '#f43f5e' }}>the Auditors Missed.</span>
                </h1>

                <p className="font-medium leading-relaxed max-w-2xl mb-12"
                  style={{ fontSize: '1.1rem', color: '#d1d5db' }}>
                  Every major Indian corporate fraud — Satyam, IL&amp;FS, Yes Bank, DHFL — had visible warning signs buried in public filings for years. AuditGPT surfaces them instantly.
                </p>

                <div className="w-full max-w-2xl">
                  <InputForm onSubmit={handleSearchSubmit} />
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
                  {[
                    { label: 'Kimi K2 · 1T MoE', color: '#4ade80' },
                    { label: 'SEBI-format 10YR Data', color: '#8b5cf6' },
                    { label: 'Sector-aware Benchmarking', color: '#22c55e' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#9ca3af' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }}></span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </section>

              {/* ── DIVIDER ── */}
              <div className="w-full" style={{ borderTop: '1px solid #111111' }}></div>

              {/* ── HOW IT WORKS ── */}
              <section className="w-full max-w-5xl px-6 py-20">
                <div className="text-center mb-14">
                  <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#06b6d4' }}>How it works</div>
                  <h2 className="font-black text-3xl mb-4 m-0" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>From Company Name to Forensic Report in 3 Steps</h2>
                  <p className="text-sm" style={{ color: '#6b7280' }}>No setup. No spreadsheets. Just answers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      step: '01',
                      title: 'Enter a Company',
                      desc: 'Type any NSE-listed company name or ticker. Our engine resolves it instantly from a database of 88 major Indian companies.',
                      color: '#06b6d4',
                    },
                    {
                      step: '02',
                      title: 'AI Ingests 10 Years',
                      desc: 'LLaMA 3.3 reads all 10 years of balance sheets, P&L, cash flows, and auditor notes simultaneously — something no human auditor does.',
                      color: '#8b5cf6',
                    },
                    {
                      step: '03',
                      title: 'Get Your Forensic Report',
                      desc: 'Receive a fraud risk score, anomaly map, red flag timeline, auditor sentiment trend, and a 5-peer industry benchmark — in under 90 seconds.',
                      color: '#22c55e',
                    },
                  ].map(item => (
                    <div key={item.step} className="p-6 rounded-xl" style={{ background: '#080808', border: '1px solid #161616' }}>
                      <div className="text-xs font-black mb-4 font-mono" style={{ color: item.color }}>{item.step}</div>
                      <h3 className="font-bold text-base mb-2" style={{ color: '#f9fafb' }}>{item.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── DIVIDER ── */}
              <div className="w-full" style={{ borderTop: '1px solid #111111' }}></div>

              {/* ── WHAT WE DETECT ── */}
              <section className="w-full max-w-5xl px-6 py-20">
                <div className="text-center mb-14">
                  <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#f43f5e' }}>Red Flags Detected</div>
                  <h2 className="font-black text-3xl mb-4 m-0" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>The Patterns That Always Precede Fraud</h2>
                  <p className="text-sm max-w-xl mx-auto" style={{ color: '#6b7280' }}>These warning signs were visible in Satyam, DHFL, and Yes Bank for years before collapse. AuditGPT catches them across 10 years simultaneously.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                          <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                      ),
                      flag: 'Revenue–Cashflow Divergence',
                      desc: 'Revenue growing faster than operating cash flow — a classic earnings manipulation signal.'
                    },
                    { 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      ),
                      flag: 'Related Party Bloat',
                      desc: 'Quietly ballooning transactions with promoter-linked entities that standard auditors often miss.'
                    },
                    { 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      ),
                      flag: 'Creative Debt Structures',
                      desc: 'Debt being rolled into increasingly complex off-balance-sheet arrangements over time.'
                    },
                    { 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      ),
                      flag: 'Auditor Language Shift',
                      desc: 'Audit opinions becoming longer, more hedged, and loaded with qualifications year over year.'
                    },
                    { 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                          <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                        </svg>
                      ),
                      flag: 'Sector Anomaly Detection',
                      desc: 'Every flag is benchmarked against 5 real sector peers — high debt is normal for banks, a red flag for IT.'
                    },
                    { 
                      icon: (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      ),
                      flag: 'Multi-Year Pattern Matching',
                      desc: 'Signals that only emerge when you look at 3-5 years together, invisible in a single-year audit.'
                    },
                  ].map(item => (
                    <div key={item.flag} className="p-6 rounded-xl flex flex-col gap-4" style={{ background: '#080808', border: '1px solid #161616' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#000000', border: '1px solid #1f1f1f' }}>
                        {item.icon}
                      </div>
                      <div className="font-bold text-sm" style={{ color: '#f9fafb' }}>{item.flag}</div>
                      <div className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── DIVIDER ── */}
              <div className="w-full" style={{ borderTop: '1px solid #111111' }}></div>

              {/* ── CONTEXT SECTION ── */}
              <section className="w-full max-w-4xl px-6 py-20 text-center">
                <div className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#8b5cf6' }}>Real-world context</div>
                <h2 className="font-black text-2xl mb-8 m-0" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>The Problem AuditGPT Solves</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {[
                    { stat: '₹14,000 Cr', label: 'Lost in Satyam fraud', sub: 'Warning signs were visible in filings for 4 years before the confession.' },
                    { stat: '34%', label: 'NSE companies with red flags', sub: 'A 2024 SEBI report shows 34% of listed companies have at least one undetected anomaly.' },
                    { stat: '₹2–5 Cr', label: 'Manual forensic audit cost', sub: 'Firms like Kroll and FTI charge crores and take 3 months. AuditGPT takes 15 seconds.' },
                  ].map(item => (
                    <div key={item.stat} className="p-6 rounded-xl" style={{ background: '#080808', border: '1px solid #161616' }}>
                      <div className="font-black text-2xl mb-1" style={{ color: '#ffffff' }}>{item.stat}</div>
                      <div className="font-bold text-sm mb-2" style={{ color: '#9ca3af' }}>{item.label}</div>
                      <div className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{item.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Final CTA */}
                <div className="mt-16">
                  <p className="text-sm mb-6 font-medium" style={{ color: '#9ca3af' }}>Start your first forensic analysis — it takes 15 seconds.</p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="font-black text-sm uppercase transition-all duration-200"
                    style={{ 
                      background: '#06b6d4', 
                      color: '#000000', 
                      padding: '16px 48px',
                      borderRadius: '8px',
                      border: 'none', 
                      cursor: 'pointer',
                      letterSpacing: '0.1em'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#22d3ee'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#06b6d4'; }}
                  >
                    Analyze a Company →
                  </button>
                </div>
              </section>

            </div>
          )}

          {loading && (
            <div className="w-full max-w-2xl transform transition-all duration-500 ease-out translate-y-0 opacity-100">
              <LoadingSpinner isComplete={false} />
            </div>
          )}

          {error && !loading && (
            <div className="w-full max-w-3xl transform transition-all duration-500 ease-out translate-y-0 opacity-100 mt-8">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 flex flex-col gap-4 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-red-400 font-bold text-lg m-0">
                    Analysis Failed
                  </h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {error.message}
                </p>
                {error.suggestion && (
                  <p className="text-slate-500 text-xs mt-2">
                    {error.suggestion}
                  </p>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="bg-audit-accent hover:bg-sky-400 text-white font-semibold py-2 px-8 rounded-full transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {report && !loading && theaterDone && (
            <div className="w-full transform transition-all duration-500 ease-out translate-y-0 opacity-100 pb-12">
              <div className="flex justify-between items-center mb-8 print-hide">
                <button
                  onClick={() => {
                    setSearchParams({});
                    setTheaterDone(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 font-display text-sm font-semibold text-slate-400 bg-[#0a0a0a] border border-[#1c1c1c] rounded-lg hover:text-white hover:border-[#333333] transition-colors"
                >
                  <span className="text-lg leading-none mb-0.5">←</span> Back to Search
                </button>
              </div>
              <ReportDisplay report={report} analysisTime={analysisTime} />
            </div>
          )}
        </main>

        <footer className="w-full py-6 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#1e293b' }}>
          <p style={{ color: '#334155' }}>
            AuditGPT © 2026 &nbsp;·&nbsp; Groq + LLaMA 3.1 8B &nbsp;·&nbsp; Financial Forensics Engine
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
