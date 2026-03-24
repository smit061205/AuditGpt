# AuditGPT - BACKEND ROADMAP FOR AI DEVELOPMENT

## 📋 OVERVIEW

**Tech Stack:**
- Runtime: Node.js (v18+)
- Framework: Express.js
- Language: JavaScript
- LLM Integration: Anthropic Claude API (claude-sonnet-4-20250514)
- PDF Processing: pdf-parse, axios
- Data Source: SEBI/MCA Public APIs (with web scraping fallback)
- Environment: dotenv
- Optional DB: Redis (caching), PostgreSQL (future)

**File Structure to Generate:**
```
backend/
├── src/
│   ├── app.js                          # Express app setup
│   ├── server.js                       # Entry point
│   ├── config/
│   │   ├── env.js                      # Environment variables
│   │   └── constants.js                # App constants
│   ├── routes/
│   │   ├── index.js                    # Route aggregator
│   │   └── analyze.js                  # POST /api/analyze endpoint
│   ├── services/
│   │   ├── sebi-fetcher.js             # SEBI/MCA data fetching
│   │   ├── pdf-parser.js               # PDF extraction & parsing
│   │   ├── metrics-calculator.js       # Financial ratios & calculations
│   │   ├── peer-benchmark.js           # Industry peer lookup & benchmarking
│   │   ├── claude-ai.js                # Claude API integration (3-turn prompting)
│   │   ├── report-generator.js         # Final report synthesis
│   │   └── cache-manager.js            # Optional: Cache layer
│   ├── utils/
│   │   ├── logger.js                   # Logging utility
│   │   ├── error-handler.js            # Error handling middleware
│   │   ├── validators.js               # Input validation
│   │   └── helpers.js                  # Utility functions
│   ├── models/
│   │   ├── company.js                  # Company data model
│   │   ├── filing.js                   # Filing data model
│   │   └── report.js                   # Report data model
│   └── mock-data/
│       ├── satyam-filings.js           # Satyam test data
│       ├── tcs-filings.js              # TCS test data
│       └── peers-db.js                 # Peer companies database
├── .env.example                        # Environment template
├── .env                               # (To be created locally)
├── package.json                       # Dependencies
├── README.md                          # Setup instructions
└── .gitignore                         # Git ignore rules
```

---

## 🔧 PHASE 1: PROJECT INITIALIZATION

### 1.1 Package.json Dependencies
**AI Instruction:** Generate a `package.json` with all necessary dependencies:

```
Required Production Dependencies:
- express: ^4.18.0
- dotenv: ^16.0.0
- axios: ^1.4.0
- pdf-parse: ^1.1.1
- @anthropic-ai/sdk: ^0.9.0
- cors: ^2.8.5
- morgan: ^1.10.0
- uuid: ^9.0.0

Required Dev Dependencies:
- nodemon: ^3.0.0
- jest: ^29.0.0
- eslint: ^8.0.0

Scripts to include:
- start: "node src/server.js"
- dev: "nodemon src/server.js"
- test: "jest"
- test:watch: "jest --watch"
```

### 1.2 Environment Configuration (`src/config/env.js`)
**AI Instruction:** Generate env.js that loads and validates:

```
Variables to load:
- ANTHROPIC_API_KEY (required)
- PORT (default: 5000)
- NODE_ENV (development | production)
- SEBI_API_BASE_URL (optional, with fallback)
- LOG_LEVEL (debug | info | warn | error)
- CACHE_ENABLED (true | false)
- DEMO_MODE (for testing with mock data)

Validation:
- Throw error if ANTHROPIC_API_KEY is missing
- Log warnings for optional variables
- Export as object with all config values
```

### 1.3 Constants File (`src/config/constants.js`)
**AI Instruction:** Generate constants.js with:

```
Export these constant objects:
- SEVERITY_LEVELS: { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }
- RISK_SCORES: { LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" }
- FRAUD_PATTERNS: Array of known fraud precursor descriptions
- INDUSTRY_SECTORS: Mapping of NACE codes to sector names
- HTTP_STATUS: { OK: 200, CREATED: 201, BAD_REQUEST: 400, etc }
- ERROR_MESSAGES: Object with error message templates
- ANALYSIS_TIMEOUT: 90000 (90 seconds in ms)
- CLAUDE_MODEL: "claude-sonnet-4-20250514"
```

---

## 🚀 PHASE 2: CORE SERVICES

