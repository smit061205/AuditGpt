const { createLogger } = require("../utils/logger");

const logger = createLogger("ReportGenerator");

/**
 * Generate the final analysis report combining all data
 */
function generateReport(
  company,
  metricsHistory,
  peers,
  anomalyData,
  fraudScore,
  sentiment,
) {
  logger.info(`Generating report for ${company.name}`);

  const anomalies = (anomalyData?.anomalies || []).map((a, idx) => ({
    id: idx,
    metric: a.metric || "Unknown Metric",
    year_detected: a.year_detected || 0,
    deviation_percent: a.deviation_percent || 0,
    severity: a.severity || "Medium",
    description: a.description || "No description",
    vs_peer_context: a.vs_peer_context || "",
    filing_reference:
      a.filing_reference || `${a.year_detected || ""} Annual Report`,
    severity_explanation: getSeverityExplanation(a.severity),
  }));

  // Sort anomalies by severity
  const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  anomalies.sort(
    (a, b) =>
      (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0),
  );

  // Build peer comparison
  const latestMetrics =
    (metricsHistory[metricsHistory.length - 1] || {}).metrics || {};
  const peerComparison = {
    target_company_latest: {
      debtToEquity:
        latestMetrics.totalDebt && latestMetrics.equity
          ? latestMetrics.totalDebt / latestMetrics.equity
          : 0,
      revenueGrowth:
        metricsHistory.length >= 2
          ? (metricsHistory[metricsHistory.length - 1].metrics.revenue -
              metricsHistory[metricsHistory.length - 2].metrics.revenue) /
            (metricsHistory[metricsHistory.length - 2].metrics.revenue || 1)
          : 0,
      profitMargin: latestMetrics.revenue
        ? (latestMetrics.netIncome || 0) / latestMetrics.revenue
        : 0,
      operatingCFtoRevenue: latestMetrics.revenue
        ? (latestMetrics.operatingCashFlow || 0) / latestMetrics.revenue
        : 0,
      cfToRevenue: latestMetrics.revenue
        ? (latestMetrics.operatingCashFlow || 0) / latestMetrics.revenue
        : 0,
      roe: latestMetrics.equity
        ? (latestMetrics.netIncome || 0) / latestMetrics.equity
        : 0,
    },
    peer_companies: peers.map((p) => ({
      id: p.id,
      name: p.name,
      industry: p.industry,
      metrics: p.metrics || {},
    })),
    benchmarks: peers.length > 0 ? buildBenchmarks(peers) : {},
  };

  // Auditor notes timeline for sentiment
  const auditorNotesList = metricsHistory.map((m) => ({
    year: m.year,
    auditorNotes: m.auditorNotes || {},
    hedgingScore: (m.auditorNotes || {}).hedgingScore || 0.05,
    qualification: (m.auditorNotes || {}).qualificationType || "unqualified",
  }));

  return {
    metadata: {
      company_name: company.name,
      cin: company.cin || "N/A",
      industry: company.industry || "N/A",
      analysis_date: new Date().toISOString(),
      data_quality_score: computeDataQuality(metricsHistory),
      execution_time_ms: 0, // Set by caller
    },

    fraud_risk_assessment: {
      fraud_risk_score: fraudScore?.fraud_risk_score || "Medium",
      fraud_likelihood_0_to_1: fraudScore?.fraud_likelihood_0_to_1 || 0.3,
      reasoning: fraudScore?.reasoning || "Analysis completed",
      top_risk_factors: fraudScore?.top_risk_factors || [],
      matched_fraud_patterns: fraudScore?.matched_fraud_patterns || [],
      recommendation: fraudScore?.recommendation || "Monitor closely",
    },

    anomalies,

    metrics_history: metricsHistory.map((m) => ({
      year: m.year,
      metrics: m.metrics || {},
      ratios: m.ratios || {},
      source: m.source || "mock",
    })),

    peer_comparison: peerComparison,

    auditor_sentiment_trend: sentiment || {
      sentiment_trend: auditorNotesList.map((n) => ({
        year: n.year,
        sentiment:
          n.hedgingScore > 0.5
            ? "concerned"
            : n.hedgingScore > 0.2
              ? "hedged"
              : "confident",
        hedging_score: n.hedgingScore,
        key_phrases: (n.auditorNotes || {}).keyPhrases || [],
        summary: ((n.auditorNotes || {}).fullText || "").slice(0, 100),
      })),
      trend_summary: "Auditor sentiment analysis from structured data",
      concern_escalation: "See individual year data",
    },

    summary: {
      anomaly_count: anomalies.length,
      critical_flags: anomalies.filter((a) => a.severity === "Critical").length,
      high_flags: anomalies.filter((a) => a.severity === "High").length,
      overall_health_assessment: fraudScore?.overall_health_assessment || getHealthAssessment(fraudScore?.fraud_risk_score),
    },
  };
}

function getSeverityExplanation(severity) {
  const explanations = {
    Critical:
      "Extreme deviation from norms, matches known fraud patterns. Immediate investigation recommended.",
    High: "Significant deviation that warrants close monitoring and detailed review.",
    Medium: "Noteworthy deviation that should be tracked over time.",
    Low: "Minor deviation within acceptable bounds, but worth monitoring.",
  };
  return explanations[severity] || "Unknown severity level.";
}

function getHealthAssessment(score) {
  const assessments = {
    Critical:
      "Company shows multiple critical fraud indicators. Historical analysis reveals patterns consistent with major corporate fraud cases.",
    High: "Company exhibits significant financial anomalies that require immediate detailed investigation.",
    Medium:
      "Company shows some concerning trends that warrant enhanced monitoring.",
    Low: "Company appears financially healthy with no major fraud indicators detected.",
  };
  return assessments[score] || "Risk assessment pending.";
}

function computeDataQuality(metricsHistory) {
  if (!metricsHistory || metricsHistory.length === 0) return 0;
  const withRevenue = metricsHistory.filter(
    (m) => m.metrics && m.metrics.revenue,
  ).length;
  return Math.round((withRevenue / metricsHistory.length) * 100) / 100;
}

function buildBenchmarks(peers) {
  const keys = [
    "debtToEquity",
    "profitMargin",
    "operatingCFtoRevenue",
    "roe",
    "currentRatio",
    "cfToRevenue",
    "revenueGrowth",
  ];
  const benchmarks = {};
  keys.forEach((key) => {
    const values = peers
      .map((p) => (p.metrics || {})[key])
      .filter((v) => v !== null && v !== undefined);
    if (!values.length) return;
    const sorted = [...values].sort((a, b) => a - b);
    benchmarks[key] = {
      median: sorted[Math.floor(sorted.length / 2)],
      mean: values.reduce((s, v) => s + v, 0) / values.length,
      p25: sorted[Math.floor(sorted.length * 0.25)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
  return benchmarks;
}

module.exports = { generateReport };
