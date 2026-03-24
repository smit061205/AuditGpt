const { createLogger } = require("../utils/logger");
const { median, mean, stdDev, percentile } = require("../utils/helpers");

const logger = createLogger("PeerBenchmark");

/**
 * Industry-specific healthy ratio ranges.
 * Prevents a car-maker from being judged against IT firm norms.
 */
const SECTOR_BENCHMARKS = {
  "Auto Manufacturers": {
    debtToEquity:        { median: 1.5,  p25: 0.8,  p75: 2.5,  healthyRange: "0.5-3.0" },
    revenueGrowth:       { median: 0.08, p25: 0.02, p75: 0.18, healthyRange: "2%-18%" },
    profitMargin:        { median: 0.04, p25: 0.01, p75: 0.10, healthyRange: "1%-10%" },
    operatingCFtoRevenue:{ median: 0.08, p25: 0.03, p75: 0.14, healthyRange: "3%-14%" },
    roe:                 { median: 0.12, p25: 0.05, p75: 0.22, healthyRange: "5%-22%" },
    currentRatio:        { median: 1.2,  p25: 0.9,  p75: 1.6,  healthyRange: "0.9-1.8" },
    assetTurnover:       { median: 0.55, p25: 0.4,  p75: 0.75, healthyRange: "0.4-0.8" },
    cfToRevenue:         { median: 0.07, p25: 0.03, p75: 0.13, healthyRange: "3%-13%" },
  },
  "IT Services": {
    debtToEquity:        { median: 0.1,  p25: 0.0,  p75: 0.3,  healthyRange: "0-0.5" },
    revenueGrowth:       { median: 0.15, p25: 0.08, p75: 0.25, healthyRange: "8%-25%" },
    profitMargin:        { median: 0.20, p25: 0.14, p75: 0.28, healthyRange: "14%-28%" },
    operatingCFtoRevenue:{ median: 0.22, p25: 0.15, p75: 0.30, healthyRange: "15%-30%" },
    roe:                 { median: 0.28, p25: 0.20, p75: 0.38, healthyRange: "20%-38%" },
    currentRatio:        { median: 2.8,  p25: 2.0,  p75: 3.8,  healthyRange: "2.0-4.0" },
    assetTurnover:       { median: 1.0,  p25: 0.8,  p75: 1.3,  healthyRange: "0.7-1.4" },
    cfToRevenue:         { median: 0.18, p25: 0.12, p75: 0.25, healthyRange: "12%-25%" },
  },
  "Banks": {
    debtToEquity:        { median: 8.0,  p25: 5.0,  p75: 12.0, healthyRange: "4-15" },
    revenueGrowth:       { median: 0.10, p25: 0.04, p75: 0.18, healthyRange: "4%-18%" },
    profitMargin:        { median: 0.18, p25: 0.10, p75: 0.28, healthyRange: "10%-28%" },
    operatingCFtoRevenue:{ median: 0.12, p25: 0.05, p75: 0.20, healthyRange: "5%-20%" },
    roe:                 { median: 0.12, p25: 0.06, p75: 0.20, healthyRange: "6%-20%" },
    currentRatio:        { median: 1.0,  p25: 0.8,  p75: 1.3,  healthyRange: "0.8-1.5" },
    assetTurnover:       { median: 0.05, p25: 0.02, p75: 0.09, healthyRange: "0.02-0.12" },
    cfToRevenue:         { median: 0.10, p25: 0.04, p75: 0.18, healthyRange: "4%-20%" },
  },
  "Consumer Electronics": {
    debtToEquity:        { median: 0.5,  p25: 0.2,  p75: 1.0,  healthyRange: "0.1-1.5" },
    revenueGrowth:       { median: 0.07, p25: 0.02, p75: 0.15, healthyRange: "2%-15%" },
    profitMargin:        { median: 0.22, p25: 0.15, p75: 0.30, healthyRange: "10%-30%" },
    operatingCFtoRevenue:{ median: 0.25, p25: 0.18, p75: 0.32, healthyRange: "15%-35%" },
    roe:                 { median: 0.35, p25: 0.25, p75: 0.50, healthyRange: "20%-55%" },
    currentRatio:        { median: 1.1,  p25: 0.9,  p75: 1.5,  healthyRange: "0.8-2.0" },
    assetTurnover:       { median: 1.0,  p25: 0.7,  p75: 1.3,  healthyRange: "0.6-1.5" },
    cfToRevenue:         { median: 0.22, p25: 0.16, p75: 0.30, healthyRange: "12%-32%" },
  },
};

const GENERIC_DEFAULTS = {
  debtToEquity:        { median: 0.6,  p25: 0.2,  p75: 1.2,  healthyRange: "0.2-1.5" },
  revenueGrowth:       { median: 0.10, p25: 0.04, p75: 0.20, healthyRange: "4%-20%" },
  profitMargin:        { median: 0.12, p25: 0.06, p75: 0.22, healthyRange: "5%-25%" },
  operatingCFtoRevenue:{ median: 0.13, p25: 0.07, p75: 0.22, healthyRange: "5%-22%" },
  roe:                 { median: 0.15, p25: 0.08, p75: 0.28, healthyRange: "8%-28%" },
  currentRatio:        { median: 1.8,  p25: 1.2,  p75: 2.5,  healthyRange: "1.0-3.0" },
  assetTurnover:       { median: 0.85, p25: 0.6,  p75: 1.2,  healthyRange: "0.5-1.5" },
  cfToRevenue:         { median: 0.12, p25: 0.06, p75: 0.20, healthyRange: "5%-20%" },
};

