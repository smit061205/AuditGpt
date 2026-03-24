const { GoogleGenAI } = require("@google/genai");
const { createLogger } = require("../utils/logger");
const config = require("../config/env");

const logger = createLogger("GeminiAI");

class GeminiAIService {
  constructor() {
    this.client = config.GEMINI_API_KEY
      ? new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })
      : null;
    // Flash Lite models have massively expanded free-tier quotas (1500+ RPD).
    this.MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest'];
  }

  /**
   * Robust wrapper to execute Gemini requests with automatic retries and model fallbacks
   */
  async _generateContentWithRetry(prompt, maxRetries = 4) {
    let lastError;
    // Try each model in sequence
    for (const modelName of this.MODELS) {
      // Try multiple times per model for transient network issues
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          });
          return response.text;
        } catch (err) {
          lastError = err;
          const errMsg = err.message || "";
          
          // If the model simply doesn't exist for this key, move to next model instantly
          if (errMsg.includes("404") || errMsg.includes("not found")) {
            logger.warn(`Model ${modelName} unavailable. Falling back to next model...`);
            break; 
          }

          // If it's a 429 RPM Quota limit, Google tells us exactly how long to wait
          let waitSeconds = 15 * attempt; // Default fallback wait is longer to clear 1-min RPM limits
          const retryMatch = errMsg.match(/retryDelay(.*?)(\\d+)s/i) || errMsg.match(/retry in (\\d+)\\./i);
          if (retryMatch) {
            waitSeconds = parseInt(retryMatch[2] || retryMatch[1], 10) + 1; // Add 1s buffer
          }

          if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            logger.warn(`Gemini Free Tier RPM limit reached on ${modelName}. Waiting ${waitSeconds} seconds to resume...`);
          } else {
            logger.warn(`Gemini API transient failure on ${modelName} (attempt ${attempt}): ${errMsg.slice(0, 100)}. Retrying in ${waitSeconds}s...`);
          }

          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, waitSeconds * 1000));
          } else {
            // Once we run out of retries, we effectively failed the rate limit window
            if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
              throw new Error("Gemini API Free Tier limits persistently exhausted. Rate limit failed to clear.");
            }
          }
        }
      }
    }
    throw new Error(`All models and retries failed. Last error: ${lastError?.message}`);
  }

  /**
   * Turn 1: Detect anomalies in financial data
   * @param {Array} metricsHistory
   * @param {object} peerBenchmarks
   * @param {string} industryContext
   * @returns {Promise<object>}
   */
  async detectAnomalies(metricsHistory, peerBenchmarks, industryContext) {
    logger.info("Detecting anomalies with Gemini AI");

    if (!this.client) {
      logger.warn("Gemini API key not set, using rule-based anomaly detection");
      return this._ruleBasedAnomalyDetection(
        metricsHistory,
        peerBenchmarks,
        industryContext,
      );
    }

const prompt = `You are a financial forensics expert specializing in anomaly detection.

Analyze this company's financial history and identify anomalies that:
1. Deviate from the company's own historical trend
2. Deviate from industry peer norms

IMPORTANT DATA CONTEXT: 
This data is pulled from a limited public API (Yahoo Finance) which often returns $0 or null for specific granular fields like "Related Party Transactions", "Auditor Fees", or "Investing Cash Flow". 
DO NOT flag constant $0 values in these specific fields as "data manipulation" or "missing data anomalies" - they are simply API limitations. Focus strictly on major trends in Revenue, Profit Margin, Debt, and Operating Cash Flow.

COMPANY METRICS HISTORY:
${JSON.stringify(metricsHistory, null, 2)}

INDUSTRY PEER BENCHMARKS:
${JSON.stringify(peerBenchmarks, null, 2)}

INDUSTRY: ${industryContext}

For EACH anomaly detected, provide:
- Metric name
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
}`;

    try {
      const text = await this._generateContentWithRetry(prompt);
      const parsed = this._parseJSON(text);
      logger.info(`Detected ${parsed?.anomalies?.length || 0} anomalies`);
      return parsed || { anomalies: [] };
    } catch (err) {
      logger.error("Gemini anomaly detection failed", { error: err.message });
      return this._ruleBasedAnomalyDetection(
        metricsHistory,
        peerBenchmarks,
        industryContext,
      );
    }
  }

  /**
   * Turn 2: Assess fraud risk based on anomalies
   * @param {Array} anomalies
   * @param {Array} metricsHistory
   * @param {Array} auditorNotes
   * @param {object} company
   * @returns {Promise<object>}
   */
  async assessFraudRisk(anomalies, metricsHistory, auditorNotes, company) {
    logger.info("Assessing fraud risk with Gemini AI");

    if (!this.client) {
      logger.warn(
        "Gemini API key not set, using rule-based fraud risk assessment",
      );
      return this._ruleBasedFraudRisk(
        anomalies,
        metricsHistory,
        auditorNotes,
        company,
      );
    }

    const prompt = `You are an expert forensic accountant with experience investigating major corporate frauds.

Based on these financial anomalies, auditor notes, and known fraud patterns, assess the fraud risk.

KNOWN FRAUD PATTERNS TO CHECK:
1. Revenue growing rapidly while cash flow declines (Satyam 2008)
2. Debt restructured into creative/complex instruments
3. Asset quality deteriorating while profitability stays stable
4. Large one-time gains masking operating losses

IMPORTANT CONTEXT: 
This data is sourced from a limited public API (Yahoo Finance). It often returns $0 for granular fields like "Related Party Transactions" or generates static generic Auditor Notes if real SEC PDFs aren't available. 
DO NOT flag $0 Related Party Transactions, $0 Investing Cash Flow, or static Auditor Notes as "pervasive data manipulation". They are API limitations. 
Only flag true financial degradation in Revenue, Operating Cash Flow, margins, and Debt-to-Equity.

ANOMALIES DETECTED:
${JSON.stringify(anomalies, null, 2)}

METRICS HISTORY (last 3 years):
${JSON.stringify(metricsHistory.slice(-3), null, 2)}

AUDITOR NOTES PROGRESSION:
${JSON.stringify(auditorNotes, null, 2)}

COMPANY: ${company.name} (${company.industry})

Return ONLY valid JSON:
{
  "fraud_risk_score": "Low" | "Medium" | "High" | "Critical",
  "fraud_likelihood_0_to_1": 0.85,
  "reasoning": "3-4 sentences explaining the risk assessment",
  "top_risk_factors": ["factor1", "factor2", "factor3"],
  "matched_fraud_patterns": ["pattern1", "pattern2"],
  "recommendation": "Immediate detailed audit recommended"
}`;

    try {
      const text = await this._generateContentWithRetry(prompt);
      const parsed = this._parseJSON(text);
      logger.info(`Fraud risk assessment: ${parsed?.fraud_risk_score}`);
      return parsed || this._defaultFraudAssessment();
    } catch (err) {
      logger.error("Gemini fraud risk assessment failed", {
        error: err.message,
      });
      return this._ruleBasedFraudRisk(
        anomalies,
        metricsHistory,
        auditorNotes,
        company,
      );
    }
  }

  /**
   * Turn 3: Analyze auditor sentiment progression
   * @param {Array} auditorNotesList
   * @returns {Promise<object>}
   */
  async analyzeSentiment(auditorNotesList) {
    logger.info("Analyzing auditor sentiment with Gemini AI");

    if (!this.client) {
      logger.warn(
        "Gemini API key not set, using rule-based sentiment analysis",
      );
      return this._ruleBasedSentiment(auditorNotesList);
    }

    const prompt = `You are analyzing the progression of auditor language from financial audit reports.

Track how auditor confidence changed from:
- Confident/Unqualified (no concerns)
- Hedged (using "subject to", "we believe")
- Concerned (qualified opinions, reservations)
- Alarmed (adverse opinions, disclaimers)

AUDITOR NOTES BY YEAR:
${JSON.stringify(auditorNotesList, null, 2)}

For EACH year, identify:
1. Overall sentiment: "confident" | "hedged" | "concerned" | "alarmed"
2. Hedging score: 0 (very confident) to 1 (very hedged)
3. Key phrases indicating concern

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
}`;

    try {
      const text = await this._generateContentWithRetry(prompt);
      const parsed = this._parseJSON(text);
      return parsed || this._ruleBasedSentiment(auditorNotesList);
    } catch (err) {
      logger.error("Gemini sentiment analysis failed", { error: err.message });
      return this._ruleBasedSentiment(auditorNotesList);
    }
  }

  /** Parse JSON safely from response */
  _parseJSON(text) {
    try {
      const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          /* ignore */
        }
      }
      return null;
    }
  }

  /** Rule-based anomaly detection fallback */
  _ruleBasedAnomalyDetection(metricsHistory, peerBenchmarks, industry) {
    const anomalies = [];
    const sorted = [...metricsHistory].sort((a, b) => a.year - b.year);
    let id = 0;

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const prev = sorted[i - 1];
      const m = curr.metrics;
      const pm = prev.metrics;

      if (
        m.revenue &&
        pm.revenue &&
        m.operatingCashFlow !== undefined &&
        pm.operatingCashFlow !== undefined
      ) {
        const revGrowth = (m.revenue - pm.revenue) / Math.abs(pm.revenue);
        const cfGrowth =
          (m.operatingCashFlow - pm.operatingCashFlow) /
          Math.abs(pm.operatingCashFlow || 1);
        if (revGrowth > 0.1 && cfGrowth < -0.2) {
          anomalies.push({
            id: id++,
            metric: "Revenue vs Cash Flow Divergence",
            year_detected: curr.year,
            deviation_percent: Math.round((revGrowth - cfGrowth) * 100),
            severity: cfGrowth < -0.5 ? "Critical" : "High",
            description: `Revenue grew ${(revGrowth * 100).toFixed(0)}% but operating cash flow declined ${Math.abs(cfGrowth * 100).toFixed(0)}%`,
            vs_peer_context: `${industry} peers maintain positive CF growth when revenue grows. This divergence is a classic fraud indicator.`,
            filing_reference: `${curr.year} Annual Report, Cash Flow Statement`,
          });
        }
      }

      if (m.relatedPartyTransactions && pm.relatedPartyTransactions) {
        const rptGrowth =
          (m.relatedPartyTransactions - pm.relatedPartyTransactions) /
          pm.relatedPartyTransactions;
        if (rptGrowth > 1.5) {
          anomalies.push({
            id: id++,
            metric: "Related Party Transaction Surge",
            year_detected: curr.year,
            deviation_percent: Math.round(rptGrowth * 100),
            severity: rptGrowth > 3 ? "Critical" : "High",
            description: `Related party transactions increased by ${(rptGrowth * 100).toFixed(0)}% in a single year`,
            vs_peer_context: `RPT growth far exceeds core business growth. This pattern matches known fraud cases.`,
            filing_reference: `${curr.year} Annual Report, Notes to Accounts`,
          });
        }
      }

      if (m.totalDebt && pm.totalDebt && m.equity && pm.equity) {
        const debtGrowth = (m.totalDebt - pm.totalDebt) / pm.totalDebt;
        const equityGrowth = (m.equity - pm.equity) / Math.abs(pm.equity);
        if (debtGrowth > 0.5 && debtGrowth > equityGrowth * 2) {
          anomalies.push({
            id: id++,
            metric: "Debt Growing Faster Than Equity",
            year_detected: curr.year,
            deviation_percent: Math.round((debtGrowth - equityGrowth) * 100),
            severity: debtGrowth > 1.0 ? "High" : "Medium",
            description: `Total debt grew ${(debtGrowth * 100).toFixed(0)}% while equity grew only ${(equityGrowth * 100).toFixed(0)}%`,
            vs_peer_context: `Sustained debt growth exceeding equity is a leverage risk indicator.`,
            filing_reference: `${curr.year} Annual Report, Balance Sheet`,
          });
        }
      }
    }

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const prev = sorted[i - 1];
      const currAudit = curr.auditorNotes;
      const prevAudit = prev.auditorNotes;
      if (currAudit && prevAudit) {
        const currScore = currAudit.hedgingScore || 0;
        const prevScore = prevAudit.hedgingScore || 0;
        if (currScore > prevScore + 0.3) {
          anomalies.push({
            id: id++,
            metric: "Auditor Concern Escalation",
            year_detected: curr.year,
            deviation_percent: Math.round((currScore - prevScore) * 100),
            severity:
              currScore > 0.8
                ? "Critical"
                : currScore > 0.5
                  ? "High"
                  : "Medium",
            description: `Auditor hedging score jumped from ${prevScore.toFixed(2)} to ${currScore.toFixed(2)}. Opinion: ${currAudit.qualificationType}`,
            vs_peer_context: `Peers typically maintain unqualified opinions. Escalating auditor concern is a serious red flag.`,
            filing_reference: `${curr.year} Annual Report, Auditor's Report`,
          });
        }
      }
    }

    return { anomalies };
  }

  /** Rule-based fraud risk assessment fallback */
  _ruleBasedFraudRisk(anomalies, metricsHistory, auditorNotes, company) {
    const criticalCount = anomalies.filter(
      (a) => a.severity === "Critical",
    ).length;
    const highCount = anomalies.filter((a) => a.severity === "High").length;
    const totalScore = criticalCount * 3 + highCount * 1;

    let fraud_risk_score, fraud_likelihood_0_to_1;
    if (totalScore >= 6) {
      fraud_risk_score = "Critical";
      fraud_likelihood_0_to_1 = 0.85;
    } else if (totalScore >= 3) {
      fraud_risk_score = "High";
      fraud_likelihood_0_to_1 = 0.65;
    } else if (totalScore >= 1) {
      fraud_risk_score = "Medium";
      fraud_likelihood_0_to_1 = 0.4;
    } else {
      fraud_risk_score = "Low";
      fraud_likelihood_0_to_1 = 0.1;
    }

    const topRiskFactors = anomalies
      .slice(0, 3)
      .map((a) => a.metric + ": " + a.description.slice(0, 60));
    const matchedPatterns = [];
    if (anomalies.some((a) => a.metric.includes("Cash Flow")))
      matchedPatterns.push("Revenue↑ but CF↓ disparity");
    if (anomalies.some((a) => a.metric.includes("Related Party")))
      matchedPatterns.push("RPT growth outpacing core business");
    if (anomalies.some((a) => a.metric.includes("Auditor")))
      matchedPatterns.push("Auditor language deterioration");

    return {
      fraud_risk_score,
      fraud_likelihood_0_to_1,
      reasoning: `Analysis of ${company.name} (${company.industry}) identified ${anomalies.length} anomalies including ${criticalCount} critical flags. ${matchedPatterns.length > 0 ? `Patterns match known risk factors: ${matchedPatterns.join(", ")}.` : ""} Risk assessment based on rule-based analysis (Gemini AI temporarily overloaded).`,
      top_risk_factors:
        topRiskFactors.length > 0
          ? topRiskFactors
          : ["No major risk factors detected"],
      matched_fraud_patterns: matchedPatterns,
      recommendation:
        fraud_risk_score === "Critical"
          ? "Immediate detailed audit recommended"
          : fraud_risk_score === "High"
            ? "Detailed review recommended"
            : fraud_risk_score === "Medium"
              ? "Monitor closely"
              : "Unlikely fraud - continue standard monitoring",
    };
  }

  /** Rule-based sentiment analysis fallback */
  _ruleBasedSentiment(auditorNotesList) {
    const trend = auditorNotesList.map((n) => {
      const score = n.auditorNotes?.hedgingScore || n.hedgingScore || 0.05;
      const sentiment =
        score > 0.8
          ? "alarmed"
          : score > 0.5
            ? "concerned"
            : score > 0.2
              ? "hedged"
              : "confident";
      return {
        year: n.year,
        sentiment,
        hedging_score: score,
        key_phrases: n.auditorNotes?.keyPhrases || [],
        summary: n.auditorNotes?.fullText?.slice(0, 100) || "No notes",
      };
    });

    const lastScore =
      trend.length > 0 ? trend[trend.length - 1].hedging_score : 0;
    const firstScore = trend.length > 0 ? trend[0].hedging_score : 0;
    const escalation =
      lastScore > firstScore + 0.5
        ? "High - significant deterioration"
        : lastScore > firstScore + 0.2
          ? "Moderate - gradual increase in hedging"
          : "Low - stable confidence level";

    return {
      sentiment_trend: trend,
      trend_summary: `Auditor confidence analysis over ${trend.length} years shows ${escalation.toLowerCase()}.`,
      concern_escalation: escalation,
    };
  }

  _defaultFraudAssessment() {
    return {
      fraud_risk_score: "Medium",
      fraud_likelihood_0_to_1: 0.3,
      reasoning:
        "Risk assessment unavailable due to API error. Manual review recommended.",
      top_risk_factors: ["AI analysis unavailable"],
      matched_fraud_patterns: [],
      recommendation: "Manual review recommended",
    };
  }
}

module.exports = new GeminiAIService();
