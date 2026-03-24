# AuditGPT - FRONTEND ROADMAP FOR AI DEVELOPMENT

## 📋 OVERVIEW

**Tech Stack:**
- Framework: React.js (v18+)
- Language: JavaScript/JSX
- Styling: CSS3 (or Tailwind CSS for faster development)
- Charting: Recharts
- HTTP Client: Axios
- State Management: React Hooks (useState, useContext)
- Build Tool: Create React App or Vite (already handled by `npx create-react-app`)

**File Structure to Generate:**
```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── index.js                        # React entry point
│   ├── App.jsx                         # Main app component
│   ├── App.css                         # Global styles
│   ├── components/
│   │   ├── InputForm/
│   │   │   ├── InputForm.jsx           # Company search input
│   │   │   └── InputForm.css           # Component styles
│   │   ├── LoadingSpinner/
│   │   │   ├── LoadingSpinner.jsx      # Loading animation
│   │   │   └── LoadingSpinner.css
│   │   ├── ReportDisplay/
│   │   │   ├── ReportDisplay.jsx       # Main report container
│   │   │   └── ReportDisplay.css
│   │   ├── FraudScoreCard/
│   │   │   ├── FraudScoreCard.jsx      # Large score display
│   │   │   └── FraudScoreCard.css
│   │   ├── AnomalyList/
│   │   │   ├── AnomalyList.jsx         # Table of anomalies
│   │   │   └── AnomalyList.css
│   │   ├── TimelineChart/
│   │   │   ├── TimelineChart.jsx       # Red flag timeline
│   │   │   └── TimelineChart.css
│   │   ├── AuditorSentimentChart/
│   │   │   ├── AuditorSentimentChart.jsx # Sentiment progression
│   │   │   └── AuditorSentimentChart.css
│   │   ├── PeerComparisonTable/
│   │   │   ├── PeerComparisonTable.jsx # Industry peer comparison
│   │   │   └── PeerComparisonTable.css
│   │   ├── Header/
│   │   │   ├── Header.jsx              # App header
│   │   │   └── Header.css
│   │   ├── ErrorBoundary/
│   │   │   └── ErrorBoundary.jsx       # Error handling component
│   │   └── ExportButton/
│   │       ├── ExportButton.jsx        # Export report button
│   │       └── ExportButton.css
│   ├── hooks/
│   │   ├── useApi.js                   # Custom hook for API calls
│   │   └── useLocalStorage.js          # Custom hook for localStorage
│   ├── services/
│   │   ├── api.js                      # API client configuration
│   │   └── report-formatter.js         # Format report data for display
│   ├── styles/
│   │   ├── variables.css               # CSS variables (colors, fonts)
│   │   ├── globals.css                 # Global styles
│   │   └── theme.css                   # Theme variables
│   ├── utils/
│   │   ├── formatters.js               # Number/date formatting
│   │   ├── validators.js               # Input validation
│   │   └── helpers.js                  # Utility functions
│   ├── constants/
│   │   ├── colors.js                   # Color constants
│   │   ├── messages.js                 # User messages
│   │   └── config.js                   # App configuration
│   ├── context/
│   │   ├── ReportContext.jsx           # Global report state
│   │   └── ThemeContext.jsx            # Theme state
│   └── mock-data/
│       ├── satyam-report.json          # Sample Satyam report
│       └── tcs-report.json             # Sample TCS report
├── .env.example                        # Environment template
├── .env.local                          # (To be created locally)
├── package.json                        # Dependencies & scripts
├── README.md                           # Setup instructions
└── .gitignore                          # Git ignore rules
```

---

## 🔧 PHASE 1: PROJECT INITIALIZATION

### 1.1 Package.json Dependencies
**AI Instruction:** Generate a `package.json` with:

```
Required Production Dependencies:
- react: ^18.2.0
- react-dom: ^18.2.0
- axios: ^1.4.0
- recharts: ^2.7.0
- react-router-dom: ^6.0.0 (optional, for future routing)

Dev Dependencies (included by CRA):
- @testing-library/react: ^13.0.0
- @testing-library/jest-dom: ^5.0.0

Scripts:
- start: "react-scripts start"
- build: "react-scripts build"
- test: "react-scripts test"
- eject: "react-scripts eject"
```

