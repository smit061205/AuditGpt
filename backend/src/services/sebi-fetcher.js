const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const { createLogger } = require('../utils/logger');
const { calculateRatios } = require('./metrics-calculator');
const logger = createLogger('API_Fetcher');

class APIFetcher {
  async searchCompany(query) {
    logger.info(`Searching Yahoo Finance for: ${query}`);
    const q = query.toLowerCase().trim();

    // 1. Hardcoded Mock Frauds
    if (q.includes('satyam')) {
      return {
        id: 'SATYAM.MOCK', name: 'Satyam Computer Services (Historical)', cin: 'SATYAM.MOCK',
        industry: 'Information Technology Services', exchange: 'BSE'
      };
    }
    if (q.includes('il&fs') || q.includes('ilfs') || q.includes('infrastructure leasing')) {
      return {
        id: 'ILFS.MOCK', name: 'Infrastructure Leasing & Financial Services (IL&FS)', cin: 'ILFS.MOCK',
        industry: 'Infrastructure Finance', exchange: 'BSE'
      };
    }
    if (q.includes('dhfl') || q.includes('dewan housing')) {
      return {
        id: 'DHFL.MOCK', name: 'Dewan Housing Finance Corporation Ltd. (DHFL)', cin: 'DHFL.MOCK',
        industry: 'Housing Finance', exchange: 'BSE'
      };
    }
    if (q.includes('yes bank') || q.includes('yesbank')) {
      return {
        id: 'YESBANK.MOCK', name: 'Yes Bank Limited (Historical Crisis)', cin: 'YESBANK.MOCK',
        industry: 'Banks—Regional', exchange: 'BSE'
      };
    }

    // 2. Common Name to Ticker Aliases (for easy demoing without '.NS')
    const ALIASES = {
      'reliance': 'RELIANCE.NS',
      'tcs': 'TCS.NS',
      'infosys': 'INFY.NS',
      'infy': 'INFY.NS',
      'hdfc': 'HDFCBANK.NS',
      'icici': 'ICICIBANK.NS',
      'yes bank': 'YESBANK.NS',
      'yesbank': 'YESBANK.NS',
      'sbi': 'SBIN.NS',
      'bharti': 'BHARTIARTL.NS',
      'airtel': 'BHARTIARTL.NS',
      'itc': 'ITC.NS'
    };

    let searchQuery = q;
    for (const [alias, ticker] of Object.entries(ALIASES)) {
      if (q === alias || q.includes(alias)) {
        searchQuery = ticker;
        break;
      }
    }

    try {
      const results = await yahooFinance.search(searchQuery);
      const topResult = results.quotes.find(q => q.isYahooFinance && q.quoteType === 'EQUITY')
        || results.quotes.find(q => q.isYahooFinance)
        || results.quotes[0];

      if (!topResult) throw new Error(`No ticker found for "${query}"`);

      // 3. Fallback: Check local SEBI DB if Yahoo Finance is returning generic data
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../data/sebi-db.json');
      let finalName = topResult.longname || topResult.shortname || query;
      let finalInd = topResult.industry || topResult.sector || 'General Industry';
      
      try {
        if (fs.existsSync(dbPath)) {
          const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          if (db[topResult.symbol]) {
             finalName = db[topResult.symbol].name || finalName;
             finalInd = db[topResult.symbol].industry || finalInd;
          }
        }
      } catch(e) {}

      return {
        id: topResult.symbol,
        name: finalName,
        cin: topResult.symbol,
        industry: finalInd,
        exchange: topResult.exchDisp,
      };
    } catch (err) {
      logger.error(`Yahoo Finance search failed for ${query}`, err.message);
      throw new Error(`Could not find company "${query}". Try using the stock ticker (e.g., AAPL, RELIANCE.NS, TCS.NS)`);
    }
  }

