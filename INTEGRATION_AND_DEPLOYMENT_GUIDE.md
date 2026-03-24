# AuditGPT - INTEGRATION & DEPLOYMENT GUIDE

## 📋 OVERVIEW FOR BOTH TEAMS

**This document** explains how Frontend and Backend work together, how to test integration, and how to deploy to production.

---

## 🔄 PHASE 1: UNDERSTANDING THE DATA FLOW

### User Interaction Flow

```
USER ACTIONS:
1. User opens app in browser
   → React app loads (Frontend)
   → Shows InputForm component

2. User types "Satyam" and clicks "Analyze"
   → Frontend collects input: "Satyam"
   → Shows LoadingSpinner
   → Calls Backend API: POST /api/analyze { company_name_or_cin: "Satyam" }

3. Backend processes request
   → Searches for company (SEBI API or mock)
   → Fetches 10 years of filings
   → Parses PDFs → extracts metrics
   → Gets peer companies
   → Calls Claude AI (3 turns):
     a) Anomaly detection
     b) Fraud risk assessment
     c) Auditor sentiment analysis
   → Generates final report JSON
   → Returns to Frontend

4. Frontend receives report
   → LoadingSpinner disappears
   → ReportDisplay component renders with data
   → Shows:
     - FraudScoreCard (fraud score + reasoning)
     - AnomalyList (table of anomalies)
     - TimelineChart (red flags by year)
     - PeerComparisonTable (industry comparison)
     - AuditorSentimentChart (if available)
     - ExportButton (download report)

5. User can:
   - Scroll through report
   - Sort anomalies
   - Filter anomalies
   - Click "Analyze Another Company" to start over
```

### API Contract (Frontend ↔ Backend)

**Endpoint:** `POST /api/analyze`

**Frontend sends:**
```json
{
  "company_name_or_cin": "Satyam"
}
```

**Backend returns (200):**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "company_name": "Satyam Computer Services",
      "cin": "U72200TG2001PLC038172",
      "industry": "IT Services",
      "analysis_date": "2026-03-24T10:30:00Z",
      "data_quality_score": 0.85,
      "execution_time_ms": 85000
    },
    
    "fraud_risk_assessment": {
      "fraud_risk_score": "Critical",
      "fraud_likelihood_0_to_1": 0.85,
      "reasoning": "Revenue grew 20% YoY but operating cash flow declined 50% in 2008...",
      "top_risk_factors": [
        "Revenue-Cash Flow divergence sustained 4 years",
        "Auditor qualification language increasing",
        "Related Party Transactions grew 300%"
      ],
      "recommendation": "Immediate detailed audit recommended"
    },
    
    "anomalies": [
      {
        "id": 0,
        "metric": "Revenue vs Cash Flow Divergence",
        "year_detected": 2008,
        "deviation_percent": 150,
        "severity": "Critical",
        "description": "Revenue grew 20% but operating cash flow declined 50%",
        "vs_peer_context": "IT Services peers maintain 15% CF margin. Target shows negative.",
        "filing_reference": "2009 Annual Report, Cash Flow Statement"
      },
      // ... more anomalies
    ],
    
    "metrics_history": [
      {
        "year": 2015,
        "metrics": {
          "totalAssets": 7000000000,
          "revenue": 2000000000,
          "netIncome": 150000000,
          "operatingCashFlow": 300000000,
          "totalDebt": 1000000000,
          "relatedPartyTransactions": 50000000
        },
        "ratios": {
          "debtToEquity": 0.5,
          "profitMargin": 0.075,
          "operatingCFtoRevenue": 0.15,
          "roe": 0.18
        }
      },
      // ... 9 more years
    ],
    
    "peer_comparison": {
      "target_company_latest": {
        "debtToEquity": 1.5,
        "revenueGrowth": 0.20,
        "profitMargin": 0.05,
        "operatingCFtoRevenue": -0.1
      },
      "peer_companies": [
        {
          "id": "peer1",
          "name": "Infosys",
          "industry": "IT Services",
          "metrics": { /* latest metrics */ }
        },
        // ... 4 more peers
      ],
      "benchmarks": {
        "debtToEquity": {
          "median": 0.5,
          "mean": 0.52,
          "p25": 0.3,
          "p75": 0.8
        },
        // ... more metrics
      }
    },
    
    "auditor_sentiment_trend": {
      "sentiment_trend": [
        {
          "year": 2005,
          "sentiment": "confident",
          "hedging_score": 0.1,
          "key_phrases": [],
          "summary": "Unqualified opinion"
        },
        {
          "year": 2008,
          "sentiment": "hedged",
          "hedging_score": 0.6,
          "key_phrases": ["subject to", "except for"],
          "summary": "First qualification on revenue"
        },
        {
          "year": 2009,
          "sentiment": "concerned",
          "hedging_score": 0.9,
          "key_phrases": ["unable to obtain evidence", "adverse"],
          "summary": "Auditor significant concern"
        }
      ],
      "trend_summary": "Auditor confidence deteriorated significantly from 2008...",
      "concern_escalation": "High - clear progression from confident to adverse"
    }
  },
  "meta": {
    "execution_time_ms": 85000,
    "data_sources": ["sebi", "claude"],
    "warnings": []
  }
}
```

**Backend returns (400/500):**
```json
{
  "success": false,
  "error": "Company not found",
  "suggestion": "Try: Satyam, TCS, DHFL, IL&FS, Yes Bank"
}
```

---

## 🚀 PHASE 2: LOCAL DEVELOPMENT SETUP

### 2.1 Initial Setup (Both Teams)

**Backend Team:**
```bash
# Clone repository
git clone <repo-url>
cd auditgpt-hackathon/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY

