import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '-';
  if (value >= 1e7 || value <= -1e7) {
    return `₹${(value / 1e7).toFixed(1)} Cr`;
  }
  return `₹${value.toLocaleString()}`;
};

export default function RelatedPartyChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((item) => ({
    year: item.year,
    amount: item.metrics?.relatedPartyTransactions || 0,
  }));

  // Calculate generic growth over 10 years to flag massive spikes
  const first = chartData[0]?.amount || 1;
  const last = chartData[chartData.length - 1]?.amount || 0;
  const growth = ((last - first) / Math.abs(first)) * 100;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-400">10-Year Growth Trend</h3>
        {growth > 50 && (
          <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-1 rounded">
            +{growth.toFixed(0)}% Spike Detected
          </span>
        )}
      </div>
      <div className="flex-1 min-h-[200px] w-full mt-4 overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px] h-full">
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#555" 
              tick={{ fill: '#888', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#555" 
              tick={{ fill: '#888', fontSize: 12 }} 
              tickFormatter={(val) => {
                if (val >= 1e7) return `${(val / 1e7).toFixed(0)}Cr`;
                return val;
              }}
              axisLine={false}
              tickLine={false}
              dx={-10}
              width={50}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px', border: 'none' }}
              itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              cursor={{ fill: '#222' }}
              formatter={(value) => [formatCurrency(value), 'Related Party Txns']}
              labelStyle={{ color: '#888', marginBottom: '4px' }}
            />
            <Bar
              dataKey="amount"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
