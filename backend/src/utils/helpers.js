/**
 * Parse a number from various string formats (Indian and Western)
 * @param {string|number} value
 * @returns {number}
 */
function parseNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = String(value).replace(/[₹$,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Safe division that handles divide-by-zero
 * @param {number} numerator
 * @param {number} denominator
 * @returns {number|null}
 */
function safeDivide(numerator, denominator) {
  if (!denominator || denominator === 0) return null;
  return numerator / denominator;
}

/**
 * Calculate percentage change
 * @param {number} current
 * @param {number} previous
 * @returns {number|null}
 */
function percentChange(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate median of an array of numbers
 * @param {number[]} arr
 * @returns {number}
 */
function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate mean of an array
 * @param {number[]} arr
 * @returns {number}
 */
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate standard deviation
 * @param {number[]} arr
 * @returns {number}
 */
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squaredDiffs = arr.map((x) => Math.pow(x - avg, 2));
  return Math.sqrt(mean(squaredDiffs));
}

/**
 * Get percentile value from array
 * @param {number[]} arr
 * @param {number} p - percentile (0-100)
 * @returns {number}
 */
function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return lower === upper
    ? sorted[lower]
    : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

module.exports = {
  parseNumber,
  safeDivide,
  percentChange,
  clamp,
  median,
  mean,
  stdDev,
  percentile,
};