# Start development server
npm run dev
# Backend running on http://localhost:5000

# Test health endpoint
curl http://localhost:5000/health
```

**Frontend Team:**
```bash
# From project root
cd frontend

# Install dependencies (already done by CRA, but verify)
npm install

# Create .env.local file
echo "REACT_APP_API_URL=http://localhost:5000" > .env.local

# Start development server
npm start
# Frontend running on http://localhost:3000
```

### 2.2 Testing Integration Locally

**Test 1: API Connection**

Frontend team verifies API is accessible:
```javascript
// In browser console (when Frontend is running)
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(d => console.log(d))
  // Should log: { status: "AuditGPT Backend Running", ... }
```

**Test 2: Full Analysis Flow**

Frontend submits request:
```javascript
// In browser console
fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ company_name_or_cin: 'Satyam' })
})
  .then(r => r.json())
  .then(d => console.log(d))
  // Should return full report after 60-90 seconds
```

**Test 3: UI Rendering**

Frontend team:
1. Type "Satyam" in input form
2. Click "Analyze"
3. Watch LoadingSpinner for 60-90 seconds
4. Report should appear with all sections
5. Fraud score should show "CRITICAL" (red)

---

## 🔧 PHASE 3: CRITICAL INTEGRATION POINTS

### 3.1 CORS Configuration

**Problem:** Frontend (localhost:3000) can't call Backend (localhost:5000)

**Backend Solution** (`src/app.js`):
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

### 3.2 Environment Variables

**Backend (.env):**
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=5000
NODE_ENV=development
```

**Frontend (.env.local):**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=90000
```

### 3.3 Error Handling (Critical!)

**Frontend** must handle API errors:
```javascript
// In InputForm or useApi hook
const handleAnalyze = async (companyName) => {
  try {
    const response = await fetch(`${apiUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name_or_cin: companyName }),
      timeout: 90000
    });
    
    if (!response.ok) {
      const error = await response.json();
      setError(error.error || 'Analysis failed');
      setReport(null);
      return;
    }
    
    const report = await response.json();
    setReport(report.data);
    setError(null);
    
  } catch (err) {
    setError(`Network error: ${err.message}`);
    setReport(null);
  }
};
```

**Backend** must always return valid JSON:
```javascript
// In routes/analyze.js
router.post('/api/analyze', async (req, res) => {
  try {
    const report = await runFullAnalysis(req.body.company_name_or_cin);
    res.status(200).json({
      success: true,
      data: report,
      meta: { execution_time_ms: Date.now() - startTime }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Try: Satyam, TCS, DHFL'
    });
  }
});
```

### 3.4 API Timeout Handling

**Frontend** (90 second timeout):
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 90000);

const response = await fetch(url, { 
  signal: controller.signal 
});

clearTimeout(timeoutId);
```

**Backend** (90 second analysis limit):
```javascript
// In services/report-generator.js
const ANALYSIS_TIMEOUT = 90000; // 90 seconds

const promise = runAnalysis(company);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT)
);

