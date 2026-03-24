/**
 * Format a large number in Indian currency format (crores)
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `₹${(value / 1e12).toFixed(2)}L Cr`;
  if (abs >= 1e9) return `₹${(value / 1e9).toFixed(2)} Bn`;
  if (abs >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * Format a percentage value
 * @param {number} value - decimal value (e.g. 0.15 for 15%)
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return "N/A";
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date to readable string
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncate text to a max length
 * @param {string} text
 * @param {number} length
 * @returns {string}
 */
export function truncateText(text, length = 100) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length) + "..." : text;
}

/**
 * Format number in Indian format
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString("en-IN");
}

/**
 * Format time in ms to human readable
 * @param {number} ms
 * @returns {string}
 */
export function formatTime(ms) {
  if (!ms) return "0s";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
