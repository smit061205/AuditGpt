/**
 * Validates company name or CIN input
 * @param {string} query
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCompanyInput(query) {
  if (!query || typeof query !== "string") {
    return {
      valid: false,
      error: "company_name_or_cin is required and must be a string",
    };
  }
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: "Company name must be at least 2 characters",
    };
  }
  if (trimmed.length > 100) {
    return {
      valid: false,
      error: "Company name must be less than 100 characters",
    };
  }
  return { valid: true };
}

/**
 * Validates metrics object has required fields
 * @param {object} metrics
 * @returns {{ valid: boolean, missingFields: string[] }}
 */
function validateMetrics(metrics) {
  const required = ["totalAssets", "revenue", "netIncome"];
  const missingFields = required.filter(
    (f) => metrics[f] === undefined || metrics[f] === null,
  );
  return { valid: missingFields.length === 0, missingFields };
}

/**
 * Validates benchmarks object
 * @param {object} benchmarks
 * @returns {{ valid: boolean }}
 */
function validateBenchmarks(benchmarks) {
  if (!benchmarks || typeof benchmarks !== "object") return { valid: false };
  return { valid: Object.keys(benchmarks).length > 0 };
}

module.exports = { validateCompanyInput, validateMetrics, validateBenchmarks };