### 2.1 SEBI Fetcher Service (`src/services/sebi-fetcher.js`)

**AI Instruction:** Create a class-based service with these methods:

#### Method: `searchCompany(query)`
```
Input: query (string - company name or CIN)

Process:
1. Try SEBI website search API:
   - URL: https://www.mca.gov.in/mcaserver/company/companysearch
   - Method: GET with params: { searchType: 'BY_NAME', searchValue: query }
   - Parse HTML response using cheerio to extract company data

2. If SEBI API fails or returns empty:
   - Check mock database (satyam, tcs, dhfl, infosys, yes-bank, il&fs)
   - Return mock company object

3. Return object with properties:
   {
     id: string (company ID/CIN),
     name: string,
     cin: string,
     industry: string,
     category: string,
     status: string (active/inactive)
   }

Error Handling:
- Catch network errors, log them
- Always fall back to mock database
- Never throw error - return fallback or empty result
```

#### Method: `fetchFilingsByYear(companyId, startYear, endYear)`
```
Input: companyId (string), startYear (number), endYear (number)

Process:
1. Loop through each year from startYear to endYear
2. For each year, attempt to fetch:
   - Balance Sheet PDF URL
   - P&L Statement PDF URL
   - Cash Flow Statement PDF URL
   - Auditor Notes/Opinion PDF URL
   - Management Discussion & Analysis (text or PDF)

3. Fetching strategy (in priority order):
   a) Try SEBI direct API
   b) Try web scraping from mca.gov.in
   c) Return mock filing data if available
   d) Skip year and continue

4. Return array of filing objects:
   [{
     year: number,
     companyId: string,
     balanceSheetPdf: string (URL or base64),
     plPdf: string,
     cashFlowPdf: string,
     auditorNotesPdf: string,
     mdaText: string,
     fetchedAt: timestamp,
     source: "sebi" | "scrape" | "mock"
   }, ...]

Error Handling:
- Log each failed year fetch
- Skip years without data
- Return whatever was successfully fetched
```

#### Method: `getIndustryClassification(companyId)`
```
Input: companyId (string)

Process:
1. Look up company in SEBI database
2. Return industry classification:
   {
     naceCode: string,
     sector: string (e.g., "IT Services", "Banking", "Manufacturing"),
     subsector: string,
     companiesInSector: number
   }

Error Handling:
- Return best-guess based on company name
- Default to mock classification if lookup fails
```

#### Method: `getPeerCompanies(naceCode, companyRevenue)`
```
Input: naceCode (string), companyRevenue (number)

Process:
1. Query peer database for companies with same NACE code
2. Filter by revenue size (±50% of target company)
3. Return top 5-10 companies

Return array:
[{
  id: string,
  name: string,
  naceCode: string,
  latestRevenue: number,
  latestYear: number,
  marketCap: number (if available)
}, ...]

Error Handling:
- Return empty array if no peers found
- Use mock peers database as fallback
```

#### Method: `getMockCompany(query)`
```
Input: query (string)

Database to include:
- Satyam (fraud case, IT Services)
- Tata Consultancy Services / TCS (healthy, IT Services)
- Infosys (healthy, IT Services)
- DHFL (debt fraud, Housing Finance)
- IL&FS (leverage fraud, Infrastructure)
- Yes Bank (liquidity crisis, Banking)

Return matching company object or throw error
```

### 2.2 PDF Parser Service (`src/services/pdf-parser.js`)

**AI Instruction:** Create a class with these methods:

#### Method: `parseFilings(filing)`
```
Input: filing object with PDF URLs/buffers

Process:
1. Call parseBalanceSheet() if balanceSheetPdf provided
2. Call parseProfitLoss() if plPdf provided
3. Call parseCashFlow() if cashFlowPdf provided
4. Call extractAuditorNotes() if auditorNotesPdf provided
5. Combine all metrics into single object

Return:
{
  year: number,
  metrics: {
    // From Balance Sheet
    totalAssets: number,
    totalLiabilities: number,
    equity: number,
    shortTermDebt: number,
    longTermDebt: number,
    totalDebt: number,
    
    // From P&L
    revenue: number,
    operatingIncome: number,
    netIncome: number,
    taxExpense: number,
    totalExpenses: number,
    
    // From Cash Flow
    operatingCashFlow: number,
    investingCashFlow: number,
    financingCashFlow: number,
    freeCashFlow: number,
    cashAndEquivalents: number,
    
    // Related Party Transactions (from various statements)
    relatedPartyTransactions: number
  },
  auditorNotes: {
    fullText: string,
    hasQualification: boolean,
    hasReservations: boolean,
    qualificationType: string // "none" | "qualified" | "adverse"
  },
  confidence: number // 0-1 rating of data extraction quality
}

Error Handling:
- Return partial data if some PDFs fail
- Never throw error, always return something
- Log extraction confidence issues
```

