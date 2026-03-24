const express = require("express");
const router = express.Router();
const sebiFetcher = require("../services/sebi-fetcher");
const pdfParser = require("../services/pdf-parser");
const {
  calculateRatios,
  buildMetricsTimeseries,
} = require("../services/metrics-calculator");
const { calculatePeerBenchmarks } = require("../services/peer-benchmark");
const groqAI = require("../services/groq-ai");
const { generateReport } = require("../services/report-generator");
const { validateCompanyInput } = require("../utils/validators");
const { createLogger } = require("../utils/logger");
const { ANALYSIS_TIMEOUT } = require("../config/constants");

const logger = createLogger("AnalyzeRoute");

/**
 * POST /api/analyze
 * Main analysis endpoint
 */
router.post("/analyze", async (req, res) => {
  const startTime = Date.now();

  // Set a timeout
  const timeoutHandle = setTimeout(() => {
    if (!res.headersSent) {
      logger.error("Analysis timeout reached");
      res.status(408).json({
        success: false,
        error: "Analysis timed out after 90 seconds.",
        suggestion: "Try: Satyam, Reliance, TCS, HDFC Bank, Infosys",
      });
    }
  }, ANALYSIS_TIMEOUT);

  try {
    // Validate input
    const { company_name_or_cin } = req.body;
    const validation = validateCompanyInput(company_name_or_cin);
    if (!validation.valid) {
      clearTimeout(timeoutHandle);
      return res.status(400).json({
        success: false,
        error: validation.error,
        suggestion: "Try: Satyam, Reliance, TCS, HDFC Bank, Infosys",
      });
    }

    logger.info(`Starting analysis for: ${company_name_or_cin}`);

    // Step 1: Find company
    const company = await sebiFetcher.searchCompany(company_name_or_cin);
    logger.info(`Company found: ${company.name} (${company.id})`);

    // Step 2 & 3: Fetch Live Financial Data from Yahoo Finance
    logger.info(`Fetching live financial data for ${company.id}...`);
    const history = await sebiFetcher.fetchFinancialData(company.id);
    
    // Step 4: Calculate Ratios natively
    const metricsHistory = history.map((h) => ({
      year: h.year,
      metrics: h.metrics,
      auditorNotes: h.auditorNotes,
      ratios: calculateRatios(h.metrics),
      source: h.source,
    }));

    // Step 5: Get Peers
    const peers = await sebiFetcher.getPeerCompanies(company.id, company.industry);
    const benchmarks = calculatePeerBenchmarks(peers, company.industry);

    logger.info(`Using ${peers.length} peer companies for benchmarking`);

    // Step 6: Groq AI (LLaMA 3) 3-turn analysis
    logger.info("Starting Groq AI analysis (3-turns)...");

    const [anomalyData, sentiment] = await Promise.all([
      groqAI.detectAnomalies(metricsHistory, benchmarks, company.industry),
      groqAI.analyzeSentiment(
        metricsHistory.map((m) => ({
          year: m.year,
          auditorNotes: m.auditorNotes,
        }))
      ),
    ]);

    const auditorNotesList = metricsHistory.map((m) => ({
      year: m.year,
      notes: m.auditorNotes?.fullText || "",
      qualification: m.auditorNotes?.qualificationType || "unqualified",
    }));

    const fraudScore = await groqAI.assessFraudRisk(
      anomalyData.anomalies || [],
      metricsHistory,
      auditorNotesList,
      company,
    );

    logger.info(
      `Analysis complete. Fraud risk: ${fraudScore.fraud_risk_score}`,
    );

    // Step 7: Generate report
    const executionTime = Date.now() - startTime;
    const report = generateReport(
      company,
      metricsHistory,
      peers,
      anomalyData,
      fraudScore,
      sentiment,
    );
    report.metadata.execution_time_ms = executionTime;

    clearTimeout(timeoutHandle);

    if (res.headersSent) return;

    return res.status(200).json({
      success: true,
      data: report,
      meta: {
        execution_time_ms: executionTime,
        data_sources: [...new Set(history.map((h) => h.source))],
        warnings: ["Real-time data powered by Yahoo Finance API (4-year limit). Auditor sentiment relies on generic industry benchmarks when PDF SEC/SEBI filings are unavailable."],
      },
    });
  } catch (error) {
    clearTimeout(timeoutHandle);
    logger.error("Analysis failed", {
      error: error.message,
      stack: error.stack,
    });

    if (res.headersSent) return;

    return res.status(500).json({
      success: false,
      error: error.message || "Analysis failed",
      suggestion: "Try: Satyam, TCS, DHFL, IL&FS, Yes Bank",
    });
  }
});

/**
 * POST /api/chat
 * AI forensic deep-dive Q&A using Kimi K2 with full 10-year company context.
 */
router.post("/chat", async (req, res) => {
  const { question, symbol, companyName, industry } = req.body;

  if (!question || !symbol) {
    return res.status(400).json({ success: false, error: "Missing question or symbol." });
  }

  try {
    const history = await sebiFetcher.fetchFinancialData(symbol);

    const compactHistory = history.map(m => ({
      year: m.year,
      rev: m.metrics.revenue ? `₹${(m.metrics.revenue / 1e9).toFixed(1)}B` : null,
      ni: m.metrics.netIncome ? `₹${(m.metrics.netIncome / 1e9).toFixed(1)}B` : null,
      cf: m.metrics.operatingCashFlow ? `₹${(m.metrics.operatingCashFlow / 1e9).toFixed(1)}B` : null,
      debt: m.metrics.totalDebt ? `₹${(m.metrics.totalDebt / 1e9).toFixed(1)}B` : null,
      margin: m.metrics.operatingIncome && m.metrics.revenue
        ? `${((m.metrics.operatingIncome / m.metrics.revenue) * 100).toFixed(1)}%`
        : null,
      auditor: m.auditorNotes?.qualificationType || "unqualified",
    }));

    const prompt = `You are AuditGPT, an expert financial forensics AI with 10-year data for this company.

CRITICAL INSTRUCTION: You MUST respond in plain English prose. DO NOT output JSON. DO NOT use braces { or }. Write your answer as normal paragraphs.

COMPANY: ${companyName || symbol} (${industry || "Unknown Industry"})

10-YEAR FINANCIAL DATA:
${JSON.stringify(compactHistory, null, 1)}

USER QUESTION: ${question}

Start your analysis immediately in plain text paragraphs. No JSON. No code blocks.`;

    const rawAnswer = await groqAI._generateText(prompt);
    const answer = rawAnswer.replace(/```[a-z]*\n?/g, "").trim();

    return res.json({ success: true, answer });
  } catch (err) {
    logger.error("Chat failed", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
