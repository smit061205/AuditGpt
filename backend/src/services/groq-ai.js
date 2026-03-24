const Groq = require("groq-sdk");
const { createLogger } = require("../utils/logger");
const config = require("../config/env");

const logger = createLogger("GroqAI");

class GroqAIService {
  constructor() {
    this.client = config.GROQ_API_KEY
      ? new Groq({ apiKey: config.GROQ_API_KEY })
      : null;
    // Try Kimi K2 first (1T MoE, best quality). LLaMA 70B as fallback, 8B as last resort.
    // Try both namespaced and short-form IDs because Groq's behavior varies.
    this.MODELS = [
      "moonshotai/kimi-k2-instruct-0905",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ];
  }

  /**
   * Core request wrapper with retry + model fallback logic.
   * Returns structured JSON — used for anomaly detection, sentiment, fraud risk turns.
   */
  async _generateContentWithRetry(prompt, maxRetries = 3) {
    return this._generate(prompt, true, maxRetries);
  }

  /**
   * Plain-text generation — used for conversational AI chat responses.
   */
  async _generateText(prompt, maxRetries = 3) {
    return this._generate(prompt, false, maxRetries);
  }

  /**
   * Shared generation core.
   */
  async _generate(prompt, jsonMode = true, maxRetries = 3) {
    if (!this.client) throw new Error("Groq client not initialized.");
    let lastError;

    for (const modelName of this.MODELS) {
      logger.info(`[MODEL ATTEMPT] Trying: ${modelName}`);
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const requestOptions = {
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          };
          if (jsonMode) requestOptions.response_format = { type: "json_object" };

          const response = await this.client.chat.completions.create(requestOptions);
          logger.info(`[MODEL SUCCESS] Used: ${modelName}`);
          return response.choices[0].message.content;
        } catch (err) {
          lastError = err;
          const errMsg = err.message || "";

          if (errMsg.includes("404") || errMsg.includes("not found")) {
            logger.warn(`[MODEL SKIP] ${modelName} — 404 model not found. Trying next...`);
            break;
          }
          if (errMsg.includes("400") && errMsg.includes("Failed to generate JSON")) {
            logger.warn(`[JSON FORMAT ERROR] ${modelName} rejected JSON generation. Retrying...`);
            // Try forcing it through by skipping response_format for this specific attempt if jsonMode is true
            if (jsonMode) jsonMode = false;
          }

          const waitSeconds = 2 * attempt;
          if (errMsg.includes("429") || errMsg.toLowerCase().includes("rate limit")) {
            logger.warn(`[RATE LIMIT] ${modelName}. Waiting ${waitSeconds}s...`);
          } else {
            logger.warn(
              `[MODEL FAIL] ${modelName} attempt ${attempt}: ${errMsg.slice(0, 120)}. Retrying in ${waitSeconds}s...`
            );
          }

          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, waitSeconds * 1000));
          }
        }
      }
    }
    throw new Error(`All Groq models failed. Last error: ${lastError?.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Turn 1: Anomaly Detection
  // ─────────────────────────────────────────────────────────────────────────
  async detectAnomalies(metricsHistory, peerBenchmarks, industryContext) {
    logger.info("Detecting anomalies with Groq AI (Kimi K2)");

    if (!this.client) {
      logger.warn("Groq API key not set — using rule-based anomaly detection.");
      return this._ruleBasedAnomalyDetection(metricsHistory, peerBenchmarks, industryContext);
    }

    const isBank = /bank|nbc|financ|credit|nbfc/i.test(industryContext || '');

    const simplifiedMetrics = metricsHistory.map(m => ({
      year: m.year,
      rev: m.metrics.revenue,
      opMargin: m.metrics.operatingIncome && m.metrics.revenue
        ? +((m.metrics.operatingIncome / m.metrics.revenue) * 100).toFixed(1)
        : null,
      cf: m.metrics.operatingCashFlow,
      debt: m.metrics.totalDebt,
      eq: m.metrics.equity,
      ni: m.metrics.netIncome,
      rpt: m.metrics.relatedPartyTransactions,
      cr: m.metrics.currentRatio
    }));

    const prompt = `You are a financial forensics expert. You MUST respond with valid JSON only.

Analyse this company for GENUINE FRAUD INDICATORS only.

CRITICAL RULES (violating them makes the analysis useless):
1. Return AT MOST 6 anomalies total. Only the most significant ones.
2. A metric ABOVE the sector peer MEDIAN is NEVER a fraud anomaly.
3. Normal business cycles (revenue dips, margin fluctuations ±5%) are NOT fraud.
4. Only flag a metric that is CLEARLY AND CONSISTENTLY below peer median for 2+ years.
5. Severity: "Critical" = >50% below peer median for 2+ years. "High" = 25-50% below. "Medium" = 10-25% below. "Low" = minor.
6. ${isBank ? 'BANKING/NBFC SPECIFIC: High absolute debt is normal. However, if Cash Flow is violently NEGATIVE while Debt grows, or if Related Party Transactions explode, that is SEVERE FRAUD. Do not ignore negative cash-flows or auditor warnings just because it is a bank.' : 'Flag high debt only if it exceeds the sector peer median by >50% with no revenue growth.'}
7. EXTREMELY IMPORTANT: If the company has stable positive Cash Flows, clean auditor notes, and consistent profitability — it is a HEALTHY COMPANY. Return {"anomalies": []} and do not invent problems.
8. Do not flag "revenue growth slowing down" as fraud. That is normal economics.

REAL FRAUD PATTERNS (only flag if actually present in the data):
- Cash flow FALLING while revenue is SURGING (Satyam pattern)
- Related-party transactions (rpt) growing >50% faster than revenue over 3+ years
- Debt surging with zero corresponding revenue or asset growth
- Operating margin collapsing suddenly by >15% in one year

COMPANY DATA (10-year metrics):
${JSON.stringify(simplifiedMetrics)}

INDUSTRY PEER BENCHMARKS (do NOT flag company if it beats these):
${JSON.stringify(peerBenchmarks, null, 2)}

INDUSTRY: ${industryContext}

Return a JSON object:
{
  "anomalies": [
    {
      "metric": "string",
      "year_detected": 2022,
      "deviation_percent": 45,
      "severity": "Low|Medium|High|Critical",
      "description": "Specific factual description citing actual numbers from the data above",
      "vs_peer_context": "Compare actual value to peer median with exact numbers",
      "filing_reference": "[YEAR] Annual Report, [Statement Name], Section [X]"
    }
  ]
}
If no genuine fraud anomalies found, return {"anomalies": []}.`;

    try {
      const text = await this._generateContentWithRetry(prompt);
      const parsed = this._parseJSON(text);
      // Hard cap: never return more than 6 anomalies
      if (parsed?.anomalies) {
        parsed.anomalies = parsed.anomalies.slice(0, 6);
      }
      logger.info(`Detected ${parsed?.anomalies?.length || 0} anomalies`);
      return parsed || { anomalies: [] };
    } catch (err) {
      logger.error("Groq anomaly detection failed", { error: err.message });
      return this._ruleBasedAnomalyDetection(metricsHistory, peerBenchmarks, industryContext);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Turn 2: Fraud Risk Assessment
  // ─────────────────────────────────────────────────────────────────────────
  async assessFraudRisk(anomalies, metricsHistory, auditorNotes, company) {
    logger.info("Assessing fraud risk with Groq AI");

    if (!this.client) {
      return this._ruleBasedFraudRisk(anomalies, metricsHistory, auditorNotes, company);
    }

    const simplifiedRiskMetrics = metricsHistory.slice(-3).map(m => ({
      year: m.year,
      rev: m.metrics.revenue,
      cf: m.metrics.operatingCashFlow,
      debt: m.metrics.totalDebt
    }));

    const simplifiedNotes = auditorNotes.slice(-3).map(n => ({
      year: n.year,
      note: n.auditorNotes?.fullText?.substring(0, 400) || "Clean."
    }));

    const prompt = `You are an expert forensic accountant. You MUST respond with valid JSON only.

Assess the overall fraud risk for this company.

IMPORTANT CALIBRATION RULES (DO NOT HALLUCINATE RISK):
- "Low" risk (likelihood 0.05-0.15): 0 or 1 minor anomaly, clean auditor notes, steady cash generation. This is the CORRECT result for >80% of companies.
- "Medium" risk (likelihood 0.25-0.40): 2-3 anomalies below peer median, but no auditor alarm and cash flow still positive.
- "High" risk (likelihood 0.50-0.70): 3-4 severe anomalies clearly below peer median, auditor notes beginning to hedge.
- "Critical" risk (likelihood 0.80+): ONLY valid when FIVE OR MORE critical/high anomalies ALL coexist: massive revenue/CF divergence + exploding RPT + auditor alarm. This is the Satyam/IL&FS pattern and applies to <1% of companies.

STRICT FAIL-SAFE: If the ANOMALIES DETECTED list has fewer than 3 items OR no Critical-severity items, the risk CANNOT exceed "Medium" (likelihood < 0.45). Do not assign High or Critical risk to a company with clean,stable financials.

KNOWN FRAUD PATTERNS (must actually match to increase risk significantly):
1. Revenue surging while cash flow declines (Satyam 2008)
2. Related party transactions growing faster than core revenue (IL&FS)
3. Auditor language becoming increasingly hedged/alarmed
4. Debt exploding with no corresponding business growth
5. Sudden large unexplained write-offs or asset impairments

ANOMALIES DETECTED:
${JSON.stringify(anomalies)}

METRICS HISTORY (last 3 years):
${JSON.stringify(simplifiedRiskMetrics)}

AUDITOR NOTES (last 3 years summary):
${JSON.stringify(simplifiedNotes)}

COMPANY: ${company.name} (${company.industry})

Return a JSON object with this exact schema:
{
  "fraud_risk_score": "Low|Medium|High|Critical",
  "fraud_likelihood_0_to_1": 0.15,
  "reasoning": "3-4 sentence grounded explanation detailing any fraud or anomaly evidence.",
  "overall_health_assessment": "A comprehensive 4-5 sentence summary written by you (the AI) about the company's 10-year financial trajectory, overall health, and industry standing.",
  "top_risk_factors": ["factor 1", "factor 2"],
  "matched_fraud_patterns": ["pattern name if matched"],
  "recommendation": "string"
}`;

    try {
      const text = await this._generateContentWithRetry(prompt);
      const parsed = this._parseJSON(text);
      logger.info(`Fraud risk assessment: ${parsed?.fraud_risk_score}`);
      return parsed || this._defaultFraudAssessment();
    } catch (err) {
      logger.error("Groq fraud risk assessment failed", { error: err.message });
      return this._ruleBasedFraudRisk(anomalies, metricsHistory, auditorNotes, company);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Turn 3: Auditor Sentiment Analysis
  // ─────────────────────────────────────────────────────────────────────────
  async analyzeSentiment(auditorNotesList) {
    logger.info("Analyzing auditor sentiment with Groq AI");

    if (!this.client) {
      return this._ruleBasedSentiment(auditorNotesList);
    }

    const condensedSentimentNotes = auditorNotesList.map(n => ({
      year: n.year,
      text: n.auditorNotes?.fullText?.substring(0, 300) || "Standard clean opinion. No material qualifications."
    }));

    const prompt = `You are a financial audit sentiment analyst. You MUST respond with valid JSON only.

Classify auditor confidence for each year as:
- "confident" — clean/unqualified opinion, no concerns
- "hedged"    — uses "subject to", "we believe", etc.
- "concerned" — qualified opinion or material reservations
- "alarmed"   — adverse opinion or disclaimer

AUDITOR NOTES BY YEAR (Condensed):
${JSON.stringify(condensedSentimentNotes)}

Return a JSON object with this exact schema:
{
  "sentiment_trend": [
    {
      "year": 2022,
      "sentiment": "confident|hedged|concerned|alarmed",
      "hedging_score": 0.1,
      "key_phrases": ["phrase1"],
      "summary": "one-sentence summary"
    }
  ],
  "trend_summary": "string summarising the overall trajectory",
  "concern_escalation": "Low|Moderate|High"
}`;

    try {
      const text = await this._generateContentWithRetry(prompt);
      const parsed = this._parseJSON(text);
      return parsed || this._ruleBasedSentiment(auditorNotesList);
    } catch (err) {
      logger.error("Groq sentiment analysis failed", { error: err.message });
      return this._ruleBasedSentiment(auditorNotesList);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────
  _parseJSON(text) {
    try {
      const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { /* ignore */ }
      }
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rule-based fallbacks (used when Groq API key is absent or fails)
  // ─────────────────────────────────────────────────────────────────────────
  _ruleBasedAnomalyDetection(metricsHistory, peerBenchmarks, industry) {
    const anomalies = [];
    const sorted = [...metricsHistory].sort((a, b) => a.year - b.year);
    let id = 0;

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const prev = sorted[i - 1];
      const m = curr.metrics;
      const pm = prev.metrics;

      if (m.revenue && pm.revenue && m.operatingCashFlow !== undefined && pm.operatingCashFlow !== undefined) {
        const revGrowth = (m.revenue - pm.revenue) / Math.abs(pm.revenue);
        const cfGrowth = (m.operatingCashFlow - pm.operatingCashFlow) / Math.abs(pm.operatingCashFlow || 1);
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
            vs_peer_context: "Sustained debt growth exceeding equity is a leverage risk indicator.",
            filing_reference: `${curr.year} Annual Report, Balance Sheet`,
          });
        }
      }
    }

    return { anomalies };
  }

  _ruleBasedFraudRisk(anomalies, metricsHistory, auditorNotes, company) {
    const criticalCount = anomalies.filter((a) => a.severity === "Critical").length;
    const highCount = anomalies.filter((a) => a.severity === "High").length;
    const totalScore = criticalCount * 3 + highCount;

    const fraud_risk_score =
      totalScore >= 6 ? "Critical" : totalScore >= 3 ? "High" : totalScore >= 1 ? "Medium" : "Low";
    const fraud_likelihood_0_to_1 =
      totalScore >= 6 ? 0.85 : totalScore >= 3 ? 0.65 : totalScore >= 1 ? 0.4 : 0.1;

    const topRiskFactors = anomalies.slice(0, 3).map((a) => `${a.metric}: ${a.description.slice(0, 60)}`);
    const matchedPatterns = [];
    if (anomalies.some((a) => a.metric.includes("Cash Flow")))
      matchedPatterns.push("Satyam pattern: Revenue↑ but CF↓");
    if (anomalies.some((a) => a.metric.includes("Debt")))
      matchedPatterns.push("Debt leverage risk: rapid debt accumulation");

    return {
      fraud_risk_score,
      fraud_likelihood_0_to_1,
      reasoning: `Rule-based analysis of ${company.name} (${company.industry}) identified ${anomalies.length} anomalies including ${criticalCount} critical flags. ${matchedPatterns.length > 0 ? `Patterns match: ${matchedPatterns.join(", ")}.` : "No known fraud patterns matched."} Groq AI analysis was unavailable; this assessment uses heuristics only.`,
      top_risk_factors: topRiskFactors.length > 0 ? topRiskFactors : ["No major risk factors detected"],
      matched_fraud_patterns: matchedPatterns,
      recommendation:
        fraud_risk_score === "Critical" ? "Immediate detailed audit recommended"
          : fraud_risk_score === "High" ? "Detailed review recommended"
          : fraud_risk_score === "Medium" ? "Monitor closely"
          : "Unlikely fraud — continue standard monitoring",
    };
  }

  _ruleBasedSentiment(auditorNotesList) {
    const trend = auditorNotesList.map((n) => {
      const score = n.auditorNotes?.hedgingScore || n.hedgingScore || 0.05;
      const sentiment =
        score > 0.8 ? "alarmed" : score > 0.5 ? "concerned" : score > 0.2 ? "hedged" : "confident";
      return {
        year: n.year,
        sentiment,
        hedging_score: score,
        key_phrases: n.auditorNotes?.keyPhrases || [],
        summary: n.auditorNotes?.fullText?.slice(0, 100) || "No auditor notes available.",
      };
    });

    const last = trend.length > 0 ? trend[trend.length - 1].hedging_score : 0;
    const first = trend.length > 0 ? trend[0].hedging_score : 0;
    const escalation =
      last > first + 0.5 ? "High" : last > first + 0.2 ? "Moderate" : "Low";

    return {
      sentiment_trend: trend,
      trend_summary: `Auditor sentiment analysis over ${trend.length} years shows ${escalation.toLowerCase()} concern escalation.`,
      concern_escalation: escalation,
    };
  }

  _defaultFraudAssessment() {
    return {
      fraud_risk_score: "Medium",
      fraud_likelihood_0_to_1: 0.3,
      reasoning: "Risk assessment unavailable due to API error. Manual review recommended.",
      top_risk_factors: ["AI analysis unavailable"],
      matched_fraud_patterns: [],
      recommendation: "Manual review recommended",
    };
  }
}

module.exports = new GroqAIService();