#### Method: `parseBalanceSheet(pdfUrl or Buffer)`
```
Extract and return:
{
  totalAssets: number,
  totalLiabilities: number,
  equity: number,
  currentAssets: number,
  currentLiabilities: number,
  longTermDebt: number,
  shortTermDebt: number,
  totalDebt: number,
  reserves: number,
  retainedEarnings: number
}

Extraction Strategy:
1. Download PDF if URL provided
2. Use pdf-parse to extract text
3. Use regex patterns to find key figures:
   - "Total Assets" / "Assets" patterns
   - "Total Liabilities" / "Liabilities"
   - "Equity" / "Shareholders' Equity"
   - "Debt" / "Borrowings"
4. Parse numbers (handle different formats: 1,00,00,000 or 100,000,000)
5. Return extracted values
```

#### Method: `parseProfitLoss(pdfUrl or Buffer)`
```
Extract and return:
{
  revenue: number,
  operatingIncome: number,
  netIncome: number,
  taxExpense: number,
  totalExpenses: number,
  costOfGoodsSold: number,
  operatingExpenses: number,
  depreciationAmortization: number,
  interestExpense: number
}

Patterns to match:
- "Revenue from Operations" / "Total Revenue"
- "Operating Profit" / "EBIT"
- "Net Profit" / "Net Income"
- "Income Tax" / "Tax Expense"
- "Total Expenses" / "Operating Expenses"
```

#### Method: `parseCashFlow(pdfUrl or Buffer)`
```
Extract and return:
{
  operatingCashFlow: number,
  investingCashFlow: number,
  financingCashFlow: number,
  freeCashFlow: number,
  changeInCash: number,
  cashAtBeginning: number,
  cashAtEnd: number
}

Patterns:
- "Operating Activities" section
- "Investing Activities" section
- "Financing Activities" section
- "Free Cash Flow" or calculate as Operating - Capital Expenditure
```

#### Method: `extractAuditorNotes(pdfUrl or Buffer)`
```
Extract and return:
{
  fullText: string (complete opinion paragraph),
  hasQualification: boolean,
  hasReservations: boolean,
  qualificationType: string, // "unqualified" | "qualified" | "adverse" | "disclaimer"
  keyPhrases: [string], // e.g., ["unable to obtain", "subject to"]
  hedgingLanguage: [string] // phrases indicating uncertainty
}

Detection logic:
- Search for "Auditors' Opinion" or "Report on Financial Statements"
- Look for keywords:
  - Unqualified: "without qualification", "unmodified opinion"
  - Qualified: "subject to", "except for", "in our opinion"
  - Adverse: "do not present", "contrary to"
  - Disclaimer: "unable to express", "do not express"
```

### 2.3 Metrics Calculator (`src/services/metrics-calculator.js`)

**AI Instruction:** Create utility functions:

#### Function: `calculateRatios(metrics)`
```
Input: Raw metrics object from PDF parser

Calculate and return:
{
  // Profitability Ratios
  profitMargin: netIncome / revenue,
  roe: netIncome / equity,
  roa: netIncome / totalAssets,
  operatingMargin: operatingIncome / revenue,
  
  // Leverage Ratios
  debtToEquity: totalDebt / equity,
  debtToAssets: totalDebt / totalAssets,
  equityRatio: equity / totalAssets,
  interestCoverage: operatingIncome / interestExpense,
  
  // Liquidity Ratios
  currentRatio: currentAssets / currentLiabilities,
  quickRatio: (currentAssets - inventory) / currentLiabilities,
  workingCapital: currentAssets - currentLiabilities,
  
  // Growth Ratios (calculated year-over-year)
  // These need previousYear metrics - see calculateYoYGrowth()
  
  // Cash Flow Ratios
  operatingCFtoRevenue: operatingCashFlow / revenue,
  freeCFtoRevenue: freeCashFlow / revenue,
  operatingCFtoNetIncome: operatingCashFlow / netIncome, // Quality of earnings
  
  // Asset Efficiency
  assetTurnover: revenue / totalAssets,
  receivablesDays: (accountsReceivable / revenue) * 365,
  
  // Dupont Analysis
  dupontRoe: (netIncome / revenue) * (revenue / totalAssets) * (totalAssets / equity)
}

Validation:
- Handle division by zero (return 0 or null)
- Return numeric values only
- Flag calculations with missing inputs
```

