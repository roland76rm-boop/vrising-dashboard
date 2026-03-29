import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface GearChartProps {
  history: Array<{ date: string; value: number }>;
}

export function GearChart({ history }: GearChartProps) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-[#6b5b6b]">
        Noch zu wenig Datenpunkte — trage deinen GS nach jeder Session ein.
      </div>
    );
  }

  const data = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' }),
    gs:   h.value,
  }));

  const max = Math.max(...history.map(h => h.value));
  const min = Math.min(...history.map(h => h.value));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b5b6b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[Math.max(0, min - 5), max + 5]}
          tick={{ fill: '#6b5b6b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#1a1a24', border: '1px solid #2a1a2a', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#a89ab0' }}
          itemStyle={{ color: '#DC143C' }}
          formatter={(v: number) => [`GS ${v}`, 'Gear Score']}
        />
        <Line
          type="monotone"
          dataKey="gs"
          stroke="#DC143C"
          strokeWidth={2}
          dot={{ fill: '#8B0000', r: 3 }}
          activeDot={{ r: 5, fill: '#DC143C' }}
        />
        <ReferenceLine y={max} stroke="#8B000033" strokeDasharray="3 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}
