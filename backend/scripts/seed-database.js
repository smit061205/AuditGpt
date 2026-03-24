/**
 * AuditGPT — SEBI 10-Year Database Builder (Hybrid Extrapolator)
 * This script pulls current metrics from Yahoo Finance and uses 
 * sector-aware backward projections to simulate 10 years of consistent
 * SEBI/BSE history for up to 300 major Indian companies.
 */
const fs = require('fs');
const path = require('path');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const DB_PATH = path.join(__dirname, '../src/data/sebi-db.json');

const NIFTY_TICKERS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS', 'SBIN.NS', 'INFY.NS',
  'LICI.NS', 'ITC.NS', 'HINDUNILVR.NS', 'LT.NS', 'BAJFINANCE.NS', 'HCLTECH.NS', 'MARUTI.NS',
  'SUNPHARMA.NS', 'ADANIENT.NS', 'KOTAKBANK.NS', 'TITAN.NS', 'ONGC.NS', 'TATAMOTORS.NS',
  'NTPC.NS', 'AXISBANK.NS', 'DMART.NS', 'ADANIGREEN.NS', 'ADANIPORTS.NS', 'ULTRACEMCO.NS',
  'ASIANPAINT.NS', 'COALINDIA.NS', 'BAJAJFINSV.NS', 'BAJAJ-AUTO.NS', 'POWERGRID.NS', 'NESTLEIND.NS',
  'WIPRO.NS', 'M&M.NS', 'IOC.NS', 'JIOFIN.NS', 'HAL.NS', 'DLF.NS', 'ADANIPOWER.NS', 'JSWSTEEL.NS',
  'TATASTEEL.NS', 'SIEMENS.NS', 'IRFC.NS', 'VBL.NS', 'ZOMATO.NS', 'PIDILITIND.NS', 'GRASIM.NS',
  'SBILIFE.NS', 'BEL.NS', 'LTIM.NS', 'TRENT.NS', 'PNB.NS', 'INDIGO.NS', 'BANKBARODA.NS', 'HDFCLIFE.NS',
  'ABB.NS', 'BPCL.NS', 'PFC.NS', 'GODREJCP.NS', 'TATAPOWER.NS', 'HINDALCO.NS', 'RECLTD.NS', 'BRITANNIA.NS',
  'INDUSINDBK.NS', 'TVSMOTOR.NS', 'CIPLA.NS', 'GAIL.NS', 'AMBUJACEM.NS', 'SHREECEM.NS', 'TECHM.NS',
  'EICHERMOT.NS', 'DIVISLAB.NS', 'CGPOWER.NS', 'CHOLAFIN.NS', 'APOLLOHOSP.NS', 'LODHA.NS', 'TORNTPHARM.NS',
  'CANBK.NS', 'HEROMOTOCO.NS', 'SHRIRAMFIN.NS', 'JINDALSTEL.NS', 'BOSCHLTD.NS', 'MAXHEALTH.NS',
  'TIINDIA.NS', 'YESBANK.NS', 'HAVELLS.NS', 'CUMMINSIND.NS', 'MOTHERSON.NS', 'POLYCAB.NS', 'COLPAL.NS'
];

async function fetchRealData(ticker) {
  try {
    return await yahooFinance.quoteSummary(ticker, {
      modules: ['financialData', 'defaultKeyStatistics', 'summaryProfile']
    });
  } catch (err) {
    return null;
  }
}

function getSectorNorms(industry) {
  const lower = (industry || '').toLowerCase();
  if (lower.includes('bank') || lower.includes('financ') || lower.includes('insur') || lower.includes('nbfc')) {
    return { grossMargin: 0.38, ebitdaMargin: 0.28, netMargin: 0.20, cashFlowRatio: 1.1, debtToRevenue: 0.3, currentRatio: 1.15 };
  } else if (lower.includes('it') || lower.includes('software') || lower.includes('technol')) {
    return { grossMargin: 0.32, ebitdaMargin: 0.23, netMargin: 0.18, cashFlowRatio: 1.25, debtToRevenue: 0.05, currentRatio: 2.8 };
  } else if (lower.includes('auto') || lower.includes('vehicle') || lower.includes('motor')) {
    return { grossMargin: 0.14, ebitdaMargin: 0.10, netMargin: 0.05, cashFlowRatio: 1.0, debtToRevenue: 0.8, currentRatio: 1.2 };
  } else if (lower.includes('consumer') || lower.includes('fmcg') || lower.includes('unilever')) {
    return { grossMargin: 0.45, ebitdaMargin: 0.18, netMargin: 0.14, cashFlowRatio: 1.15, debtToRevenue: 0.1, currentRatio: 1.3 };
  } else if (lower.includes('pharma') || lower.includes('health')) {
    return { grossMargin: 0.55, ebitdaMargin: 0.22, netMargin: 0.15, cashFlowRatio: 1.1, debtToRevenue: 0.2, currentRatio: 2.0 };
  } else if (lower.includes('telecom') || lower.includes('airtel')) {
    return { grossMargin: 0.35, ebitdaMargin: 0.30, netMargin: 0.10, cashFlowRatio: 1.0, debtToRevenue: 1.2, currentRatio: 0.9 };
  } else {
    // General Industrials
    return { grossMargin: 0.30, ebitdaMargin: 0.15, netMargin: 0.10, cashFlowRatio: 1.1, debtToRevenue: 0.4, currentRatio: 1.5 };
  }
}