#### Function: `calculateYoYGrowth(metricsCurrentYear, metricsPreviousYear)`
```
Input: Current year metrics, previous year metrics

Calculate:
{
  revenueGrowth: (current - previous) / previous,
  netIncomeGrowth: ...,
  assetGrowth: ...,
  debtGrowth: ...,
  equityGrowth: ...,
  cashFlowGrowth: ...,
  relatedPartyTxGrowth: ...
}

Return as percentages (multiply by 100)
```

#### Function: `buildMetricsTimeseries(metricsHistory)`
```
Input: Array of { year, metrics, ratios } objects

Process:
1. Sort by year ascending
2. Calculate YoY growth for each year
3. Calculate moving averages (3-year, 5-year)
4. Identify trend direction (improving/declining)

Return:
{
  years: [2015, 2016, ...],
  metrics: { revenue: [x, y, z], ...},
  ratios: { debtToEquity: [0.5, 0.52, ...], ...},
  growthRates: { revenueGrowth: [0.1, 0.15, ...], ...},
  trends: { revenue: "increasing", debt: "concerning", ...}
}
```

### 2.4 Peer Benchmark Service (`src/services/peer-benchmark.js`)

**AI Instruction:** Create functions:

#### Function: `calculatePeerBenchmarks(peerCompanies)`
```
Input: Array of peer company objects with their latest metrics

Process:
1. For each peer, fetch or use cached latest year metrics
2. For each key metric, calculate:
   - Median
   - Mean
   - 25th percentile
   - 75th percentile
   - Min/Max
   - Standard deviation

Return object:
{
  debtToEquity: {
    median: 0.5,
    mean: 0.52,
    p25: 0.3,
    p75: 0.8,
    min: 0.1,
    max: 1.5,
    stdDev: 0.35,
    healthyRange: "0.2-1.0"
  },
  
  revenueGrowth: {
    median: 0.15,
    mean: 0.16,
    p25: 0.08,
    p75: 0.25,
    ...
  },
  
  // ... all other key metrics
  
  operatingCFtoRevenue: {...},
  roe: {...},
  profitMargin: {...},
  currentRatio: {...},
  assetTurnover: {...}
}
```

#### Function: `contextualizeAnomaly(metric, targetValue, peerBenchmarks, industry)`
```
Input: 
- metric (string): "debtToEquity"
- targetValue (number): 1.5
- peerBenchmarks (object): benchmark stats
- industry (string): "IT Services"

Process:
1. Get benchmark for that metric
2. Calculate deviation from peer median
3. Return context string for Claude

Return:
{
  deviationFromMedian: percentage,
  percentile: number (0-100),
  severity: "normal" | "unusual" | "extreme",
  context: "string explaining normal range for industry"
}

Example output:
{
  deviationFromMedian: 150,
  percentile: 85,
  severity: "unusual",
  context: "Debt/Equity of 1.5 is 150% above peer median of 0.5. 
           This is high even for construction (healthy range 0.2-1.0).
           Percentile: 85th (higher than 85% of peers)"
}
```

### 2.5 Claude AI Service (`src/services/claude-ai.js`)

**AI Instruction:** Create class with three methods (multi-turn):

#### Method: `detectAnomalies(metricsHistory, peerBenchmarks, industryContext)`
```
Input:
- metricsHistory: Array of {year, metrics, ratios} objects (10 years)
- peerBenchmarks: Object with peer median/p25/p75 for each metric
- industryContext: String like "IT Services" or "Banking"

Claude Prompt to generate:
```
You are a financial forensics expert specializing in anomaly detection.

Analyze this company's 10-year financial history and identify anomalies that:
1. Deviate from the company's own historical trend
2. Deviate from industry peer norms

COMPANY METRICS HISTORY:
[Insert metricsHistory JSON]

INDUSTRY PEER BENCHMARKS:
[Insert peerBenchmarks JSON]

INDUSTRY: {industryContext}

