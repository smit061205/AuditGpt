const Anthropic = require("@anthropic-ai/sdk");
const { createLogger } = require("../utils/logger");
const { CLAUDE_MODEL } = require("../config/constants");
const config = require("../config/env");

const logger = createLogger("ClaudeAI");

class ClaudeAIService {
  constructor() {
    this.client = config.ANTHROPIC_API_KEY
      ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY })
      : null;
  }

  /**
   * Turn 1: Detect anomalies in financial data
   * @param {Array} metricsHistory
   * @param {object} peerBenchmarks
   * @param {string} industryContext
   * @returns {Promise<object>}
   */
  async detectAnomalies(metricsHistory, peerBenchmarks, industryContext) {
    logger.info("Detecting anomalies with Claude AI");

    if (!this.client) {
      logger.warn("Claude API key not set, using rule-based anomaly detection");
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
      const response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].text;
      const parsed = this._parseJSON(text);
      logger.info(`Detected ${parsed?.anomalies?.length || 0} anomalies`);
      return parsed || { anomalies: [] };
    } catch (err) {
      logger.error("Claude anomaly detection failed", { error: err.message });
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
    logger.info("Assessing fraud risk with Claude AI");

    if (!this.client) {
      logger.warn(
        "Claude API key not set, using rule-based fraud risk assessment",
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
2. Related party transactions growing faster than core business (IL&FS)
3. Auditor language becoming increasingly hedged/qualified
4. Debt restructured into creative/complex instruments
5. Asset quality deteriorating while profitability stays stable
6. Large one-time gains masking operating losses
7. Increasing related party transactions with vague explanations
8. Auditor rotation or change in opinion

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
      const response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].text;
      const parsed = this._parseJSON(text);
      logger.info(`Fraud risk assessment: ${parsed?.fraud_risk_score}`);
      return parsed || this._defaultFraudAssessment();
    } catch (err) {
      logger.error("Claude fraud risk assessment failed", {
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
    logger.info("Analyzing auditor sentiment with Claude AI");

    if (!this.client) {
      logger.warn(
        "Claude API key not set, using rule-based sentiment analysis",
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
      const response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const parsed = this._parseJSON(response.content[0].text);
      return parsed || this._ruleBasedSentiment(auditorNotesList);
    } catch (err) {
      logger.error("Claude sentiment analysis failed", { error: err.message });
      return this._ruleBasedSentiment(auditorNotesList);
    }
  }

  /** Parse JSON safely from Claude response */
  _parseJSON(text) {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      // Try to extract JSON object/array
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

      // Check 1: Revenue up but cash flow down
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

      // Check 2: Related party transaction explosion
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
            vs_peer_context: `RPT growth far exceeds core business growth. This pattern matches IL&FS and Satyam pre-collapse.`,
            filing_reference: `${curr.year} Annual Report, Notes to Accounts`,
          });
        }
      }

      // Check 3: Debt explosion
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

    // Check auditor qualification escalation
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
      matchedPatterns.push("Satyam pattern: Revenue↑ but CF↓");
    if (anomalies.some((a) => a.metric.includes("Related Party")))
      matchedPatterns.push("IL&FS pattern: RPT growth outpacing core business");
    if (anomalies.some((a) => a.metric.includes("Auditor")))
      matchedPatterns.push(
        "Auditor language deterioration (pre-collapse pattern)",
      );

    return {
      fraud_risk_score,
      fraud_likelihood_0_to_1,
      reasoning: `Analysis of ${company.name} (${company.industry}) identified ${anomalies.length} anomalies including ${criticalCount} critical and ${highCount} high severity flags. ${matchedPatterns.length > 0 ? `Patterns match known fraud cases: ${matchedPatterns.join(", ")}.` : "No major fraud patterns matched."} Risk assessment based on rule-based analysis; Claude AI analysis unavailable.`,
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

module.exports = new ClaudeAIService();
