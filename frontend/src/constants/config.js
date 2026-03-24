export const API_BASE_URL =
  import.meta.env.MODE === 'production' 
    ? '' 
    : (import.meta.env.VITE_API_URL || "http://localhost:5001");

export const API_ENDPOINTS = {
  ANALYZE: "/api/analyze",
  HEALTH: "/health",
};

export const TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT) || 90000;

export const DEMO_COMPANIES = [
  "Satyam",
  "TCS",
  "DHFL",
  "IL&FS",
  "Yes Bank",
  "Infosys",
];

export const RISK_COLORS = {
  Low: "#4CAF50",
  Medium: "#FF9800",
  High: "#F44336",
  Critical: "#8B0000",
};

export const RISK_BG_COLORS = {
  Low: "#E8F5E9",
  Medium: "#FFF3E0",
  High: "#FFEBEE",
  Critical: "#FCE4EC",
};
