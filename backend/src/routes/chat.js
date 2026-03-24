const express = require("express");
const router = express.Router();
const groqAI = require("../services/groq-ai");
const sebiFetcher = require("../services/sebi-fetcher");
const { createLogger } = require("../utils/logger");
const logger = createLogger("ChatRoute");

/**
 * POST /api/chat
 * AI deep-dive endpoint: answers follow-up questions about a company using its full 10-year context.
 */
router.post("/chat", async (req, res) => {
  const { question, symbol, companyName, industry } = req.body;

  if (!question || !symbol) {
    return res.status(400).json({ success: false, error: "Missing question or symbol." });
  }

  try {
    // Fetch the company's full financial history for context
    const history = await sebiFetcher.fetchFinancialData(symbol);

    // Build a compact but rich summary to stay within 1K TPM
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

    const prompt = `You are AuditGPT, an expert financial forensics AI. You have full access to the 10-year financial history of the company below.

Answer the user's question in a clear, professional, forensic accounting style. Be specific and cite years/metrics where relevant. Keep response to 3-5 paragraphs max.

COMPANY: ${companyName || symbol} (${industry || "Unknown Industry"})

10-YEAR FINANCIAL SUMMARY (Revenue, Net Income, Cash Flow, Debt, Operating Margin, Auditor status):
${JSON.stringify(compactHistory, null, 1)}

USER QUESTION: ${question}

Respond in plain text (no JSON). Be direct and grounded in the numbers above. Start your response directly with the answer.`;

    const answer = await groqAI._generateContentWithRetry(prompt);
    // Strip JSON formatting if model wraps it despite instructions
    const clean = answer.replace(/```[a-z]*\n?/g, "").trim();

    return res.json({ success: true, answer: clean });
  } catch (err) {
    logger.error("Chat failed", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
