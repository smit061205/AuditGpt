import { useState } from "react";
import { RISK_COLORS } from "../../constants/config";

const SEVERITY_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export default function AnomalyList({ anomalies = [] }) {
  const [sortBy, setSortBy] = useState("severity");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const filtered = [...anomalies]
    .filter((a) => filterSeverity === "All" || a.severity === filterSeverity)
    .sort((a, b) => {
      if (sortBy === "severity")
        return (
          (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0)
        );
      if (sortBy === "year") return b.year_detected - a.year_detected;
      if (sortBy === "deviation")
        return Math.abs(b.deviation_percent) - Math.abs(a.deviation_percent);
      return 0;
    });

  const pageData = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const countBySeverity = (s) =>
    anomalies.filter((a) => a.severity === s).length;

  const getBadgeStyle = (severity) => {
    switch (severity) {
      case "Critical":
        return "text-audit-critical border-audit-critical" + " " + "style-bg" /* will be handled via inline style below */;
      case "High":
        return "text-audit-high border-audit-high";
      case "Medium":
        return "text-audit-medium border-audit-medium";
      case "Low":
        return "text-audit-low border-audit-low";
      default:
        return "text-slate-400 border-slate-500";
    }
  };
  
  const getBadgeBg = (severity) => {
    switch (severity) {
      case "Critical": return "#2a0a0a";
      case "High": return "#2a1600";
      case "Medium": return "#2a2200";
      case "Low": return "#0a2a11";
      default: return "#1c1c1c";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 flex-wrap">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2" style={{ color: '#ffffff' }}>
            <span style={{ color: '#06b6d4' }}>■</span> Anomalies Detected
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Critical", "High", "Medium", "Low"].map((s) => (
              <span
                key={s}
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(s)}`}
                style={{ background: getBadgeBg(s) }}
              >
                {countBySeverity(s)} {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            style={{ background: '#111111', borderColor: '#1c1c1c', color: '#d1d5db' }}
          >
            <option value="severity">Sort: Severity</option>
            <option value="year">Sort: Year</option>
            <option value="deviation">Sort: Deviation %</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => {
              setFilterSeverity(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            style={{ background: '#111111', borderColor: '#1c1c1c', color: '#d1d5db' }}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center p-12 flex flex-col items-center gap-4 border rounded-xl" style={{ borderColor: '#1c1c1c' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p className="text-base font-medium" style={{ color: '#d1d5db' }}>
            No significant anomalies detected. Company appears financially
            healthy.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl pt-2">
            <table className="w-full border-collapse text-sm text-left">
              <thead className="text-[10px] uppercase tracking-widest text-left" style={{ color: '#64748b' }}>
                <tr>
                  <th className="px-5 py-4 font-bold">Metric</th>
                  <th className="px-5 py-4 font-bold">Year</th>
                  <th className="px-5 py-4 font-bold">Deviation</th>
                  <th className="px-5 py-4 font-bold">Severity</th>
                  <th className="px-5 py-4 font-bold">Description</th>
                </tr>
              </thead>
              <tbody style={{ background: 'transparent' }}>
                {pageData.map((anomaly, i) => {
                  const color = RISK_COLORS[anomaly.severity] || "#FF9800";
                  return (
                    <tr
                      key={anomaly.id ?? i}
                      className="transition-colors duration-150"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#0a0a0a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-5 py-4 align-top min-w-[200px]">
                        <span className="font-semibold text-slate-200 block">
                          {anomaly.metric}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top font-mono font-bold text-audit-accent whitespace-nowrap">
                        {anomaly.year_detected}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`font-mono font-bold whitespace-nowrap ${anomaly.deviation_percent > 0 ? "text-red-400" : "text-green-500"}`}
                        >
                          {anomaly.deviation_percent > 0 ? "+" : ""}
                          {anomaly.deviation_percent}%
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap"
                          style={{
                            color,
                            borderColor: color,
                            backgroundColor: `${color}15`,
                          }}
                        >
                          {anomaly.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top max-w-sm">
                        <p className="text-slate-300 leading-relaxed mb-1">
                          {anomaly.description}
                        </p>
                        {anomaly.vs_peer_context && (
                          <p className="text-slate-500 text-xs leading-relaxed italic mb-2">
                            {anomaly.vs_peer_context}
                          </p>
                        )}
                        {anomaly.filing_reference && (
                          <div className="inline-flex items-center gap-1.5 px-2 rounded mt-1 shadow-sm" style={{ background: '#111111', border: '1px solid #222222', paddingBottom: '3px', paddingTop: '3px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span className="text-[10px] font-mono tracking-wide" style={{ color: '#9ca3af' }}>
                              {anomaly.filing_reference}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#0a0a0a', color: '#94a3b8' }}
                onMouseEnter={(e) => { if (page !== 0) { e.currentTarget.style.color = '#38bdf8'; } }}
                onMouseLeave={(e) => { if (page !== 0) { e.currentTarget.style.color = '#94a3b8'; } }}
              >
                ← Prev
              </button>
              <span className="text-sm font-medium text-slate-400">
                Page {page + 1} / {totalPages}{" "}
                <span className="opacity-60 ml-1">
                  ({filtered.length} anomalies)
                </span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#0a0a0a', color: '#94a3b8' }}
                onMouseEnter={(e) => { if (page < totalPages - 1) { e.currentTarget.style.color = '#38bdf8'; } }}
                onMouseLeave={(e) => { if (page < totalPages - 1) { e.currentTarget.style.color = '#94a3b8'; } }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