For EACH anomaly detected, provide:
- Metric name (exactly as it appears in data)
- Year first detected
- Deviation percentage (how far from peer median)
- Severity: "Low" | "Medium" | "High" | "Critical"
- Description of why this is anomalous
- How it compares to peer norms

Return ONLY valid JSON, no preamble, no markdown:
{
  "anomalies": [
    {
      "metric": "Revenue vs Cash Flow Divergence",
      "year_detected": 2008,
      "deviation_percent": 150,
      "severity": "Critical",
      "description": "Revenue grew 20% but operating cash flow declined 50%",
      "vs_peer_context": "IT Services peers maintain 15% CF margin. Target shows negative."
    }
  ]
}
```

Process:
1. Format the prompt with actual data
2. Call Claude API with model "claude-sonnet-4-20250514"
3. Parse JSON response
4. Validate response has required fields
5. Return anomalies array or empty array on error

Error Handling:
- Catch API errors and log them
- Return { anomalies: [] } on failure
- Never throw error to caller
```

#### Method: `assessFraudRisk(anomalies, metricsHistory, auditorNotes, company)`
```
Input:
- anomalies: Array from detectAnomalies()
- metricsHistory: Full 10-year history
- auditorNotes: Array of {year, notes, qualification} objects
- company: {name, industry, cin}

Claude Prompt to generate:
```
You are an expert forensic accountant with experience investigating major corporate frauds.

Based on these financial anomalies, auditor notes, and known fraud patterns, 
assess the fraud and financial collapse risk for this company.

KNOWN FRAUD PATTERNS TO CHECK:
1. Revenue growing rapidly while cash flow declines (Satyam 2008)
2. Related party transactions growing faster than core business (IL&FS)
3. Auditor language becoming increasingly hedged/qualified (Satyam, IL&FS)
4. Debt being restructured into creative/complex instruments (IL&FS)
5. Asset quality deteriorating while reported profitability stays stable
6. Large one-time gains masking operating losses
7. Increasing related party transactions with explanations becoming vague
8. Auditor rotation or change in opinion

ANOMALIES DETECTED:
[Insert anomalies JSON]

METRICS HISTORY:
[Insert metricsHistory JSON]

AUDITOR NOTES PROGRESSION:
[Insert auditor notes by year]

COMPANY: {name} ({industry})

Assess fraud risk considering:
1. Whether anomalies match known fraud patterns
2. Timeline of auditor concern escalation
3. Industry-specific red flags
4. Sustainability of reported metrics

Return ONLY valid JSON:
{
  "fraud_risk_score": "Low" | "Medium" | "High" | "Critical",
  "fraud_likelihood_0_to_1": 0.85,
  "reasoning": "3-4 sentences explaining the risk assessment",
  "top_risk_factors": [
    "Revenue-Cash Flow divergence sustained 4 years",
    "Auditor qualification language increasing",
    "RPT grew 300% in single year"
  ],
  "matched_fraud_patterns": [
    "Satyam pattern: Revenue↑ but CF↓",
    "IL&FS pattern: RPT growth outpacing core business"
  ],
  "recommendation": "Detailed audit recommended" or "Monitor closely" or "Unlikely fraud"
}
```

Process:
1. Format prompt with actual data
2. Call Claude API
3. Parse and validate JSON response
4. Return fraud assessment or safe default on error
```

#### Method: `analyzeSentiment(auditorNotesList)`
```
Input: Array of {year, notes, qualification} objects (10 years)

Claude Prompt to generate:
```
You are analyzing the progression of auditor language and sentiment 
from financial statement audit reports over 10 years.

Track how auditor confidence changed, from:
- Confident/Unqualified (no concerns)
- Hedged (using "subject to", "we believe")
- Concerned (qualified opinions, reservations)
- Alarmed (adverse opinions, disclaimers)

AUDITOR NOTES BY YEAR:
[Insert auditor notes]

For EACH year, identify:
1. Overall sentiment: "confident" | "hedged" | "concerned" | "alarmed"
2. Hedging score: 0 (very confident) to 1 (very hedged)
3. Key phrases indicating concern or doubt

Return ONLY JSON:
{
  "sentiment_trend": [
    {
      "year": 2008,
      "sentiment": "hedged",
      "hedging_score": 0.6,
      "key_phrases": ["subject to", "except for"],
      "summary": "Auditor notes first reservations about revenue"
    }
  ],
  "trend_summary": "Auditor confidence deteriorated from 2008 onwards...",
  "concern_escalation": "Moderate - gradual increase in hedging language"
}
```

Process:
1. Format and call Claude
2. Parse response
3. Return sentiment data or empty default on error
```