const result = await Promise.race([promise, timeoutPromise]);
```

---

## 📊 PHASE 4: TESTING CHECKLIST

### 4.1 Pre-Demo Verification

**Backend Team** confirms:
- [ ] Server starts without errors: `npm run dev`
- [ ] Health endpoint responds: `curl http://localhost:5000/health`
- [ ] Sample analysis works: `curl -X POST ... -d '{"company_name_or_cin": "Satyam"}'`
- [ ] Satyam returns CRITICAL score
- [ ] TCS returns LOW score
- [ ] Execution time < 90 seconds
- [ ] No console errors/warnings
- [ ] Mock data loads correctly
- [ ] Error handling works (e.g., invalid company returns 400)

**Frontend Team** confirms:
- [ ] App starts: `npm start`
- [ ] InputForm displays
- [ ] API_URL is correctly set
- [ ] Can type and submit
- [ ] LoadingSpinner appears
- [ ] Report displays after 60-90s
- [ ] FraudScoreCard shows correct color
- [ ] AnomalyList sorts and filters
- [ ] Charts render without errors
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop

**Integration Tests:**
- [ ] Frontend → Backend communication works
- [ ] Report data flows correctly to all components
- [ ] Error message displays if Backend fails
- [ ] Timeout handling works (show error after 90s if no response)
- [ ] Multiple analyses in sequence work
- [ ] Each analysis resets state correctly

### 4.2 Test Scenarios

**Scenario 1: Satyam (Fraud Case)**
```
Input: "Satyam"
Expected Backend response: CRITICAL score, fraud pattern matches
Expected Frontend: Red score card, multiple high/critical anomalies
Expected charts: Timeline shows red flags from 2008 onwards
```

**Scenario 2: TCS (Healthy Company)**
```
Input: "TCS"
Expected Backend response: LOW score, no major anomalies
Expected Frontend: Green score card, minimal anomalies
Expected charts: Stable metrics, no red flags
```

**Scenario 3: Invalid Input**
```
Input: "XYZ Company That Doesn't Exist"
Expected Backend response: 400 with error message
Expected Frontend: Error message displayed, suggestion shown
```

**Scenario 4: Network Timeout**
```
Simulate: Backend taking >90 seconds
Expected Frontend: Timeout error shown to user
```

---

## 🌐 PHASE 5: DEPLOYMENT

### 5.1 Pre-Deployment Checklist

**Both Teams:**
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Code committed to GitHub
- [ ] `.env` variables documented (with example values)
- [ ] README updated with setup/deployment instructions
- [ ] API documentation up-to-date

**Backend Team:**
- [ ] All error handlers in place
- [ ] Mock data preloaded
- [ ] SEBI API fallback working
- [ ] Claude API calls optimized
- [ ] Logging working correctly

**Frontend Team:**
- [ ] All components tested
- [ ] Responsive design verified
- [ ] API URL configured for production
- [ ] Error pages created
- [ ] Loading states polished

### 5.2 Deploy Backend (Railway.app or Render.com)

**Using Railway.app:**

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial AuditGPT backend"
   git push origin main
   ```

2. **Create Railway project**
   - Visit railway.app
   - Create new project
   - Connect GitHub repository
   - Select `backend` directory

3. **Set environment variables**
   - In Railway dashboard: Variables
   - Add: `ANTHROPIC_API_KEY=sk-ant-...`
   - Add: `NODE_ENV=production`
   - Add: `PORT=8000` (Railway assigns a port)

4. **Deploy**
   - Railway auto-deploys on push
   - Check logs for errors
   - Copy deployment URL (e.g., `https://auditgpt-backend.up.railway.app`)

5. **Test**
   ```bash
   curl https://auditgpt-backend.up.railway.app/health
   ```

### 5.3 Deploy Frontend (Vercel.com)

**Using Vercel:**

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial AuditGPT frontend"
   git push origin main
   ```

2. **Create Vercel project**
   - Visit vercel.com
   - Import GitHub repository
   - Select `frontend` directory
   - Choose "Create React App" preset

3. **Set environment variables**
   - In Vercel dashboard: Settings → Environment Variables
   - Add: `REACT_APP_API_URL=https://auditgpt-backend.up.railway.app`

4. **Deploy**
   - Vercel auto-deploys on push
   - Copy deployment URL (e.g., `https://auditgpt.vercel.app`)

5. **Test**
   - Open URL in browser
   - Try analyzing "Satyam"
   - Verify report displays correctly

### 5.4 Production Configuration

