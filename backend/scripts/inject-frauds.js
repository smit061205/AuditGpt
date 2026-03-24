const fs = require('fs');
const { satyamFilings } = require('../src/mock-data/satyam-filings');
const path = require('path');

const dbPath = path.join(__dirname, '../src/data/sebi-db.json');

function generateHistory(baseYear, startValues, modifiers) {
  const history = [];
  let current = { ...startValues };

  for (let i = 0; i < 10; i++) {
    const year = baseYear + i;
    const mod = modifiers[i] || {};
    
    const revMulti = mod.revMulti !== undefined ? mod.revMulti : 1.1;
    const niMulti = mod.niMulti !== undefined ? mod.niMulti : 1.05;
    const debtMulti = mod.debtMulti !== undefined ? mod.debtMulti : 1.15;
    
    // specifically control CF
    if (mod.ocfSet !== undefined) {
      current.operatingCashFlow = mod.ocfSet;
    } else {
      const ocfMulti = mod.ocfMulti !== undefined ? mod.ocfMulti : 1.02;
      current.operatingCashFlow = current.operatingCashFlow * ocfMulti;
    }
    
    // specifically control RPT
    if (mod.rptSet !== undefined) {
      current.relatedPartyTransactions = mod.rptSet;
    } else {
      const rptMulti = mod.rptMulti !== undefined ? mod.rptMulti : 1.05;
      current.relatedPartyTransactions = current.relatedPartyTransactions * rptMulti;
    }

    current.revenue = current.revenue * revMulti;
    current.netIncome = current.netIncome * niMulti;
    current.totalDebt = current.totalDebt * debtMulti;

    const metrics = {
      revenue: Math.round(current.revenue),
      netIncome: Math.round(current.netIncome),
      operatingIncome: Math.round(current.revenue * 0.15),
      totalAssets: Math.round(current.revenue * 2.5),
      totalLiabilities: Math.round(current.revenue * 2.2 + current.totalDebt),
      operatingCashFlow: Math.round(current.operatingCashFlow),
      freeCashFlow: Math.round(current.operatingCashFlow - current.revenue * 0.05),
      totalDebt: Math.round(current.totalDebt),
      equity: Math.round(current.revenue * 0.3), // FIX: changed from totalEquity
      currentAssets: Math.round(current.revenue * 1.2),
      currentLiabilities: Math.round(current.revenue * 0.8),
      relatedPartyTransactions: Math.round(current.relatedPartyTransactions), // FIX: added RPT
      currentRatio: typeof mod.cr !== 'undefined' ? mod.cr : 1.5 // FIX: added CR
    };

    history.push({
      year,
      source: "SEBI XBRL Archive",
      metrics,
      auditorNotes: {
        qualificationType: mod.qualificationType || "unqualified",
        keyPhrases: [mod.kam || "presents fairly"],
        hedgingScore: mod.hedgingScore || 0.05,
        fullText: mod.auditorText || "The financial statements present a true and fair view in accordance with accounting standards."
      }
    });
  }

  return history;
}

// IL&FS matches the extreme RPT bloat + hedging trend + CF collapse
const ilfsHistory = generateHistory(2009, 
  { revenue: 40000000000, netIncome: 3000000000, totalDebt: 150000000000, operatingCashFlow: 5000000000, relatedPartyTransactions: 1000000000 },
  [
    { }, // 2009
    { }, // 2010
    { }, // 2011
    { debtMulti: 1.25, niMulti: 1.1, rptMulti: 1.5 }, // 2012
    { debtMulti: 1.3, ocfSet: 1000000000, rptMulti: 1.8 }, // 2013 - Debt growing, CF diving, RPT exploding
    { debtMulti: 1.35, ocfSet: -2000000000, rptMulti: 2.0, qualificationType: "emphasis_of_matter", hedgingScore: 0.4, kam: "significant increase in short-term borrowings funding long-term assets.", auditorText: "We draw attention to the substantial related party advances..." }, // 2014
    { debtMulti: 1.4, ocfSet: -5000000000, rptMulti: 2.2, cr: 0.7 }, // 2015 
    { revMulti: 1.05, niMulti: 1.2, debtMulti: 1.45, ocfSet: -8000000000, rptMulti: 2.5, qualificationType: "qualified", hedgingScore: 0.7, auditorText: "Management's assessment of going concern relies heavily on asset monetization plans which face uncertain timelines." }, // 2016 
    { revMulti: 0.9, niMulti: 0.1, debtMulti: 1.5, ocfSet: -12000000000, rptMulti: 3.0, cr: 0.5, qualificationType: "qualified", hedgingScore: 0.8, kam: "rollover risk of commercial paper" }, // 2017
    { revMulti: 0.5, niMulti: -5.0, debtMulti: 1.1, ocfSet: -25000000000, rptSet: 80000000000, cr: 0.2, qualificationType: "adverse", hedgingScore: 0.95, kam: "multiple defaults on debt obligations", auditorText: "Material uncertainty regarding the entity's ability to continue as a going concern. Unsecured related party loans have no clear repayment timeline." } // 2018 - Collapse
  ]
);