function generate10YearHistory(realData, ticker) {
  const years = [];
  const fd = realData?.financialData || {};
  const profile = realData?.summaryProfile || {};
  const currentYear = new Date().getFullYear();
  const industry = profile.industry || profile.sector || '';
  const norms = getSectorNorms(industry);

  // Anchor to real data if available, else synthesize
  const currentRevenue = fd.totalRevenue || Math.floor(Math.random() * 500000000) + 1000000000;

  // Company-specific baseline modifiers (0.85x to 1.15x of sector norm)
  const companyQuality = 0.85 + (Math.random() * 0.3);
  const baseGrossMargin = norms.grossMargin * companyQuality;
  const baseEbitdaMargin = norms.ebitdaMargin * companyQuality;
  const baseNetMargin = norms.netMargin * companyQuality;
  const baseCashFlowRatio = norms.cashFlowRatio * (0.9 + (Math.random() * 0.2));
  const baseDebtToRev = norms.debtToRevenue * (0.7 + (Math.random() * 0.6));
  const baseCurrentRatio = norms.currentRatio * (0.8 + (Math.random() * 0.4));

  // Company-specific growth CAGR (5% to 15%)
  const baseGrowthRate = 0.05 + (Math.random() * 0.10);

  for (let i = 0; i < 10; i++) {
    const year = currentYear - 9 + i;
    
    // Yearly volatility jitter (± 12%)
    const yearJitter = 0.88 + (Math.random() * 0.24);
    
    // Extrapolate past revenue using the inverse growth curve + jitter
    const growthFactor = Math.pow(1 + baseGrowthRate, i) * yearJitter;
    const scaledRevenue = Math.max(100000, Math.floor(currentRevenue * (growthFactor / Math.pow(1 + baseGrowthRate, 9))));

    // Apply year-over-year jitter to margins
    const yrNetMargin = baseNetMargin * (0.9 + (Math.random() * 0.2));
    const yrGrossMargin = Math.min(0.95, baseGrossMargin * (0.95 + (Math.random() * 0.1)));
    const yrEbitdaMargin = baseEbitdaMargin * (0.9 + (Math.random() * 0.2));
    const yrCashFlowRatio = baseCashFlowRatio * (0.85 + (Math.random() * 0.3));
    const yrDebtToRev = baseDebtToRev * (0.9 + (Math.random() * 0.2));

    const netIncome = Math.floor(scaledRevenue * yrNetMargin);
    const operatingCashFlow = Math.floor(netIncome * yrCashFlowRatio);

    years.push({
      year,
      metrics: {
        revenue: scaledRevenue,
        grossProfit: Math.floor(scaledRevenue * yrGrossMargin),
        operatingIncome: Math.floor(scaledRevenue * yrEbitdaMargin),
        netIncome,
        totalAssets: Math.floor(scaledRevenue * Math.max(1.1, (2 * yearJitter))),
        totalLiabilities: Math.floor(scaledRevenue * yrDebtToRev * 1.5),
        equity: Math.floor(scaledRevenue * 0.8 * yearJitter),
        totalDebt: Math.floor(scaledRevenue * yrDebtToRev),
        totalCash: Math.floor(scaledRevenue * 0.18 * yearJitter),
        operatingCashFlow,
        freeCashFlow: Math.floor(operatingCashFlow * (0.7 + (Math.random() * 0.2))),
        investingCashFlow: -Math.floor(operatingCashFlow * (0.5 + (Math.random() * 0.3))),
        currentRatio: Math.max(0.5, baseCurrentRatio * (0.9 + (Math.random() * 0.2))),
        numEmployees: Math.floor((profile.fullTimeEmployees || 20000) * (growthFactor / Math.pow(1 + baseGrowthRate, 9))),
        relatedPartyTransactions: Math.floor(scaledRevenue * 0.008 * yearJitter),
        auditorFees: Math.floor(scaledRevenue * 0.0008 * (0.9 + (Math.random() * 0.2))),
      },
      auditorNotes: {
        qualificationType: 'unqualified',
        keyPhrases: ['presents fairly', 'clean opinion', 'accordance with Ind-AS'],
        hedgingScore: 0.04 + (Math.random() * 0.05),
        fullText: 'We have audited the standalone financial statements of the company. In our opinion, the statements give a true and fair view in conformity with Indian Accounting Standards (Ind-AS).'
      },
      source: 'Synthesized SEBI Database (Variable Extrapolation)'
    });
  }
  return years;
}

async function run() {
  console.log('🚀 Starting 10-Year SEBI Database Builder...');
  const db = {};

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`\n📚 Extrapolating historical data for ${NIFTY_TICKERS.length} major NSE companies...`);

  for (let i = 0; i < NIFTY_TICKERS.length; i++) {
    const ticker = NIFTY_TICKERS[i];
    process.stdout.write(`[${i + 1}/${NIFTY_TICKERS.length}] ${ticker}... `);

    const realData = await fetchRealData(ticker);
    
    if (realData) {
      db[ticker] = {
        meta: {
          id: ticker,
          name: realData.financialData?.companyOfficer || ticker,
          industry: realData.summaryProfile?.industry || 'Unknown Sector',
          exchange: 'NSE'
        },
        history: generate10YearHistory(realData, ticker)
      };
      console.log('✅ Found & Extrapolated');
    } else {
      console.log('⚠️ Failed');
    }
    
    // Quick delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 400));
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`\n🎉 Success! Database built at: ${DB_PATH}`);
  console.log(`Size: ${Object.keys(db).length} companies, ${Object.keys(db).length * 10} statements.`);
}

run();
