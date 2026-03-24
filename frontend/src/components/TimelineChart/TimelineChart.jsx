import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

export default function TimelineChart({ data = [], anomalies = [] }) {
  const [visible, setVisible] = useState({
    revenue: true,
    cashFlow: true,
    debt: true,
  });

  const anomalyYears = [...new Set(anomalies.map((a) => a.year_detected))];

  const chartData = data.map((d) => ({
    year: d.year,
    Revenue: d.metrics?.revenue || 0,
    "Cash Flow": d.metrics?.operatingCashFlow || 0,
    "Total Debt": d.metrics?.totalDebt || 0,
  }));

  const formatYAxis = (val) => {
    if (Math.abs(val) >= 1e9) return `₹${(val / 1e9).toFixed(1)}B`;
    if (Math.abs(val) >= 1e7) return `₹${(val / 1e7).toFixed(1)}Cr`;
    return `₹${val}`;
  };

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  if (!data || data.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        No timeline data available.
      </div>
    );
  }

  const items = [
    { key: "revenue", label: "Revenue", color: "#0ea5e9" },
    { key: "cashFlow", label: "Cash Flow", color: "#22c55e" },
    { key: "debt", label: "Total Debt", color: "#ef4444" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-2 cursor-pointer text-sm transition-colors px-3 py-1.5 rounded-full border"
            style={{
              background: visible[item.key] ? '#0a0a0a' : 'transparent',
              borderColor: 'transparent',
              color: visible[item.key] ? '#e2e8f0' : '#64748b'
            }}
          >
            <input
              type="checkbox"
              checked={visible[item.key]}
              onChange={() => toggle(item.key)}
              className="hidden"
            />
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium">{item.label}</span>
          </label>
        ))}
        {anomalyYears.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ml-auto"
            style={{ color: '#ef4444', background: '#2a0a0a', borderColor: '#4a0a0a' }}>
            <span
              className="w-6 h-0.5"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 8px)",
              }}
            />
            Red Flags Detected
          </div>
        )}
      </div>

      <div className="w-full h-[350px] overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px] h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.02)"
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "transparent" }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              width={80}
              tickLine={false}
              axisLine={{ stroke: "transparent" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0a0a",
                border: "none",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "13px",
              }}
              itemStyle={{ color: "#f8fafc" }}
              formatter={(value, name) => [formatCurrency(value), name]}
            />
            <Legend wrapperStyle={{ display: "none" }} />

            {anomalyYears.map((year) => (
              <ReferenceLine
                key={year}
                x={year}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeOpacity={0.8}
                label={{
                  value: "! " + year,
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              />
            ))}

            {visible.revenue && (
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: "#0ea5e9", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            {visible.cashFlow && (
              <Line
                type="monotone"
                dataKey="Cash Flow"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            {visible.debt && (
              <Line
                type="monotone"
                dataKey="Total Debt"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ fill: "#ef4444", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      {anomalyYears.length > 0 && (
        <p className="text-[10px] uppercase font-bold tracking-widest text-center mt-2" style={{ color: '#6b7280' }}>
          Dashed red lines mark years with detected financial anomalies
        </p>
      )}
    </div>
  );
}