### 2.6 Report Generator (`src/services/report-generator.js`)

**AI Instruction:** Create function:

#### Function: `generateReport(company, metricsHistory, peers, anomalies, fraudScore, sentiment)`
```
Input:
- company: {id, name, cin, industry}
- metricsHistory: Full 10-year metrics
- peers: Array of peer companies
- anomalies: Output from detectAnomalies()
- fraudScore: Output from assessFraudRisk()
- sentiment: Output from analyzeSentiment()

Process:
1. Build report object with all data
2. Add filing references for each anomaly
3. Create peer comparison section
4. Add metadata (analysis_date, execution_time, etc.)

Return:
{
  metadata: {
    company_name: string,
    cin: string,
    industry: string,
    analysis_date: ISO timestamp,
    data_quality_score: 0-1 (confidence in extracted data),
    execution_time_ms: number
  },
  
  fraud_risk_assessment: {
    score: string,
    likelihood_0_to_1: number,
    reasoning: string,
    top_risk_factors: [string],
    recommendation: string
  },
  
  anomalies: [
    {
      ...anomaly,
      filing_reference: "2009 Annual Report, Cash Flow Statement",
      severity_explanation: string
    }
  ],
  
  metrics_history: array of 10-year metrics,
  
  peer_comparison: {
    target_company_latest: metrics object,
    peers: [5 peer company objects with metrics],
    benchmarks: peer benchmark stats
  },
  
  auditor_sentiment_trend: sentiment data,
  
  summary: {
    anomaly_count: number,
    critical_flags: number,
    overall_health_assessment: string
  }
}
```

---

## 🔌 PHASE 3: API ENDPOINTS

### 3.1 Main Analysis Route (`src/routes/analyze.js`)

**AI Instruction:** Create Express route:

#### Endpoint: `POST /api/analyze`

```
Request Body:
{
  "company_name_or_cin": "Satyam" or "U72200TG2001PLC038172"
}

Response (Success - 200):
{
  "success": true,
  "data": {
    // Full report object from report-generator
  },
  "meta": {
    "execution_time_ms": 85000,
    "data_sources": ["sebi", "mock"],
    "warnings": []
  }
}

Response (Error - 400/500):
{
  "success": false,
  "error": "Company not found",
  "suggestion": "Try: Satyam, TCS, DHFL"
}

Implementation:
1. Validate input (company_name_or_cin required)
2. Call sebiFetcher.searchCompany()
3. Call sebiFetcher.fetchFilingsByYear(id, 2015, 2025)
4. Parse filings with pdf-parser
5. Calculate metrics and ratios
6. Get peers and benchmarks
7. Call Claude AI (3-turn sequence)
8. Generate final report
9. Return JSON response

Error Handling:
- Try-catch all operations
- Graceful degradation (return partial results)
- Log all errors
- Never crash, always return response
- Timeout after 90 seconds
```

### 3.2 Health Check Route

```
GET /health
Response: { "status": "AuditGPT Backend Running", "timestamp": "..." }
```

---

## 📦 PHASE 4: UTILITIES & MIDDLEWARE

### 4.1 Error Handler (`src/utils/error-handler.js`)

```
Create Express error handling middleware:

- Catch all errors globally
- Log errors with context
- Return standardized error response
- Never expose sensitive info
```

### 4.2 Logger (`src/utils/logger.js`)

```
Create logging utility with levels:
- debug (detailed diagnostic info)
- info (important milestones)
- warn (recoverable issues)
- error (problems that need attention)

Include:
- Timestamp
- Log level
- Module name
- Message
- Optional context object
```

### 4.3 Validators (`src/utils/validators.js`)

```
Functions:
- validateCompanyInput(query): Check valid format
- validateMetrics(metrics): Check required fields present
- validateBenchmarks(benchmarks): Check data quality
```

---

## 🧪 PHASE 5: MOCK DATA

### 5.1 Mock Satyam Filing Data (`src/mock-data/satyam-filings.js`)

