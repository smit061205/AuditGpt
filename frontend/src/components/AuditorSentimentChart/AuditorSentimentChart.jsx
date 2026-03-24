import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SENTIMENT_COLORS = {
  confident: "#22c55e",
  hedged: "#eab308",
  concerned: "#f97316",
  alarmed: "#ef4444",
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = SENTIMENT_COLORS[payload?.sentiment] || "#8b5cf6";
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#111" strokeWidth={2} />;
};

export default function AuditorSentimentChart({ data }) {
  if (!data?.sentiment_trend?.length) return null;

  // Normalize: convert 0-1 hedging_score to 0-100, and fall back to raw score if AI returned 0
  const chartData = data.sentiment_trend.map((item) => {
    const rawScore = item.hedging_score ?? 0;
    // If AI returned 0, use a baseline of 5% for clean companies so the chart isn't flat
    const displayScore = rawScore > 0 ? Math.round(rawScore * 100) : 5;
    return { ...item, displayScore };
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="w-full h-[280px] overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px] h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#555" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tickFormatter={(val) => `${val}%`}
              tick={{ fontSize: 11, fill: "#555" }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              dx={-5}
            />
            <ReferenceLine y={25} stroke="#333" strokeDasharray="4 4" label={{ value: "Hedged", fill: "#eab308", fontSize: 9, position: "insideTopRight" }} />
            <ReferenceLine y={50} stroke="#333" strokeDasharray="4 4" label={{ value: "Concerned", fill: "#f97316", fontSize: 9, position: "insideTopRight" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #1c1c1c", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" }}
              formatter={(value, name, props) => [
                `${value}%  (${props?.payload?.sentiment || "confident"})`,
                "Hedging Index"
              ]}
              labelStyle={{ color: "#888", marginBottom: "4px" }}
            />
            <Line
              type="monotone"
              dataKey="displayScore"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={<CustomDot />}
              activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {Object.entries(SENTIMENT_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }}></div>
            <span className="text-[11px] capitalize" style={{ color: "#888" }}>{label}</span>
          </div>
        ))}
      </div>

      {data.trend_summary && (
        <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
          {data.trend_summary}
        </p>
      )}
    </div>
  );
}

