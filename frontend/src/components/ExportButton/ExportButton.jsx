export default function ExportButton({ report }) {
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditgpt-${report?.metadata?.company_name?.replace(/\s+/g, "-").toLowerCase() || "report"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!report?.anomalies) return;
    const headers = [
      "Metric",
      "Year",
      "Deviation %",
      "Severity",
      "Description",
    ];
    const rows = report.anomalies.length > 0
      ? report.anomalies.map((a) => [
          `"${String(a.metric).replace(/"/g, '""')}"`,
          a.year_detected,
          a.deviation_percent,
          a.severity,
          `"${String(a.description).replace(/"/g, '""')}"`,
        ])
      : [["\"No anomalies detected\"", "-", "-", "-", "-"]];
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anomalies-${report?.metadata?.company_name?.replace(/\s+/g, "-").toLowerCase() || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 border-t print-hide" style={{ borderColor: '#111111' }}>
      <h3 className="font-semibold text-xs uppercase tracking-widest mb-2" style={{ color: '#4b5563' }}>
        Export Report Data
      </h3>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors duration-200 shadow-md"
          style={{ background: '#22c55e', color: '#000000', border: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#4ade80'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#22c55e'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download PDF Report
        </button>
        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors duration-200"
          style={{ background: '#0a0a0a', color: '#06b6d4', border: '1px solid #1c1c1c' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.borderColor = '#06b6d4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.borderColor = '#1c1c1c'; }}
        >
          Export Raw Data (JSON)
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors duration-200"
          style={{ background: '#0a0a0a', color: '#6b7280', border: '1px solid #1c1c1c' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#06b6d4'; e.currentTarget.style.borderColor = '#06b6d4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#1c1c1c'; }}
        >
          Download Anomalies (CSV)
        </button>
      </div>
    </div>
  );
}
