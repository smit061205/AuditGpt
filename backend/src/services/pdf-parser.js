const { createLogger } = require("../utils/logger");

const logger = createLogger("PDFParser");

/**
 * PDF Parser Service - Extracts financial metrics from PDF filings
 * In production this uses pdf-parse; for demo mode uses structured mock data
 */
class PDFParser {
  /**
   * Parse all financial documents from a filing
   * @param {object} filing - Filing object with year and metrics (mock) or PDF URLs
   * @returns {Promise<object>}
   */
  async parseFilings(filing) {
    logger.info(`Parsing filings for year ${filing.year}`);

    // If filing already has structured metrics (mock data), return directly
    if (filing.metrics) {
      return {
        year: filing.year,
        metrics: filing.metrics,
        auditorNotes: filing.auditorNotes || this._defaultAuditorNotes(),
        confidence: 0.95,
        source: filing.source || "mock",
      };
    }

    // For real PDF URLs, attempt parsing
    const parsed = {
      year: filing.year,
      metrics: {},
      auditorNotes: this._defaultAuditorNotes(),
      confidence: 0.5,
      source: "pdf",
    };

    try {
      if (filing.balanceSheetPdf) {
        const bs = await this.parseBalanceSheet(filing.balanceSheetPdf);
        Object.assign(parsed.metrics, bs);
      }
      if (filing.plPdf) {
        const pl = await this.parseProfitLoss(filing.plPdf);
        Object.assign(parsed.metrics, pl);
      }
      if (filing.cashFlowPdf) {
        const cf = await this.parseCashFlow(filing.cashFlowPdf);
        Object.assign(parsed.metrics, cf);
      }
      if (filing.auditorNotesPdf) {
        parsed.auditorNotes = await this.extractAuditorNotes(
          filing.auditorNotesPdf,
        );
      }
    } catch (err) {
      logger.error("Failed to parse filing PDFs", {
        year: filing.year,
        error: err.message,
      });
    }

    return parsed;
  }

  /**
   * Parse balance sheet from PDF URL or Buffer
   * @param {string|Buffer} source
   * @returns {Promise<object>}
   */
  async parseBalanceSheet(source) {
    try {
      let text = "";
      if (typeof source === "string" && source.startsWith("http")) {
        const pdfParse = require("pdf-parse");
        const axios = require("axios");
        const response = await axios.get(source, {
          responseType: "arraybuffer",
          timeout: 10000,
        });
        const data = await pdfParse(Buffer.from(response.data));
        text = data.text;
      } else if (Buffer.isBuffer(source)) {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(source);
        text = data.text;
      }

      return this._extractBalanceSheetMetrics(text);
    } catch (err) {
      logger.warn("Balance sheet parse failed", { error: err.message });
      return {};
    }
  }

  /**
   * Parse P&L from PDF URL or Buffer
   */
  async parseProfitLoss(source) {
    try {
      const text = await this._extractTextFromSource(source);
      return this._extractPLMetrics(text);
    } catch (err) {
      logger.warn("P&L parse failed", { error: err.message });
      return {};
    }
  }

  /**
   * Parse cash flow statement
   */
  async parseCashFlow(source) {
    try {
      const text = await this._extractTextFromSource(source);
      return this._extractCashFlowMetrics(text);
    } catch (err) {
      logger.warn("Cash flow parse failed", { error: err.message });
      return {};
    }
  }

  /**
   * Extract auditor notes and opinion from PDF
   */
  async extractAuditorNotes(source) {
    try {
      const text = await this._extractTextFromSource(source);
      return this._analyzeAuditorOpinion(text);
    } catch (err) {
      logger.warn("Auditor notes parse failed", { error: err.message });
      return this._defaultAuditorNotes();
    }
  }

  async _extractTextFromSource(source) {
    if (typeof source === "string" && !source.startsWith("http")) return source;
    try {
      const pdfParse = require("pdf-parse");
      const axios = require("axios");
      if (typeof source === "string") {
        const resp = await axios.get(source, {
          responseType: "arraybuffer",
          timeout: 10000,
        });
        const data = await pdfParse(Buffer.from(resp.data));
        return data.text;
      } else if (Buffer.isBuffer(source)) {
        const data = await pdfParse(source);
        return data.text;
      }
    } catch {
      /* fall through */
    }
    return "";
  }

