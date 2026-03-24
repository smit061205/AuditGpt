import { Link } from "react-router-dom";
import { formatPercentage } from "../../utils/formatters";

const METRICS_CONFIG = [
  {
    key: "debtToEquity",
    label: "Debt/Equity",
    type: "lower-better",
    fmt: (v) => v?.toFixed(2) || "N/A",
  },
  {
    key: "revenueGrowth",
    label: "Revenue Growth",
    type: "higher-better",
    fmt: (v) => (v != null ? `${(v * 100).toFixed(1)}%` : "N/A"),
  },
  {
    key: "profitMargin",
    label: "Profit Margin",
    type: "higher-better",
    fmt: (v) => (v != null ? `${(v * 100).toFixed(1)}%` : "N/A"),
  },
  {
    key: "operatingCFtoRevenue",
    label: "CF/Revenue",
    type: "higher-better",
    fmt: (v) => (v != null ? `${(v * 100).toFixed(1)}%` : "N/A"),
  },
  {
    key: "roe",
    label: "ROE",
    type: "higher-better",
    fmt: (v) => (v != null ? `${(v * 100).toFixed(1)}%` : "N/A"),
  },
  {
    key: "currentRatio",
    label: "Current Ratio",
    type: "higher-better",
    fmt: (v) => v?.toFixed(2) || "N/A",
  },
];

function getCellClass(targetVal, medianVal, type) {
  if (targetVal == null || medianVal == null) return "";
  const isAbove = targetVal > medianVal;
  if (type === "higher-better")
    return isAbove ? "text-green-500" : "text-red-500";
  if (type === "lower-better")
    return isAbove ? "text-red-500" : "text-green-500";
  return "";
}

export default function PeerComparisonTable({ peers }) {
  if (!peers) return null;
  const {
    target_company_latest: target = {},
    peer_companies: peerCompanies = [],
    benchmarks = {},
  } = peers;

  return (
    <div className="flex flex-col gap-4">
      {peerCompanies.length === 0 ? (
        <p className="text-slate-400 text-sm">
          No peer comparison data available.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full border-collapse text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-left" style={{ color: '#64748b' }}>
                <tr>
                  <th className="px-4 py-4 font-bold">
                    Metric
                  </th>
                  <th className="px-4 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#94a3b8' }}>
                    Target Co.
                  </th>
                  {peerCompanies.slice(0, 5).map((p) => (
                    <th
                      key={p.id}
                      className="px-4 py-4 text-right font-bold whitespace-nowrap"
                    >
                      <Link 
                        to={`/?q=${p.id}`} 
                        className="hover:text-cyan-400 transition-colors"
                        style={{ color: '#38bdf8', textDecoration: 'none' }}
                        title={`Analyze ${p.name}`}
                      >
                        {p.name !== p.id ? p.name : p.id}
                      </Link>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-right font-bold whitespace-nowrap">
                    Peer Median
                  </th>
                  <th className="px-4 py-4 text-right font-bold whitespace-nowrap">
                    vs. Median
                  </th>
                </tr>
              </thead>
              <tbody style={{ background: 'transparent' }}>
                {METRICS_CONFIG.map((metric) => {
                  const targetVal =
                    target[metric.key] ??
                    target[metric.key.replace("CF", "cashFlow")];
                  const median = benchmarks[metric.key]?.median;
                  const deviation =
                    targetVal != null && median != null && median !== 0
                      ? (
                          ((targetVal - median) / Math.abs(median)) *
                          100
                        ).toFixed(1)
                      : null;
                  const cellClass = getCellClass(
                    targetVal,
                    median,
                    metric.type,
                  );

                  return (
                    <tr
                      key={metric.key}
                      className="transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#111111'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3 text-left font-medium" style={{ color: '#cbd5e1' }}>
                        {metric.label}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold font-mono whitespace-nowrap ${cellClass || "text-slate-300"}`}
                      >
                        {metric.fmt(targetVal)}
                      </td>
                      {peerCompanies.slice(0, 5).map((p) => (
                        <td
                          key={p.id}
                          className="px-4 py-3 text-right font-mono whitespace-nowrap"
                          style={{ color: '#64748b' }}
                        >
                          {metric.fmt((p.metrics || {})[metric.key])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap" style={{ color: '#475569' }}>
                        {metric.fmt(median)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold font-mono whitespace-nowrap ${deviation > 0 ? "text-red-400" : deviation < 0 ? "text-green-500" : ""}`}
                        style={{ color: deviation === 0 ? '#64748b' : undefined }}
                      >
                        {deviation != null
                          ? `${deviation > 0 ? "+" : ""}${deviation}%`
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-4" style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Favorable vs peers</span>
            </span>
            <span style={{ color: '#1c1c1c' }}>|</span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Unfavorable vs peers</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