  async fetchFinancialData(symbol) {
    logger.info(`Fetching live financial data for ${symbol}`);

    // Check SEBI DB for 10-year history
    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../data/sebi-db.json');
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (db[symbol]) {
          logger.info(`✅ Loaded 10-year data for ${symbol} from local SEBI Database`);
          return db[symbol].history;
        }
      }
    } catch (err) {
      logger.warn(`Failed to read SEBI Database: ${err.message}`);
    }

    if (symbol === 'SATYAM.MOCK') {
      // Satyam Computer Services collapse happened in early 2009.
      // We provide a 10-year historical dataset from 1999 to 2008 showing the massive divergence
      // between stated revenue, fake cash, and actual cash flows leading up to the confession.
      return [1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008].map((year, i) => {
        const isLatest = year === 2008;
        const baseRev = 14000000000; // ~1400 Cr in 1999
        const revGrowthRate = 1.35; // 35% compound YoY growth
        const trueFlowFactor = 1 - (i * 0.12); // Real cash collection drops as revenue gets faked
        
        const currentRev = baseRev * Math.pow(revGrowthRate, i);
        // The fake cash pile Raju confessed to (~5000+ Cr at the end)
        const fakeCashPile = (currentRev * 0.35) * ((i / 2) + 1); 
        
        return {
          year,
          metrics: {
            revenue: currentRev,
            grossProfit: currentRev * 0.45,
            operatingIncome: currentRev * 0.28,
            netIncome: currentRev * 0.22,
            totalAssets: (currentRev * 1.5) + fakeCashPile,
            totalLiabilities: (currentRev * 0.4) + (i * 3000000000), // Hidden debt accumulated
            equity: (currentRev * 0.8) + fakeCashPile, // Fictitious equity
            totalDebt: (currentRev * 0.2) + (i * 2500000000),
            totalCash: fakeCashPile, // Suspiciously high and growing
            operatingCashFlow: currentRev * 0.2 * trueFlowFactor, // Core anomaly
            freeCashFlow: currentRev * 0.15 * trueFlowFactor,
            investingCashFlow: -currentRev * 0.2,
            currentRatio: 2.5 + (i * 0.25), // Looked incredibly healthy to trick auditors
            numEmployees: 10000 + (i * 4500),
            relatedPartyTransactions: 500000000 * Math.pow(1.8, i), // Maytas transactions
            auditorFees: 15000000 + (i * 3500000), // Very high auditor fees
          },
          auditorNotes: {
            qualificationType: 'unqualified',
            keyPhrases: isLatest 
              ? ['clean opinion', 'presents fairly', 'reliance on management statements'] 
              : ['clean opinion', 'presents fairly'],
            hedgingScore: isLatest ? 0.35 : 0.05,
            fullText: isLatest 
              ? 'We have audited the financial statements. In our opinion, the statements give a true and fair view. We note management representations regarding the existence of heavy cash deposits in non-scheduled bank accounts and accrued interest thereof.'
              : 'We have audited the financial statements of Satyam Computer Services Ltd. In our opinion, the statements give a true and fair view in conformity with accounting principles generally accepted in India.'
          },
          source: 'Historical Fraud Profile (1999-2008)'
        };
      });
    }

    // Company not found in SEBI database — no Yahoo Finance fallback
    throw new Error(
      `No 10-year data available for "${symbol}". ` +
      `Please add this company to backend/src/data/sebi-db.json or run the database seeder script. ` +
      `Currently available: Reliance, TCS, HDFC Bank, ICICI Bank, SBI, Infosys, ITC, HUL, L&T, Bajaj Finance, HCL Tech, Maruti, Sun Pharma, M&M, NTPC, Axis Bank, Power Grid, Kotak Bank, Bharti Airtel, LIC.`
    );
  }

  async getPeerCompanies(symbol, industry) {
    logger.info(`Fetching local peers for ${symbol} in industry: ${industry}`);
    const peers = [];
    const lowerInd = (industry || "").toLowerCase();

    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../data/sebi-db.json');
      
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Define broad sector keywords to match peers
        const getSector = (ind) => {
          const l = (ind || "").toLowerCase();
          if (l.includes('bank') || l.includes('financ') || l.includes('nbfc') || l.includes('credit')) return 'finance';
          if (l.includes(' it ') || l.startsWith('it ') || l.endsWith(' it') || l === 'it' || l.includes('software') || l.includes('tech') || l.includes('information')) return 'tech';
          if (l.includes('auto') || l.includes('motor') || l.includes('vehicle')) return 'auto';
          if (l.includes('pharma') || l.includes('health') || l.includes('care') || l.includes('medic')) return 'pharma';
          if (l.includes('consumer') || l.includes('fmcg') || l.includes('food')) return 'fmcg';
          if (l.includes('power') || l.includes('energy') || l.includes('oil') || l.includes('gas')) return 'energy';
          return 'other';
        };

        const targetSector = getSector(industry);
        
        // Find companies in the same broad sector
        const allCompanies = Object.values(db);
        for (const company of allCompanies) {
          if (company.meta.id === symbol || company.meta.id === 'SATYAM.MOCK') continue;
          
          const peerSector = getSector(company.meta.industry);
          if (peerSector === targetSector || (targetSector === 'other' && lowerInd.split(' ')[0] === (company.meta.industry||'').toLowerCase().split(' ')[0])) {
            // Get latest year metrics
            if (!company.history || company.history.length === 0) continue;
            const latest = company.history[company.history.length - 1];
            
            peers.push({
              id: company.meta.id,
              name: company.meta.name,
              industry: company.meta.industry,
              metrics: { ...latest.metrics, ...calculateRatios(latest.metrics) }
            });
            
            if (peers.length >= 5) break; // Limit to 5 peers
          }
        }
      }
    } catch (e) {
      logger.warn(`Local peer discovery failed: ${e.message}`);
    }

    return peers;
  }
}

module.exports = new APIFetcher();
