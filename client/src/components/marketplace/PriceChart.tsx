import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PriceChartProps {
  data: { date: string; price: number }[];
}

export default function PriceChart({ data }: PriceChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.14 65)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.72 0.14 65)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: "oklch(0.58 0.03 230)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "oklch(0.58 0.03 230)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `€${v}`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.12 0.03 250)",
              border: "1px solid oklch(0.22 0.04 250)",
              borderRadius: "8px",
              color: "oklch(0.93 0.015 220)",
            }}
            formatter={(value: number) => [`€${value.toFixed(2)}`, "Preis"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="oklch(0.72 0.14 65)"
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