### 1.2 Environment Configuration (`.env.example`)

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=90000
REACT_APP_DEMO_MODE=false
REACT_APP_ENABLE_LOGGING=true
```

### 1.3 Constants File (`src/constants/config.js`)

```
Export:
- API_BASE_URL: from env or "http://localhost:5000"
- API_ENDPOINTS: { ANALYZE: "/api/analyze", HEALTH: "/health" }
- TIMEOUT_MS: 90000
- DEMO_COMPANIES: ["Satyam", "TCS", "DHFL", "IL&FS", "Yes Bank"]
- RISK_COLORS: { Low: "#4CAF50", Medium: "#FF9800", High: "#F44336", Critical: "#8B0000" }
```

---

## 🎨 PHASE 2: CORE COMPONENTS

### 2.1 Main App Component (`src/App.jsx`)

**AI Instruction:** Create React component with:

```jsx
Features:
- Main container layout
- State management (useState):
  - report (null | report object)
  - loading (boolean)
  - error (null | error message)
  - analysisTime (number - for tracking performance)

Flow:
1. Initially show InputForm
2. On submit, set loading=true, error=null
3. Call API to /api/analyze
4. On success, set report=data, loading=false
5. Display ReportDisplay with report data
6. Show "Analyze Another Company" button to reset

Error Handling:
- Display error message if API fails
- Show suggestion to try demo companies
- Allow retry

CSS:
- Full height app container
- Flexbox layout (vertical)
- App header
- Main content area
- Footer with links
```

**Structure:**
```jsx
function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisTime, setAnalysisTime] = useState(0);
  
  const handleAnalyze = async (companyName) => {
    // Implementation
  };
  
  const handleReset = () => {
    // Reset to input form
  };
  
  return (
    <div className="App">
      <Header />
      <main className="app-main">
        {!report ? (
          <>
            <InputForm onAnalyze={handleAnalyze} disabled={loading} />
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage error={error} />}
          </>
        ) : (
          <>
            <ReportDisplay report={report} analysisTime={analysisTime} />
            <button onClick={handleReset} className="btn-reset">
              ← Analyze Another Company
            </button>
          </>
        )}
      </main>
    </div>
  );
}
```

### 2.2 Header Component (`src/components/Header/Header.jsx`)

```jsx
Display:
- AuditGPT logo/title
- Tagline: "AI that reads 10 years of financial statements 
           and finds what auditors missed"
- Optional: Theme toggle button

Styling:
- Dark blue background (#1F4E78)
- White text
- Centered, prominent
- 60px height
```

### 2.3 InputForm Component (`src/components/InputForm/InputForm.jsx`)

**AI Instruction:** Create component with:

```jsx
Props:
- onAnalyze (function): Called with company name
- disabled (boolean): Disable during analysis

State:
- input (string): Company name input value
- selectedExample (string): Last clicked example

Features:
1. Text input field
   - Placeholder: "Enter NSE-listed company name or CIN"
   - Full width
   - Large font
   - Disabled when props.disabled=true

2. Analyze button
   - Text: "Analyze" or "Analyzing..." when loading
   - Full width
   - Call onAnalyze(input) on click
   - Disabled when loading or input empty
   - Color: #1F4E78 (primary blue)

3. Quick links section
   - Display: "Try: Satyam • TCS • DHFL • IL&FS • Yes Bank"
   - Clicking a name fills input and triggers analyze
   - Styled as subtle text with underlines on hover

4. Info cards (4 columns)
   - Card 1: "📊 10 Years" - "Analyzes a decade of filings"
   - Card 2: "🏭 Industry Context" - "Benchmarks against peers"
   - Card 3: "⚠️ Red Flags" - "Finds fraud patterns"
   - Card 4: "⏱️ <90 Seconds" - "Report generation"
   - Each card: icon + title + description
   - Light gray background, subtle shadow

Styling:
- Centered layout
- Max-width: 600px
- Padding: 40px
- Input: 48px height, large font
- Button: 48px height, prominent color
```

**Structure:**
```jsx
function InputForm({ onAnalyze, disabled }) {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) onAnalyze(input);
  };
  
  const handleQuickSelect = (company) => {
    setInput(company);
    onAnalyze(company);
  };
  
  return (
    <div className="input-form-container">
      <form onSubmit={handleSubmit} className="input-form">
        {/* Input field and button */}
      </form>
      
      <div className="quick-links">
        {/* Suggested companies */}
      </div>
      
      <div className="info-cards">
        {/* 4 info cards */}
      </div>
    </div>
  );
}
```

### 2.4 LoadingSpinner Component (`src/components/LoadingSpinner/LoadingSpinner.jsx`)

```jsx
Display:
- Animated spinner (CSS animation or SVG)
- Status messages that change over time:
  - 0-10s: "Fetching filings from SEBI..."
  - 10-30s: "Parsing financial statements..."
  - 30-60s: "Analyzing with AI..."
  - 60-90s: "Generating report..."