// DHFL matches aggressive phantom revenue + massive RPT + extreme leverage
const dhflHistory = generateHistory(2010,
  { revenue: 25000000000, netIncome: 2000000000, totalDebt: 75000000000, operatingCashFlow: 2000000000, relatedPartyTransactions: 500000000 },
  [
    { }, // 2010
    { }, // 2011
    { debtMulti: 1.3, rptMulti: 1.2 }, // 2012
    { debtMulti: 1.4, rptMulti: 1.5 }, // 2013
    { debtMulti: 1.4, rptMulti: 1.8, ocfSet: 1000000000 }, // 2014
    { debtMulti: 1.3, revMulti: 1.2, niMulti: 1.2, rptMulti: 2.0, ocfSet: -1000000000 }, // 2015 - aggressive loan book expansion, CF turns negative
    { debtMulti: 1.35, rptMulti: 2.5, ocfSet: -5000000000, hedgingScore: 0.4, kam: "review of related party transactions and loans to project SPVs." }, // 2016 
    { debtMulti: 1.4, revMulti: 1.25, niMulti: 1.3, rptMulti: 3.0, ocfSet: -8000000000, cr: 0.6, qualificationType: "emphasis_of_matter", hedgingScore: 0.5, auditorText: "Attention is drawn to the high concentration of loans to certain promoter-linked entities, categorized as standard assets." }, // 2017
    { debtMulti: 1.2, revMulti: 0.8, niMulti: -0.5, rptMulti: 4.0, ocfSet: -15000000000, cr: 0.4, qualificationType: "qualified", hedgingScore: 0.8, kam: "inadequate provisioning for NPAs and inter-corporate deposits." }, // 2018
    { debtMulti: 1.05, revMulti: 0.4, niMulti: -10.0, rptSet: 120000000000, ocfSet: -30000000000, cr: 0.1, qualificationType: "adverse", hedgingScore: 0.95, kam: "fraudulent diversion of funds alleged", auditorText: "Fraudulent diversion of funds alleged through shell companies. Severe asset-liability mismatch resulting in debt defaults." } // 2019 - Collapse
  ]
);

// YESBANK matches reckless loan growth + NPA suppression + ultimate crash
const yesbankHistory = generateHistory(2011,
  { revenue: 50000000000, netIncome: 5000000000, totalDebt: 200000000000, operatingCashFlow: 3000000000, relatedPartyTransactions: 200000000 },
  [
    { }, // 2011
    { }, // 2012
    { revMulti: 1.2, niMulti: 1.2, debtMulti: 1.3 }, // 2013 - starting aggressive growth
    { revMulti: 1.25, niMulti: 1.25, debtMulti: 1.35, ocfMulti: 0.8 }, // 2014 - profit looks great, cash flow lagging
    { revMulti: 1.3, niMulti: 1.3, debtMulti: 1.4, ocfSet: -10000000000, cr: 0.8 }, // 2015 - aggressive lending, NPA suppression begins
    { revMulti: 1.35, niMulti: 1.35, debtMulti: 1.45, ocfSet: -30000000000, cr: 0.7, hedgingScore: 0.3, kam: "divergence in asset classification" }, // 2016 
    { revMulti: 1.4, niMulti: 1.4, debtMulti: 1.5, ocfSet: -80000000000, cr: 0.6, qualificationType: "emphasis_of_matter", hedgingScore: 0.6, auditorText: "Attention is drawn to the RBI's risk assessment report indicating divergence in reported NPAs." }, // 2017
    { revMulti: 1.2, niMulti: 0.5, debtMulti: 1.4, ocfSet: -150000000000, cr: 0.5, qualificationType: "qualified", hedgingScore: 0.8, kam: "significant under-reporting of non-performing advances" }, // 2018 - RBI crackdown
    { revMulti: 0.8, niMulti: -10.0, debtMulti: 1.2, ocfSet: -200000000000, cr: 0.3, qualificationType: "adverse", hedgingScore: 0.95, kam: "material uncertainty on going concern", auditorText: "Severe deterioration of asset quality and liquidity constraints. The bank has breached regulatory capital requirements." }, // 2019 - Write-offs
    { revMulti: 0.5, niMulti: -30.0, debtMulti: 1.1, ocfSet: -250000000000, cr: 0.1, qualificationType: "adverse", hedgingScore: 0.99, kam: "moratorium imposed by RBI", auditorText: "The bank has been placed under moratorium by the RBI superseding the board of directors. Severe going-concern failure." } // 2020 - Collapse/Bailout
  ]
);

try {
  let db = {};
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }

  db["ILFS.MOCK"] = {
    meta: {
      id: "ILFS.MOCK",
      name: "Infrastructure Leasing & Financial Services (IL&FS)",
      cin: "ILFS.MOCK",
      industry: "Infrastructure Finance",
      exchange: "BSE"
    },
    history: ilfsHistory
  };

  db["SATYAM.MOCK"] = {
    meta: {
      id: "SATYAM.MOCK",
      name: "Satyam Computer Services (Historical Fraud)",
      cin: "SATYAM.MOCK",
      industry: "Information Technology Services",
      exchange: "BSE"
    },
    history: satyamFilings
  };

  db["YESBANK.MOCK"] = {
    meta: {
      id: "YESBANK.MOCK",
      name: "Yes Bank Limited (Historical Crisis)",
      cin: "YESBANK.MOCK",
      industry: "Banks—Regional",
      exchange: "BSE"
    },
    history: yesbankHistory
  };

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log("✅ Successfully injected SATYAM, IL&FS, DHFL, and Yes Bank into sebi-db.json");
} catch (e) {
  console.error("Failed to inject data:", e);
}
