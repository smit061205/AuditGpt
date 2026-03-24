import { Link } from "react-router-dom";
import FraudScoreCard from "../FraudScoreCard/FraudScoreCard";
import AnomalyList from "../AnomalyList/AnomalyList";
import TimelineChart from "../TimelineChart/TimelineChart";
import AuditorSentimentChart from "../AuditorSentimentChart/AuditorSentimentChart";
import RelatedPartyChart from "../RelatedPartyChart/RelatedPartyChart";
import PeerComparisonTable from "../PeerComparisonTable/PeerComparisonTable";
import AIChatPanel from "../AIChatPanel/AIChatPanel";
import ExportButton from "../ExportButton/ExportButton";
import { formatDate, formatTime } from "../../utils/formatters";
import { RISK_COLORS } from "../../constants/config";

export default function ReportDisplay({ report, analysisTime }) {
  if (!report) return null;

  const {
    metadata,
    fraud_risk_assessment: fraudRisk,
    anomalies = [],
    metrics_history = [],
    peer_comparison,
    auditor_sentiment_trend,
    summary,
  } = report;
  const riskColor = RISK_COLORS[fraudRisk?.fraud_risk_score] || "#f97316";

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-[fadeInUp_0.5s_ease-out]">
      {/* Report Header */}
      <div
        className="flex flex-col md:flex-row justify-between items-start gap-8 p-6 md:p-8 rounded-xl border border-[#1c1c1c]"
        style={{ background: '#050505' }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-white m-0">
              {metadata?.company_name}
            </h1>
            <span
              className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest border uppercase shadow-sm"
              style={{
                backgroundColor: `${riskColor}20`,
                color: riskColor,
                borderColor: `${riskColor}50`,
              }}
            >
              {fraudRisk?.fraud_risk_score} RISK
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            {metadata?.cin && (
              <span className="flex items-center gap-1.5">
                <span style={{ color: '#06b6d4' }}>CIN:</span> {metadata.cin}
              </span>
            )}
            {metadata?.industry && (
              <span className="flex items-center gap-1.5">
                <span style={{ color: '#06b6d4' }}>IND:</span> {metadata.industry}
              </span>
            )}
            {metadata?.analysis_date && (
              <span className="flex items-center gap-1.5">
                <span style={{ color: '#06b6d4' }}>DATE:</span> {formatDate(metadata.analysis_date)}
              </span>
            )}
            {analysisTime > 0 && (
              <span className="flex items-center gap-1.5">
                <span style={{ color: '#06b6d4' }}>LATENCY:</span> {formatTime(analysisTime)}
              </span>
            )}
          </div>
        </div>

        {summary && (
          <div className="flex justify-around md:justify-end gap-6 w-full md:w-auto p-5 rounded-xl border border-[#1c1c1c]" style={{ background: '#0a0a0a' }}>
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-3xl font-black font-mono leading-none text-red-500 mb-1">
                {summary.critical_flags}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Critical Flags
              </span>
            </div>
            <div className="w-px" style={{ background: '#222222' }}></div>
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-3xl font-black font-mono leading-none text-white mb-1">
                {summary.anomaly_count}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Total Anomalies
              </span>
            </div>
            <div className="w-px" style={{ background: '#222222' }}></div>
            <div className="flex flex-col items-center justify-center min-w-[80px]">
              <span className="text-3xl font-black font-mono leading-none text-white mb-1">
                {metrics_history.length}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Years Analyzed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 1: Fraud Score */}
      <section className="w-full">
        <FraudScoreCard fraudRisk={fraudRisk} />
      </section>

      {/* Section 2: Anomalies */}
      <section className="rounded-xl p-6 md:p-8 border border-[#1c1c1c]" style={{ background: '#050505' }}>
        <AnomalyList anomalies={anomalies} />
      </section>

      {/* Section 3: Timeline Chart */}
      {metrics_history.length > 0 && (
        <section className="rounded-xl p-6 md:p-8 border border-[#1c1c1c]" style={{ background: '#050505' }}>
          <h2 className="text-xl font-bold mb-6 tracking-wide" style={{ color: '#e2e8f0' }}>
            <span style={{ color: '#38bdf8', marginRight: '8px' }}>■</span> Red Flag Timeline (10-Year History)
          </h2>
          <TimelineChart data={metrics_history} anomalies={anomalies} />
        </section>
      )}

      {/* Section 4: Secondary Forensic Charts (Auditor & Related Party) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Auditor Sentiment */}
        {auditor_sentiment_trend?.sentiment_trend?.length > 0 && (
          <div className="rounded-xl p-6 md:p-8 border border-[#1c1c1c] h-full flex flex-col" style={{ background: '#050505' }}>
            <h2 className="text-xl font-bold mb-6 tracking-wide" style={{ color: '#e2e8f0' }}>
              <span style={{ color: '#8b5cf6', marginRight: '8px' }}>■</span> Auditor Confidence Trend
            </h2>
            <div className="flex-1 min-h-[250px]">
              <AuditorSentimentChart data={auditor_sentiment_trend} />
            </div>
          </div>
        )}

        {/* Related Party Transactions */}
        {metrics_history.length > 0 && (
          <div className="rounded-xl p-6 md:p-8 border border-[#1c1c1c] h-full flex flex-col" style={{ background: '#050505' }}>
            <h2 className="text-xl font-bold mb-6 tracking-wide" style={{ color: '#e2e8f0' }}>
              <span style={{ color: '#ef4444', marginRight: '8px' }}>■</span> Related Party Transactions
            </h2>
            <div className="flex-1 min-h-[250px]">
              <RelatedPartyChart data={metrics_history} />
            </div>
          </div>
        )}
      </section>

      {/* Section 5: Peer Comparison */}
      {peer_comparison && (
        <section className="rounded-xl p-6 md:p-8 border border-[#1c1c1c]" style={{ background: '#050505' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 tracking-wide" style={{ color: '#e2e8f0' }}>
              <span style={{ color: '#4ade80', marginRight: '8px' }}>■</span> Industry Peer Comparison
            </h2>
            {peer_comparison.peer_companies?.length > 0 && (
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                Benchmarking target company against its closest industry peers:{' '}
                <strong style={{ color: '#d1d5db' }}>
                  {peer_comparison.peer_companies.map((p, i) => (
                    <span key={p.id}>
                      <Link to={`/?q=${p.id}`} style={{ color: '#06b6d4', textDecoration: 'none' }} className="hover:text-cyan-300">
                        {p.name || p.id}
                      </Link>
                      {i < peer_comparison.peer_companies.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </strong>
              </p>
            )}
          </div>
          <PeerComparisonTable peers={peer_comparison} />
        </section>
      )}

      {/* Overall Assessment - Now AI Generated */}
      {summary?.overall_health_assessment && (
        <section className="w-full">
          <div
            className="rounded-xl p-6 md:p-8 border border-[#1c1c1c]"
            style={{ background: '#050505' }}
          >
            <h3 className="font-display font-semibold text-xl mb-4 tracking-tight flex items-center gap-2 text-white">
              <span style={{ color: '#38bdf8' }}>■</span> AI Overall Assessment
            </h3>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              {summary.overall_health_assessment}
            </p>
          </div>
        </section>
      )}

      {/* AI Deep-Dive Chat */}
      <section className="rounded-xl p-6 md:p-8 border border-[#1c1c1c] print:hidden" style={{ background: '#050505' }}>
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-wide" style={{ color: '#e2e8f0' }}>
            <span style={{ color: '#4ade80', marginRight: '8px' }}>■</span> AI Forensic Deep-Dive
          </h2>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Ask Kimi K2 anything about this company's 10-year financial history.
          </p>
        </div>
        <AIChatPanel report={report} />
      </section>

      {/* Export */}
      <section className="w-full mt-4">
        <ExportButton report={report} />
      </section>
    </div>
  );
}
