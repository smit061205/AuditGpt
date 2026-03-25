Here is the **full** [README.md](cci:7://file:///Users/smitthakkar/Downloads/IAR-Hackathon--main/README.md:0:0-0:0) file content for you to copy and paste:

```markdown
# 🕵️‍♂️ AuditGPT: Forensic Financial Terminal

AuditGPT is an AI-powered financial forensic platform designed to detect anomalies, assess fraud risks, and analyze auditor sentiment for Indian listed companies. It leverages 10-year historical data and state-of-the-art LLMs (via Groq) to provide deep-dive forensic insights that traditional accounting tools miss.

---

## 🌟 Key Features

- **10-Year Deep Dive:** Analyzes a decade of financial filings (Balance Sheets, P&L, Cash Flow).
- **AI Anomaly Detection:** Identifies 30+ forensic red flags, including revenue/cash-flow divergence and aggressive RPT growth.
- **Fraud Risk Score:** Calibrated risk assessment (Low to Critical) based on matched fraud patterns (Satyam, DHFL, IL&FS).
- **Auditor Sentiment Analysis:** Tracks the "tonal shift" in auditor notes from confident to hedged or alarmed.
- **Industry Benchmarking:** Compares company performance against sector peers in real-time.
- **Interactive Visualizations:** High-impact charts showing the trajectory toward financial distress.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18+ (Vite)
- **Styling:** Tailwind CSS (Modern, Dark-mode first UI)
- **Charts:** Recharts (Interactive financial timelines)
- **State:** React Hooks & Context API

### Backend
- **Runtime:** Node.js (Express)
- **AI Engine:** Groq SDK (Powered by LLaMA 3 / Kimi K2)
- **Data Source:** Yahoo Finance (Live) + SEBI Historical Database (Curated)
- **Utilities:** `pdf-parse` for filing extraction

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Groq API Key (Sign up at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd IAR-Hackathon--main
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Add your GROQ_API_KEY to .env
   npm start
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📊 Demo Scenarios

The system includes pre-loaded historical data for famous Indian corporate crises:

- **Satyam Computer Services:** Watch the system detect the massive "fictitious cash" anomaly.
- **Yes Bank:** Analyze the sudden divergence in NPA reporting and liquidity.
- **DHFL / IL&FS:** Identify extreme leverage and related-party transaction bloat before the collapse.

---

## 📂 Project Structure

- `/frontend`: React application with high-fidelity forensic dashboard.
- `/backend`: Node.js server handling data ingestion and AI analysis.
- `/backend/src/services`: Core logic for anomaly detection (`groq-ai.js`), data fetching (`sebi-fetcher.js`), and benchmarks.
- `/backend/src/data`: Curated 10-year SEBI database for major NSE companies.

---

## 🛡 License

This project is built for the IAR Hackathon and is intended for educational and demonstration purposes only.

---

**Built with ❤️ for Financial Transparency.**
```