**Backend (.env for production):**
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=8000
NODE_ENV=production
LOG_LEVEL=warn
DEMO_MODE=false
```

**Frontend (.env for production):**
```
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_API_TIMEOUT=90000
REACT_APP_DEMO_MODE=false
```

---

## 🔍 PHASE 6: POST-DEPLOYMENT MONITORING

### 6.1 Backend Monitoring

**Check logs daily:**
```bash
# Railway.app dashboard → Logs
# Look for:
- API errors (status 500)
- Claude API timeouts
- SEBI fetcher failures
- Any unhandled exceptions
```

**Test endpoint regularly:**
```bash
curl -X POST https://your-backend-url/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"company_name_or_cin": "Satyam"}'

# Should return report in <90 seconds
```

### 6.2 Frontend Monitoring

**Check error tracking:**
- Set up error reporting (Sentry, LogRocket, etc.)
- Monitor console errors
- Check network tab for failed API calls

**Test user flows:**
- Type company name → submit → report displays
- Try invalid input → error message shows
- Multiple analyses in sequence work
- Mobile responsiveness works

### 6.3 Performance Monitoring

**Track metrics:**
- API response time (target: <90s)
- Frontend load time (target: <2s)
- Report rendering time (target: <1s)

---

## 📋 TROUBLESHOOTING

### Problem: Frontend can't reach Backend

**Solutions:**
1. Check CORS is enabled in Backend
2. Verify `REACT_APP_API_URL` is correct
3. Test directly: `curl http://backend-url/health`
4. Check firewall/network policies

### Problem: Analysis takes >90 seconds

**Solutions (Backend team):**
1. Optimize Claude prompts (reduce context)
2. Parallelize API calls
3. Cache peer data
4. Check network speed

**Solutions (Frontend team):**
1. Increase timeout in .env: `REACT_APP_API_TIMEOUT=120000`
2. Update LoadingSpinner to show extended message
3. Allow user to cancel after 90s

### Problem: Reports don't display correctly

**Solutions:**
1. Check API response format matches expected schema
2. Verify all required fields present in report JSON
3. Check Frontend console for React errors
4. Test with sample report data

### Problem: "Company not found" error

**Solutions (Backend team):**
1. Verify mock database is loaded
2. Check SEBI API fallback is working
3. Add more companies to mock database

**Solutions (Frontend team):**
1. Show helpful suggestion: "Try: Satyam, TCS, DHFL"
2. Allow user to try different company name

---

## 🚀 FINAL CHECKLIST BEFORE DEMO

### 24 Hours Before:
- [ ] Both backend and frontend deployed
- [ ] Domain/URLs ready
- [ ] SSL certificates valid
- [ ] All tests passing in production
- [ ] Demo companies pre-loaded and tested
- [ ] Performance verified (<90 seconds)

### Day Of Demo:
- [ ] Both services running
- [ ] Internet connection tested
- [ ] Browser cache cleared
- [ ] Laptop has backup power
- [ ] Demo script printed/memorized
- [ ] Team roles assigned (who explains what)

### During Demo:
- [ ] Start with InputForm (looks clean)
- [ ] Type "Satyam" slowly
- [ ] Click "Analyze"
- [ ] Narrate what's happening while waiting
- [ ] Watch report appear (should be impressive!)
- [ ] Highlight color-coded fraud score
- [ ] Show timeline with red flags
- [ ] Explain innovation: "Industry-contextualized anomaly detection"

---

## 📞 COMMUNICATION PROTOCOL

**Between Teams (Weekly Check-ins):**

Frontend asks Backend:
- "Are the mock data structures finalized?"
- "What error messages should we display?"
- "Can we get a sample report JSON for testing?"

Backend asks Frontend:
- "Does the report schema we're returning work with your components?"
- "How are you handling long numbers (formatted or raw)?"
- "What's the maximum size report you can handle?"

**In Case of Emergency (During Hackathon):**

If API breaks:
1. Backend team: Push hotfix, redeploy to Railway/Render
2. Frontend team: Show error message, suggest trying demo companies
3. Both: Switch to DEMO_MODE with pre-generated reports

If Frontend breaks:
1. Frontend team: Rollback to last working version
2. Display static demo report while fixing
3. Redeploy when fixed

---

## 🎯 FINAL WORDS

**Remember:**
- The **data flow** is: Input → Backend processes → Report JSON → Frontend displays
- **Every step matters**: Even a small JSON format mismatch breaks the entire chain
- **Test early, test often**: Don't wait until the last day to integrate
- **Communicate constantly**: Both teams need to be on the same page
- **Have fallbacks**: Mock data, demo mode, error messages

**Good luck! You've got this! 🚀**

---

**This integration guide ensures both Frontend and Backend teams work seamlessly together.**
