const express = require("express");
const analyzeRouter = require("./analyze");
const chatRouter = require("./chat");
const sebiFetcher = require("../services/sebi-fetcher");

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "AuditGPT Backend Running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Company autocomplete search
router.get("/api/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ results: [] });
  
  const searchStr = q.trim().toLowerCase();
  let results = [];

  // MOCK Frauds manually injected
  if ("satyam computer services".includes(searchStr)) {
    results.push({ symbol: 'SATYAM.MOCK', name: 'Satyam Computer Services', exchange: 'BSE', type: 'Historical Fraud Pattern' });
  }
  if ("il&fs".includes(searchStr) || "ilfs".includes(searchStr) || "infrastructure leasing".includes(searchStr)) {
    results.push({ symbol: 'ILFS.MOCK', name: 'Infrastructure Leasing & Financial Services (IL&FS)', exchange: 'BSE', type: 'Historical Fraud Pattern' });
  }
  if ("dhfl".includes(searchStr) || "dewan housing".includes(searchStr)) {
    results.push({ symbol: 'DHFL.MOCK', name: 'Dewan Housing Finance Corporation Ltd. (DHFL)', exchange: 'BSE', type: 'Historical Fraud Pattern' });
  }
  if ("yes bank".includes(searchStr) || "yesbank".includes(searchStr)) {
    results.push({ symbol: 'YESBANK.MOCK', name: 'Yes Bank Limited (Historical Crisis)', exchange: 'BSE', type: 'Historical Fraud Pattern' });
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '../data/sebi-db.json');
    if (fs.existsSync(dbPath)) {
      const rawData = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(rawData);
      
      // Filter local SEBI DB companies
      const dbResults = Object.values(db)
        .map(entry => entry.meta || entry) // Fallback because inject script didn't nest under meta
        .filter(c => 
          (c.id && c.id.toLowerCase().includes(searchStr)) || 
          (c.name && c.name.toLowerCase().includes(searchStr))
        )
        .slice(0, 10)
        .map(c => ({
          symbol: c.id,
          name: c.name,
          exchange: c.exchange || 'NSE',
          type: c.industry || 'SEBI 10-Year History'
        }));
      
      results = [...results, ...dbResults];
      
      // Deduplicate by symbol
      results = Array.from(new Map(results.map(item => [item.symbol, item])).values());
    }
  } catch (e) {}
  
  res.json({ results });
});

// Analysis route
router.use("/api", analyzeRouter);

// AI Chat route
router.use("/api", chatRouter);

module.exports = router;