```
Export 10 years of Satyam data (2005-2009, then 2 years post-fraud):

Structure for each year:
{
  year: 2008,
  metrics: {
    totalAssets: 7000000000,
    totalLiabilities: 3500000000,
    equity: 3500000000,
    revenue: 2400000000,
    netIncome: 120000000,
    operatingCashFlow: 50000000,  // RED FLAG: CF declined
    freeCashFlow: 20000000,
    relatedPartyTransactions: 50000000
  },
  auditorNotes: {
    fullText: "...",
    qualification: "qualified",
    hedgingLevel: 0.7
  }
}

Key patterns to include:
- 2005-2007: Stable growth, unqualified audit
- 2008: Revenue↑20%, CF↓50%, first qualification
- 2009: RPT↑300%, auditor adverse opinion
```

### 5.2 Mock TCS Data (`src/mock-data/tcs-filings.js`)

```
Export 10 years of TCS (healthy) data:

Characteristics:
- Consistent revenue growth (12-15% YoY)
- Stable operating CF (12-15% of revenue)
- Low debt/equity ratio (0.3-0.4)
- Unqualified audit opinion all years
- No anomalies
```

### 5.3 Mock Peers Database (`src/mock-data/peers-db.js`)

```
Export array of peer companies with:
- Basic company info (name, industry)
- Latest year metrics
- Used by peer-benchmark service

Include peers for:
- IT Services sector
- Banking sector
- Housing Finance sector
- Infrastructure sector
```

---

## 🔄 PHASE 6: SERVER SETUP

### 6.1 Express App (`src/app.js`)

```
Create Express app with:

Middleware:
1. CORS (allow frontend requests)
2. Morgan (HTTP request logging)
3. express.json (parse JSON requests)
4. Custom error handler

Routes:
1. GET /health
2. POST /api/analyze

Error handling middleware at end

Export app object
```

### 6.2 Server Entry Point (`src/server.js`)

```
Import app
Load config from env.js
Start server on PORT
Log startup message
Handle graceful shutdown
```

---

## 📋 TESTING CHECKLIST (For AI to Follow)

**Unit Tests** (`src/__tests__/`):
```
- Test sebiFetcher.searchCompany() with mock data
- Test pdfParser.parseBalanceSheet() with sample PDFs
- Test metricsCalculator.calculateRatios() with known values
- Test claudeAI error handling (simulate API timeout)
```

**Integration Tests**:
```
- Test full /api/analyze endpoint
- Test with mock Satyam data
- Verify response structure
- Verify Satyam gets CRITICAL score
- Verify TCS gets LOW score
```

**Manual Tests**:
```
1. Start server: npm run dev
2. Test endpoint:
   curl -X POST http://localhost:5000/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"company_name_or_cin": "Satyam"}'
3. Verify response format
4. Check execution time (<90 seconds)
5. Verify all report sections present
```

---

## 📝 DOCUMENTATION TO GENERATE

### README.md
```
Include:
1. What is AuditGPT
2. Tech stack
3. How to set up locally
4. How to run tests
5. API documentation
6. Example requests/responses
7. Troubleshooting
```

### .env.example
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
DEMO_MODE=false
```

---

## 🚀 DEPLOYMENT CHECKLIST

```
Pre-deployment:
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Environment variables configured
- [ ] Mock data loaded
- [ ] Error handling tested

Deploy to Railway/Render:
- [ ] Push to GitHub
- [ ] Connect Git repo to Railway/Render
- [ ] Set environment variables
- [ ] Deploy
- [ ] Test production endpoint
- [ ] Monitor logs
```

---

## KEY REQUIREMENTS FOR AI

When generating code, ensure:

1. **No Hard-coded API Keys**: Use dotenv
2. **Error Resilience**: Never throw errors that crash server
3. **Logging**: Log all important operations
4. **Type Safety**: Use JSDoc comments for function signatures
5. **Code Structure**: Follow MVC pattern (Models, Services, Routes)
6. **Async/Await**: Use proper async patterns
7. **JSON Parsing**: Always try-catch JSON.parse()
8. **Timeout Handling**: Implement 90-second timeout on analysis
9. **Mock Data Fallback**: Always have fallback when APIs fail
10. **Response Format**: Always return { success, data, error } structure

---

## CRITICAL SUCCESS METRICS

AI must ensure:
- ✅ Satyam analysis returns CRITICAL score
- ✅ TCS analysis returns LOW score
- ✅ Full analysis completes <90 seconds
- ✅ Server never crashes on bad input
- ✅ All responses are valid JSON
- ✅ Claude API errors handled gracefully
- ✅ SEBI API failures don't break analysis (use mock fallback)

---

**This roadmap is complete and detailed enough for an AI assistant to generate the entire backend without asking for clarification.**
