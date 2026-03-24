import { RISK_COLORS, RISK_BG_COLORS } from "../../constants/config";

export default function FraudScoreCard({ fraudRisk }) {
  if (!fraudRisk) return null;

  const score = fraudRisk.fraud_risk_score || "Medium";
  const likelihood = fraudRisk.fraud_likelihood_0_to_1 || 0;
  const color = RISK_COLORS[score] || "#FF9800";
  const bgColor = RISK_BG_COLORS[score] || "#FFF3E0";

  const ScoreIcon = ({ color }) => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px ${color}40)` }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      {score === 'Critical' || score === 'High' ? (
        <path d="M12 8v4" strokeWidth="2"></path>
      ) : (
        <path d="M9 12l2 2 4-4" strokeWidth="2"></path>
      )}
      {score === 'Critical' || score === 'High' ? (
        <path d="M12 16h.01" strokeWidth="3"></path>
      ) : null}
    </svg>
  );

  return (
    <div
      className="flex flex-col rounded-2xl border border-[#1c1c1c] overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Top Section: Score Header */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 border-b border-[#1c1c1c]" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-6">
          <ScoreIcon color={color} />
          <div className="text-left">
            <div
              className="font-display text-4xl font-black tracking-tight leading-none"
              style={{ color }}
            >
              {score}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-[0.2em] mt-2 font-bold">
              Fraud Risk Level
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 mt-6 md:mt-0">
          <div className="flex justify-between text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">
            <span>Fraud Likelihood</span>
            <span className="font-mono" style={{ color }}>
              {(likelihood * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#1c1c1c' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${likelihood * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>

      {/* Middle Section: Assessment */}
      <div className="p-6 md:p-8 border-b border-[#1c1c1c]">
        <h3 className="font-display font-semibold text-lg mb-3 tracking-tight flex items-center gap-2" style={{ color: '#e2e8f0' }}>
          <span style={{ color: color }}>■</span> Assessment
        </h3>
        <p className="text-[15px] text-slate-300 leading-relaxed">
          {fraudRisk.reasoning}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {fraudRisk.top_risk_factors?.length > 0 && (
          <div className="p-6 md:p-8 md:border-r border-b md:border-none border-[#1c1c1c]">
            <h3 className="font-display font-semibold text-base mb-4 tracking-tight flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <span style={{ color: color }}>■</span> Top Risk Factors
            </h3>
            <ul className="flex flex-col gap-3 text-[15px] text-slate-300">
              {fraudRisk.top_risk_factors.map((factor, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1" style={{ color }}>•</span>
                  <span className="leading-relaxed">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fraudRisk.matched_fraud_patterns?.length > 0 && (
          <div className="p-6 md:p-8">
            <h3 className="font-display font-semibold text-base mb-4 tracking-tight flex items-center gap-2" style={{ color: '#e2e8f0' }}>
              <span style={{ color: color }}>■</span> Matched Patterns
            </h3>
            <div className="flex flex-wrap gap-2">
              {fraudRisk.matched_fraud_patterns.map((p, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-md text-[11px] font-mono tracking-wide"
                  style={{ background: '#0a0a0a', color: '#9ca3af', border: '1px solid #1c1c1c' }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Bottom Bar */}
      {fraudRisk.recommendation && (
        <div className="p-6 border-t border-[#1c1c1c]" style={{ background: '#0a0a0a' }}>
          <h3 className="font-display font-semibold text-base mb-3 tracking-tight flex items-center gap-2" style={{ color: '#e2e8f0' }}>
            <span style={{ color: '#38bdf8' }}>■</span> Action Required
          </h3>
          <p className="text-[15px] text-slate-300 leading-relaxed">
            {fraudRisk.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