  _extractBalanceSheetMetrics(text) {
    return {
      totalAssets: this._extractNumber(text, /total\s+assets[\s:]+([0-9,]+)/i),
      totalLiabilities: this._extractNumber(
        text,
        /total\s+liabilities[\s:]+([0-9,]+)/i,
      ),
      equity: this._extractNumber(
        text,
        /(?:shareholders'?|total)\s+equity[\s:]+([0-9,]+)/i,
      ),
      currentAssets: this._extractNumber(
        text,
        /current\s+assets[\s:]+([0-9,]+)/i,
      ),
      currentLiabilities: this._extractNumber(
        text,
        /current\s+liabilities[\s:]+([0-9,]+)/i,
      ),
      longTermDebt: this._extractNumber(
        text,
        /long.term\s+(?:debt|borrowings)[\s:]+([0-9,]+)/i,
      ),
      shortTermDebt: this._extractNumber(
        text,
        /short.term\s+(?:debt|borrowings)[\s:]+([0-9,]+)/i,
      ),
    };
  }

  _extractPLMetrics(text) {
    return {
      revenue: this._extractNumber(
        text,
        /(?:revenue|total\s+income)\s+from\s+operations[\s:]+([0-9,]+)/i,
      ),
      operatingIncome: this._extractNumber(
        text,
        /operating\s+(?:profit|income)[\s:]+([0-9,]+)/i,
      ),
      netIncome: this._extractNumber(
        text,
        /(?:net\s+profit|profit\s+after\s+tax)[\s:]+([0-9,]+)/i,
      ),
      taxExpense: this._extractNumber(
        text,
        /(?:income\s+tax|tax\s+expense)[\s:]+([0-9,]+)/i,
      ),
    };
  }

  _extractCashFlowMetrics(text) {
    const operating = this._extractNumber(
      text,
      /(?:net\s+cash\s+from|cash\s+generated\s+from)\s+operating[\s:]+([0-9,]+)/i,
    );
    const investing = this._extractNumber(
      text,
      /(?:net\s+cash\s+from|cash\s+used\s+in)\s+investing[\s:]+([0-9,]+)/i,
    );
    const financing = this._extractNumber(
      text,
      /(?:net\s+cash\s+from|cash\s+used\s+in)\s+financing[\s:]+([0-9,]+)/i,
    );
    return {
      operatingCashFlow: operating,
      investingCashFlow: investing ? -investing : null,
      financingCashFlow: financing,
      freeCashFlow: operating && investing ? operating - investing : null,
    };
  }

  _analyzeAuditorOpinion(text) {
    const lower = text.toLowerCase();
    const hasAdverse = /\b(adverse|do not present|contrary to)\b/i.test(text);
    const hasQualified =
      /\b(subject to|except for|qualification|qualified opinion)\b/i.test(text);
    const hasUnqualified =
      /\b(unmodified|unqualified|without qualification|true and fair view)\b/i.test(
        text,
      );
    const hasDisclaimer =
      /\b(unable to express|do not express|disclaimer)\b/i.test(text);

    let qualificationType = "unqualified";
    let hedgingScore = 0.05;
    if (hasAdverse) {
      qualificationType = "adverse";
      hedgingScore = 0.95;
    } else if (hasDisclaimer) {
      qualificationType = "disclaimer";
      hedgingScore = 0.85;
    } else if (hasQualified) {
      qualificationType = "qualified";
      hedgingScore = 0.6;
    } else if (hasUnqualified) {
      qualificationType = "unqualified";
      hedgingScore = 0.05;
    }

    const hedgingPhrases = [];
    [
      "subject to",
      "except for",
      "in our view",
      "we believe",
      "unable to obtain",
      "material uncertainty",
    ].forEach((phrase) => {
      if (lower.includes(phrase)) hedgingPhrases.push(phrase);
    });

    return {
      fullText: text.slice(0, 2000) || "No auditor notes available",
      hasQualification: hasQualified || hasAdverse || hasDisclaimer,
      hasReservations: hasQualified || hasAdverse,
      qualificationType,
      keyPhrases: hedgingPhrases,
      hedgingLanguage: hedgingPhrases,
      hedgingScore,
    };
  }

  _extractNumber(text, pattern) {
    const match = text.match(pattern);
    if (!match) return 0;
    const cleaned = match[1].replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  _defaultAuditorNotes() {
    return {
      fullText: "Auditor notes not available",
      hasQualification: false,
      hasReservations: false,
      qualificationType: "unqualified",
      keyPhrases: [],
      hedgingLanguage: [],
      hedgingScore: 0.05,
    };
  }
}

module.exports = new PDFParser();
