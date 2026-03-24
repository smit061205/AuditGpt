const SEVERITY_LEVELS = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

const RISK_SCORES = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const FRAUD_PATTERNS = [
  "Revenue growing rapidly while cash flow declines (Satyam 2008)",
  "Related party transactions growing faster than core business (IL&FS)",
  "Auditor language becoming increasingly hedged/qualified",
  "Debt being restructured into creative/complex instruments",
  "Asset quality deteriorating while reported profitability stays stable",
  "Large one-time gains masking operating losses",
  "Increasing related party transactions with vague explanations",
  "Auditor rotation or change in opinion",
];

const INDUSTRY_SECTORS = {
  62: "IT Services",
  64: "Banking & Financial Services",
  41: "Construction",
  65: "Insurance",
  66: "Housing Finance",
  45: "Manufacturing",
  49: "Infrastructure",
  47: "Retail",
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const ERROR_MESSAGES = {
  COMPANY_NOT_FOUND:
    "Company not found. Try: Satyam, Reliance, TCS, HDFC Bank, Infosys",
  ANALYSIS_TIMEOUT: "Analysis timed out after 90 seconds. Please try again.",
  CLAUDE_UNAVAILABLE: "AI analysis service temporarily unavailable.",
  INVALID_INPUT: "Please provide a valid company name or CIN.",
  SEBI_UNAVAILABLE: "SEBI data source unavailable, using cached data.",
  GENERAL_ERROR: "An error occurred during analysis. Please try again.",
};

const ANALYSIS_TIMEOUT = 150000; // 150 seconds in ms to bypass Google AI Rate limits if triggered
const CLAUDE_MODEL = "claude-opus-4-5";

const MOCK_COMPANIES = [
  "satyam",
  "tcs",
  "tata consultancy",
  "dhfl",
  "il&fs",
  "ilfs",
  "yes bank",
  "infosys",
];

module.exports = {
  SEVERITY_LEVELS,
  RISK_SCORES,
  FRAUD_PATTERNS,
  INDUSTRY_SECTORS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  ANALYSIS_TIMEOUT,
  CLAUDE_MODEL,
  MOCK_COMPANIES,
};