/** Map an arbitrary industry string to the nearest sector bucket */
function matchSector(industry) {
  if (!industry) return null;
  const lower = industry.toLowerCase();
  if (lower.includes("auto") || lower.includes("vehicle") || lower.includes("electric")) return "Auto Manufacturers";
  if (lower.includes("bank") || lower.includes("financial") || lower.includes("insurance") || lower.includes("nbfc")) return "Banks";
  if (lower.includes("consumer") || lower.includes("electronics") || lower.includes("hardware")) return "Consumer Electronics";
  if (lower.includes("it") || lower.includes("software") || lower.includes("technology") || lower.includes("tech")) return "IT Services";
  return null;
}

/**
 * Calculate statistical benchmarks from peer companies.
 * Falls back gracefully to sector-aware defaults when peer data is thin.
 */
function calculatePeerBenchmarks(peerCompanies, industry) {
  if (!peerCompanies || peerCompanies.length === 0) {
    logger.warn("No peer companies provided — using sector-specific defaults");
    return getDefaultBenchmarks(industry);
  }

  const metricKeys = [
    "debtToEquity", "revenueGrowth", "profitMargin",
    "operatingCFtoRevenue", "roe", "currentRatio", "assetTurnover", "cfToRevenue",
  ];

  const sectorKey = matchSector(industry);
  const sectorDefaults = sectorKey ? SECTOR_BENCHMARKS[sectorKey] : GENERIC_DEFAULTS;
  const benchmarks = {};

  metricKeys.forEach((key) => {
    const values = peerCompanies
      .map((p) => (p.metrics || {})[key])
      .filter((v) => v !== null && v !== undefined && !isNaN(v) && isFinite(v));

    if (values.length === 0) {
      const sd = sectorDefaults[key] || GENERIC_DEFAULTS[key];
      benchmarks[key] = {
        median: sd.median, mean: sd.median, p25: sd.p25, p75: sd.p75,
        min: sd.p25, max: sd.p75, stdDev: (sd.p75 - sd.p25) / 2,
        healthyRange: sd.healthyRange,
      };
      return;
    }

    const sd = sectorDefaults[key] || GENERIC_DEFAULTS[key];
    benchmarks[key] = {
      median: median(values),
      mean: mean(values),
      p25: percentile(values, 25),
      p75: percentile(values, 75),
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev: stdDev(values),
      healthyRange: sd ? sd.healthyRange : getHealthyRange(key),
    };
  });

  return benchmarks;
}

/**
 * Contextualize an anomaly against peer benchmarks
 */
function contextualizeAnomaly(metric, targetValue, peerBenchmarks, industry) {
  const benchmark = peerBenchmarks[metric];
  if (!benchmark || targetValue == null) {
    return { deviationFromMedian: 0, percentile: 50, severity: "normal", context: `No benchmark data for ${metric}` };
  }

  const deviationFromMedian = benchmark.median !== 0
    ? ((targetValue - benchmark.median) / Math.abs(benchmark.median)) * 100
    : 0;

  const pctRank = targetValue > benchmark.p75 ? 75
    : targetValue > benchmark.median ? 50
    : targetValue > benchmark.p25 ? 25
    : 0;

  const absDeviation = Math.abs(deviationFromMedian);
  const severity = absDeviation > 100 ? "extreme" : absDeviation > 50 ? "unusual" : "normal";

  return {
    deviationFromMedian: Math.round(deviationFromMedian * 10) / 10,
    percentile: pctRank,
    severity,
    context: `${metric}: ${targetValue.toFixed(2)} is ${absDeviation.toFixed(0)}% ${deviationFromMedian > 0 ? "above" : "below"} peer median (${benchmark.median.toFixed(2)}). Healthy range for ${industry}: ${benchmark.healthyRange}. Percentile: ${pctRank}th.`,
  };
}

function getHealthyRange(key) {
  return GENERIC_DEFAULTS[key]?.healthyRange || "N/A";
}

function getDefaultBenchmarks(industry) {
  const sectorKey = matchSector(industry);
  const src = sectorKey ? SECTOR_BENCHMARKS[sectorKey] : GENERIC_DEFAULTS;
  const result = {};
  Object.keys(src).forEach((key) => {
    result[key] = {
      median: src[key].median, mean: src[key].median,
      p25: src[key].p25,      p75: src[key].p75,
      min: src[key].p25,      max: src[key].p75,
      stdDev: (src[key].p75 - src[key].p25) / 2,
      healthyRange: src[key].healthyRange,
    };
  });
  return result;
}

module.exports = { calculatePeerBenchmarks, contextualizeAnomaly, matchSector };
