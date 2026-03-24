const { safeDivide, percentChange } = require("../utils/helpers");
const { createLogger } = require("../utils/logger");

const logger = createLogger("MetricsCalculator");

/**
 * Calculate all financial ratios from raw metrics
 * @param {object} metrics
 * @returns {object}
 */
function calculateRatios(metrics) {
  const {
    netIncome,
    revenue,
    equity,
    totalAssets,
    operatingIncome,
    totalDebt,
    currentAssets,
    currentLiabilities,
    operatingCashFlow,
    freeCashFlow,
    accountsReceivable,
    inventory,
    interestExpense,
  } = metrics;

  return {
    // Profitability
    profitMargin: safeDivide(netIncome, revenue),
    roe: safeDivide(netIncome, equity),
    roa: safeDivide(netIncome, totalAssets),
    operatingMargin: safeDivide(operatingIncome, revenue),

    // Leverage
    debtToEquity: safeDivide(totalDebt, equity),
    debtToAssets: safeDivide(totalDebt, totalAssets),
    equityRatio: safeDivide(equity, totalAssets),
    interestCoverage: safeDivide(operatingIncome, interestExpense || 0),

    // Liquidity
    currentRatio: safeDivide(currentAssets, currentLiabilities),
    quickRatio: safeDivide(
      (currentAssets || 0) - (inventory || 0),
      currentLiabilities,
    ),
    workingCapital: (currentAssets || 0) - (currentLiabilities || 0),

    // Cash Flow Quality (key fraud indicator)
    operatingCFtoRevenue: safeDivide(operatingCashFlow, revenue),
    freeCFtoRevenue: safeDivide(freeCashFlow, revenue),
    operatingCFtoNetIncome: safeDivide(operatingCashFlow, netIncome), // earnings quality ratio

    // Asset Efficiency
    assetTurnover: safeDivide(revenue, totalAssets),
    receivablesDays: accountsReceivable
      ? safeDivide(accountsReceivable * 365, revenue)
      : null,

    // DuPont Analysis
    dupontRoe:
      safeDivide(netIncome, revenue) !== null
        ? (safeDivide(netIncome, revenue) || 0) *
          (safeDivide(revenue, totalAssets) || 0) *
          (safeDivide(totalAssets, equity) || 0)
        : null,
  };
}

/**
 * Calculate year-over-year growth rates
 * @param {object} current - current year metrics
 * @param {object} previous - previous year metrics
 * @returns {object}
 */
function calculateYoYGrowth(current, previous) {
  if (!previous) return null;
  return {
    revenueGrowth: percentChange(current.revenue, previous.revenue),
    netIncomeGrowth: percentChange(current.netIncome, previous.netIncome),
    assetGrowth: percentChange(current.totalAssets, previous.totalAssets),
    debtGrowth: percentChange(current.totalDebt, previous.totalDebt),
    equityGrowth: percentChange(current.equity, previous.equity),
    cashFlowGrowth: percentChange(
      current.operatingCashFlow,
      previous.operatingCashFlow,
    ),
    relatedPartyTxGrowth: percentChange(
      current.relatedPartyTransactions,
      previous.relatedPartyTransactions,
    ),
  };
}

/**
 * Build time-series object from multiple years of metrics
 * @param {Array} metricsHistory - Array of {year, metrics, ratios}
 * @returns {object}
 */
function buildMetricsTimeseries(metricsHistory) {
  const sorted = [...metricsHistory].sort((a, b) => a.year - b.year);

  const years = sorted.map((m) => m.year);
  const metrics = {};
  const ratios = {};
  const growthRates = {};

  // Collect all metric keys
  const metricKeys = [
    "revenue",
    "netIncome",
    "operatingCashFlow",
    "totalDebt",
    "totalAssets",
    "equity",
    "relatedPartyTransactions",
  ];
  const ratioKeys = [
    "debtToEquity",
    "profitMargin",
    "operatingCFtoRevenue",
    "roe",
    "operatingCFtoNetIncome",
    "currentRatio",
  ];

  metricKeys.forEach((key) => {
    metrics[key] = sorted.map((m) => m.metrics[key] || 0);
  });

  ratioKeys.forEach((key) => {
    ratios[key] = sorted.map((m) => (m.ratios || {})[key] || 0);
  });

  // Growth rates (skip first year)
  sorted.forEach((m, i) => {
    if (i === 0) return;
    const growth = calculateYoYGrowth(m.metrics, sorted[i - 1].metrics);
    Object.entries(growth || {}).forEach(([key, val]) => {
      if (!growthRates[key])
        growthRates[key] = new Array(sorted.length).fill(null);
      growthRates[key][i] = val;
    });
  });

  // Trend analysis
  const trends = {};
  metricKeys.forEach((key) => {
    const vals = metrics[key].filter((v) => v !== null && v !== 0);
    if (vals.length < 2) {
      trends[key] = "unknown";
    } else {
      const first = vals[0];
      const last = vals[vals.length - 1];
      if (last > first * 1.1) trends[key] = "increasing";
      else if (last < first * 0.9) trends[key] = "declining";
      else trends[key] = "stable";
    }
  });

  return { years, metrics, ratios, growthRates, trends };
}

module.exports = {
  calculateRatios,
  calculateYoYGrowth,
  buildMetricsTimeseries,
};