Features:
- Center of screen
- Smooth fade-in/out
- Estimated time remaining
- Percentage progress (rough estimate based on time)

Styling:
- Semi-transparent overlay
- Large spinner animation
- Status text below spinner
- Optional progress bar
```

**Structure:**
```jsx
function LoadingSpinner() {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(t => t + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getStatus = () => {
    if (elapsedTime < 10) return "Fetching filings from SEBI...";
    if (elapsedTime < 30) return "Parsing financial statements...";
    if (elapsedTime < 60) return "Analyzing with AI...";
    return "Generating report...";
  };
  
  return (
    <div className="loading-spinner-overlay">
      <div className="spinner"></div>
      <p className="status-text">{getStatus()}</p>
      <p className="time-elapsed">{elapsedTime}s</p>
    </div>
  );
}
```

### 2.5 ReportDisplay Component (`src/components/ReportDisplay/ReportDisplay.jsx`)

**AI Instruction:** Create container component that:

```jsx
Props:
- report (object): Full report from API
- analysisTime (number): Time taken in ms

Layout:
- Header section with company info
- 5+ report sections (see below)
- Footer with export button

Components to include:
1. Company info header
   - Company name (large)
   - CIN, Industry
   - Analysis date
   - Analysis time

2. FraudScoreCard (full width, prominent)

3. AnomalyList (all anomalies with sorting)

4. TimelineChart (red flag progression)

5. AuditorSentimentChart (if available)

6. PeerComparisonTable (benchmarks)

7. Summary section
   - Total anomalies found
   - Critical flags
   - Overall assessment

8. ExportButton (export as PDF/JSON)

Styling:
- White background
- Sections separated with subtle borders
- Max-width: 1200px
- Centered
- Padding and spacing for readability
```

**Structure:**
```jsx
function ReportDisplay({ report, analysisTime }) {
  return (
    <div className="report-display">
      <section className="report-header">
        {/* Company info and analysis metadata */}
      </section>
      
      <section className="fraud-risk-section">
        <FraudScoreCard fraudRisk={report.fraud_risk_assessment} />
      </section>
      
      <section className="anomalies-section">
        <AnomalyList anomalies={report.anomalies} />
      </section>
      
      <section className="timeline-section">
        <TimelineChart data={report.metrics_history} />
      </section>
      
      {report.auditor_sentiment_trend && (
        <section className="sentiment-section">
          <AuditorSentimentChart data={report.auditor_sentiment_trend} />
        </section>
      )}
      
      <section className="peer-section">
        <PeerComparisonTable peers={report.peer_comparison} />
      </section>
      
      <section className="summary-section">
        {/* Summary stats */}
      </section>
      
      <ExportButton report={report} />
    </div>
  );
}
```

### 2.6 FraudScoreCard Component (`src/components/FraudScoreCard/FraudScoreCard.jsx`)

**AI Instruction:** Create component with:

```jsx
Props:
- fraudRisk (object): { fraud_risk_score, fraud_likelihood_0_to_1, reasoning, top_risk_factors }

Features:
1. Large score display
   - Font size: 48px
   - Color-coded background:
     - Low: Green (#4CAF50)
     - Medium: Orange (#FF9800)
     - High: Red (#F44336)
     - Critical: Dark red (#8B0000)
   - Centered

2. Likelihood bar
   - Progress bar showing likelihood (0-100%)
   - Same color as score
   - Label: "Likelihood: 85%"

3. Reasoning section
   - 2-3 sentence explanation
   - Background: Semi-transparent white overlay
   - Padding: 16px

4. Risk factors list
   - Bullet points with ⚠️ icon
   - Sort by severity
   - Each factor: metric + context

5. Recommendation
   - Box with distinct background color
   - Yellow/orange border-left

Styling:
- Card with rounded corners
- Shadow
- Padding: 32px
- Gradient or solid background based on score
- Border-left: 6px solid (score color)

CSS Variables:
- --score-critical: #8B0000
- --score-high: #F44336
- --score-medium: #FF9800
- --score-low: #4CAF50
```

**Structure:**
```jsx
function FraudScoreCard({ fraudRisk }) {
  const scoreColors = {
    'Low': '#4CAF50',
    'Medium': '#FF9800',
    'High': '#F44336',
    'Critical': '#8B0000'
  };
  
  const bgColor = scoreColors[fraudRisk.fraud_risk_score];
  
  return (
    <div 
      className="fraud-score-card" 
      style={{ borderLeftColor: bgColor }}
    >
      <div className="score-display" style={{ color: bgColor }}>
        <div className="score-number">{fraudRisk.fraud_risk_score}</div>
        <div className="score-label">Fraud Risk Level</div>
      </div>
      
      <div className="likelihood-section">
        <p>Likelihood: {(fraudRisk.fraud_likelihood_0_to_1 * 100).toFixed(0)}%</p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{
              width: `${fraudRisk.fraud_likelihood_0_to_1 * 100}%`,
              backgroundColor: bgColor
            }}
          ></div>
        </div>
      </div>
      
      <div className="reasoning">
        <h3>Assessment</h3>
        <p>{fraudRisk.reasoning}</p>
      </div>
      
      <div className="risk-factors">
        <h3>Top Risk Factors</h3>
        <ul>
          {fraudRisk.top_risk_factors.map((factor, i) => (
            <li key={i}>⚠️ {factor}</li>
          ))}
        </ul>
      </div>
      
      {fraudRisk.recommendation && (
        <div className="recommendation">
          <strong>Recommendation:</strong> {fraudRisk.recommendation}
        </div>
      )}
    </div>
  );
}
```

### 2.7 AnomalyList Component (`src/components/AnomalyList/AnomalyList.jsx`)

**AI Instruction:** Create table component with:

```jsx
Props:
- anomalies (array): List of anomaly objects

Features:
1. Sorting
   - Sort by: Severity | Year | Deviation %
   - Default: By severity (highest first)
   - Dropdown selector

2. Table with columns
   - Metric: Name of the anomaly
   - Year: Year detected
   - Deviation: Deviation % with +/- indicator
   - Severity: Color-coded badge
   - Description: Brief explanation

3. Row styling
   - Row background color based on severity:
     - Critical: Light red (#FFE0E0)
     - High: Light orange (#FFF3E0)
     - Medium: Light yellow (#FFF9E0)
     - Low: Light green (#E8F5E9)
   - Hover: Slight darkening
   - Border-left: 4px colored bar matching severity

4. Filters (optional)
   - Filter by severity (show only Critical, High, etc.)
   - Search by metric name

5. Pagination (if many anomalies)
   - Show 10 per page
   - Previous/Next buttons

Styling:
- Clean table layout
- Readable fonts
- Good contrast
- Hover effects
```

**Structure:**
```jsx
function AnomalyList({ anomalies }) {
  const [sortBy, setSortBy] = useState('severity');
  const [filterSeverity, setFilterSeverity] = useState('All');
  
  const severityOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
  
  const sorted = [...anomalies]
    .filter(a => filterSeverity === 'All' || a.severity === filterSeverity)
    .sort((a, b) => {
      if (sortBy === 'severity') {
        return severityOrder[b.severity] - severityOrder[a.severity];
      } else if (sortBy === 'year') {
        return b.year_detected - a.year_detected;
      } else if (sortBy === 'deviation') {
        return Math.abs(b.deviation_percent) - Math.abs(a.deviation_percent);
      }
      return 0;
    });
  
  return (
    <div className="anomaly-list-container">
      <div className="list-header">
        <h2>🚩 Financial Anomalies Detected ({anomalies.length})</h2>
        <div className="controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="severity">Sort by Severity</option>
            <option value="year">Sort by Year</option>
            <option value="deviation">Sort by Deviation %</option>
          </select>
          
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      
      <table className="anomaly-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Year</th>
            <th>Deviation</th>
            <th>Severity</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((anomaly) => (
            <tr 
              key={anomaly.id} 
              className={`severity-${anomaly.severity.toLowerCase()}`}
              style={{ borderLeftColor: getSeverityColor(anomaly.severity) }}
            >
              <td>{anomaly.metric}</td>
              <td>{anomaly.year_detected}</td>
              <td className="deviation">
                {anomaly.deviation_percent > 0 ? '+' : ''}{anomaly.deviation_percent}%
              </td>
              <td>
                <span className="severity-badge" style={{ backgroundColor: getSeverityColor(anomaly.severity) }}>
                  {anomaly.severity}
                </span>
              </td>
              <td>{anomaly.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sorted.length === 0 && (
        <div className="no-data">No anomalies found matching filters.</div>
      )}
    </div>
  );
}
```

### 2.8 TimelineChart Component (`src/components/TimelineChart/TimelineChart.jsx`)

**AI Instruction:** Create visualization using Recharts:

```jsx
Props:
- data (array): 10 years of metrics
- anomalies (array): List of anomalies with years

Features:
1. Line chart showing:
   - X-axis: Years (2015-2025)
   - Y-axis: Multiple metrics (Revenue, Cash Flow, Debt)
   - Different colored lines for each metric

2. Anomaly markers
   - Vertical dashed lines for years with anomalies
   - Tooltips showing which anomalies detected that year
   - Color-coded by severity

3. Multiple lines
   - Revenue (blue)
   - Operating Cash Flow (green)
   - Debt (red)
   - Allow toggling visibility of lines

4. Interactive
   - Hover to see exact values
   - Click to see detailed anomaly info
   - Legend to toggle metrics

5. Responsive
   - Adapts to container width
   - Mobile-friendly

Using Recharts:
- LineChart component
- XAxis (years)
- YAxis (auto-scaled)
- CartesianGrid
- Tooltip
- Legend
- Multiple Line components for metrics
- ReferenceLine for anomaly years
```

**Structure:**
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

function TimelineChart({ data, anomalies }) {
  const [visibleLines, setVisibleLines] = useState({
    revenue: true,
    operatingCF: true,
    debt: true
  });
  
  const toggleLine = (line) => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };
  
  const anomalyYears = anomalies.map(a => a.year_detected);
  
  return (
    <div className="timeline-chart-container">
      <h2>📈 Red Flag Timeline (10-Year History)</h2>
      
      <div className="chart-controls">
        <label>
          <input 
            type="checkbox" 
            checked={visibleLines.revenue}
            onChange={() => toggleLine('revenue')}
          />
          Revenue
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={visibleLines.operatingCF}
            onChange={() => toggleLine('operatingCF')}
          />
          Operating Cash Flow
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={visibleLines.debt}
            onChange={() => toggleLine('debt')}
          />
          Total Debt
        </label>
      </div>
      
      <LineChart data={data} width={900} height={400} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        
        {visibleLines.revenue && (
          <Line type="monotone" dataKey="metrics.revenue" stroke="#8884d8" name="Revenue" />
        )}
        
        {visibleLines.operatingCF && (
          <Line type="monotone" dataKey="metrics.operatingCashFlow" stroke="#82ca9d" name="Operating CF" />
        )}
        
        {visibleLines.debt && (
          <Line type="monotone" dataKey="metrics.totalDebt" stroke="#ffc658" name="Total Debt" />
        )}
        
        {anomalyYears.map((year, idx) => (
          <ReferenceLine 
            key={idx}
            x={year} 
            stroke="#ff0000" 
            strokeDasharray="5 5"
            label={{ value: `Red Flag ${year}`, position: 'top' }}
          />
        ))}
      </LineChart>
      
      <div className="timeline-legend">
        <p>📍 Dashed red lines indicate years with detected anomalies</p>
      </div>
    </div>
  );
}
```

### 2.9 PeerComparisonTable Component (`src/components/PeerComparisonTable/PeerComparisonTable.jsx`)

**AI Instruction:** Create comparison table:

```jsx
Props:
- peers (object): { target_company_latest, peer_companies, benchmarks }

Features:
1. Table showing:
   - Metric name (first column)
   - Target company value
   - Each peer company value
   - Peer median/average
   - Deviation from peer median

2. Color coding
   - Green: Below peer median (good for debt, bad for profit)
   - Red: Above peer median (bad for debt, good for profit)
   - Neutral: Within normal range

3. Key metrics to compare
   - Debt/Equity
   - Revenue Growth %
   - Profit Margin
   - Operating CF/Revenue
   - ROE
   - Current Ratio

4. Sorting/Filtering
   - Filter by metric category
   - Sort by deviation

5. Tooltips
   - Hover to see benchmark explanation

Styling:
- Responsive table
- Good contrast
- Color-coded cells
- Clear headers
```

**Structure:**
```jsx
function PeerComparisonTable({ peers }) {
  const metrics = [
    { name: 'Debt/Equity', key: 'debtToEquity', type: 'lower-is-better' },
    { name: 'Revenue Growth %', key: 'revenueGrowth', type: 'higher-is-better' },
    { name: 'Profit Margin %', key: 'profitMargin', type: 'higher-is-better' },
    { name: 'Operating CF/Revenue', key: 'cfToRevenue', type: 'higher-is-better' },
    { name: 'ROE', key: 'roe', type: 'higher-is-better' }
  ];
  
  return (
    <div className="peer-comparison-container">
      <h2>🏢 Industry Peer Comparison</h2>
      
      <table className="peer-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Target Company</th>
            {peers.peer_companies.map((peer, i) => (
              <th key={i}>{peer.name}</th>
            ))}
            <th>Peer Median</th>
            <th>Deviation</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const targetValue = peers.target_company_latest[metric.key];
            const medianValue = peers.benchmarks[metric.key].median;
            const deviation = ((targetValue - medianValue) / medianValue * 100).toFixed(1);
            
            return (
              <tr key={metric.key}>
                <td>{metric.name}</td>
                <td className={`value ${getValueColor(deviation, metric.type)}`}>
                  {formatValue(targetValue)}
                </td>
                
                {peers.peer_companies.map((peer, i) => (
                  <td key={i}>{formatValue(peer.metrics[metric.key])}</td>
                ))}
                
                <td className="median">{formatValue(medianValue)}</td>
                <td className={`deviation ${getValueColor(deviation, metric.type)}`}>
                  {deviation > 0 ? '+' : ''}{deviation}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="peer-notes">
        <p>✓ Green = Better than peers | ✗ Red = Worse than peers</p>
      </div>
    </div>
  );
}
```

### 2.10 AuditorSentimentChart Component (`src/components/AuditorSentimentChart/AuditorSentimentChart.jsx`)

**AI Instruction:** Create visualization:

```jsx
Props:
- data (array): Sentiment trend by year

Features:
1. Line chart of hedging score over time
   - X-axis: Years
   - Y-axis: Hedging score (0=confident, 1=very hedged)
   - Line color changes: Green → Yellow → Orange → Red

2. Sentiment labels
   - Show sentiment label above line (confident/hedged/concerned)
   - Color-coded badge

3. Key phrases table
   - Show key concern phrases for each year
   - Phrases that indicate increasing hedging

4. Trend arrow
   - "↑ Auditor confidence declining" or "→ Stable concern level"

Styling:
- Simple, clear visualization
- Color gradient for hedging level
- Easy to understand narrative
```

---

## 🔌 PHASE 3: UTILITIES & SERVICES

### 3.1 API Client (`src/services/api.js`)

**AI Instruction:** Create Axios instance:

```javascript
Export:
- axios instance with baseURL from env
- Default headers (Content-Type)
- Response interceptor to handle errors
- Timeout set to 90000ms

Functions:
- analyzeCompany(companyName): POST to /api/analyze
  Returns: Promise<report>
- checkHealth(): GET /health
  Returns: Promise<status>

Error handling:
- Wrap API calls in try-catch
- Return meaningful error messages
- Never throw error to UI (return error object instead)
```

### 3.2 Custom Hooks (`src/hooks/useApi.js`)

```javascript
Hook: useApi(url, method='GET')

Returns:
- data (response data)
- loading (boolean)
- error (error message)
- execute (function to trigger request)

Usage:
const { data, loading, error, execute } = useApi('/api/analyze', 'POST');
await execute({ company_name_or_cin: 'Satyam' });
```

### 3.3 Format Utilities (`src/utils/formatters.js`)

```javascript
Functions:
- formatCurrency(number): "₹10,00,00,000" or "₹10 Crore"
- formatPercentage(number): "12.5%"
- formatDate(date): "Mar 24, 2026"
- truncateText(text, length): "Long text..." (for tooltips)
- formatNumber(number): "1,00,00,000" (Indian format)
```

### 3.4 Theme/Styling (`src/styles/variables.css`)

```css
Define CSS variables:

:root {
  /* Colors */
  --color-primary: #1F4E78;
  --color-critical: #8B0000;
  --color-high: #F44336;
  --color-medium: #FF9800;
  --color-low: #4CAF50;
  
  --color-bg-light: #F5F5F5;
  --color-bg-white: #FFFFFF;
  --color-text-dark: #333333;
  --color-text-light: #666666;
  --color-border: #E0E0E0;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-size-base: 16px;
  --font-size-large: 24px;
  --font-size-heading: 32px;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
}
```

---

## 🧪 PHASE 4: STATE MANAGEMENT (Optional Context)

### 4.1 ReportContext (`src/context/ReportContext.jsx`)

```javascript
Create React Context for:
- Current report
- Analysis history
- Recent companies

Provides:
- setReport()
- addToHistory()
- getHistory()
- clearHistory()

Usage:
const { report, setReport } = useContext(ReportContext);
```

---

## 📱 PHASE 5: RESPONSIVE DESIGN

**AI Instruction:** Ensure all components are responsive:

```css
Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Mobile optimization:
- Stack columns vertically
- Single column tables
- Smaller fonts (maintain readability)
- Touch-friendly buttons (48px minimum)
- No horizontal scrolling

Tablet optimization:
- 2-column layouts where appropriate
- Readable tables
- Centered content

Desktop optimization:
- Full-width utilization
- 3+ column layouts
- Large visualizations
```

---

## 🧪 TESTING CHECKLIST

**Manual Tests:**
```
1. Load app → InputForm displays
2. Type "Satyam" → Analysis starts
3. Loading spinner shows status updates
4. After 80-90s → Report displays
5. Fraud score shows CRITICAL (red)
6. Click "Sort by Severity" → Anomalies reorder
7. Click TCS → Analysis runs again
8. Report shows LOW fraud score
9. Export button → Can download report (bonus)
```

**Responsive Tests:**
```
1. Mobile: Test on iPhone/Android emulator
2. Tablet: Test on iPad
3. Desktop: Test on 1920x1080
4. All components should be readable
5. No horizontal scrolling on mobile
```

---

## 📝 DOCUMENTATION

### README.md
```
Include:
1. Setup instructions
2. How to run locally
3. Project structure
4. Component overview
5. API integration
6. Styling guide
7. How to deploy
```

### Component Documentation
```
Each component file should have JSDoc:
/**
 * FraudScoreCard Component
 * @param {Object} fraudRisk - Risk assessment data
 * @returns {JSX.Element}
 */
```

---

## 🚀 DEPLOYMENT CHECKLIST

```
Pre-deployment:
- [ ] All components tested
- [ ] No console errors
- [ ] API calls verified
- [ ] Responsive design checked
- [ ] Mock data working

Deploy to Vercel:
- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Set environment variables
- [ ] Deploy
- [ ] Test production URL
- [ ] Verify API calls to backend
```

---

## KEY REQUIREMENTS FOR AI

When generating code, ensure:

1. **Functional Components**: Use React hooks (useState, useEffect, etc.)
2. **Error Handling**: Display user-friendly error messages
3. **Loading States**: Show spinners while analyzing
4. **Accessibility**: Alt text for images, semantic HTML
5. **Performance**: Use React.memo for components that don't need re-renders
6. **Code Organization**: Separate concerns (components, services, utils)
7. **Responsive Design**: Mobile-first approach
8. **Type Safety**: Use PropTypes or comments for prop validation
9. **API Integration**: Use Axios for clean API calls
10. **Styling**: CSS modules or global styles with variables

---

## CRITICAL SUCCESS METRICS

Frontend must ensure:
- ✅ Form accepts company input (text, 40+ characters)
- ✅ Loading spinner shows for 60-90 seconds
- ✅ Report displays all 5+ sections
- ✅ Fraud score is prominent and color-coded
- ✅ Anomalies table is sortable and readable
- ✅ Charts display correctly (Recharts)
- ✅ Mobile responsive (no horizontal scrolling)
- ✅ API errors handled gracefully
- ✅ No console errors on page load
- ✅ All links/buttons are clickable and functional

---

**This roadmap is complete and detailed enough for an AI assistant to generate the entire frontend without asking for clarification.**
