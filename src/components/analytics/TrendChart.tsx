import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";

interface TrendChartProps {
  detailed?: boolean;
}

const data = [
  { date: '2025-10-20', Malaria: 40, COVID19: 24, Cholera: 18, Typhoid: 22 },
  { date: '2025-10-21', Malaria: 35, COVID19: 28, Cholera: 15, Typhoid: 20 },
  { date: '2025-10-22', Malaria: 45, COVID19: 26, Cholera: 12, Typhoid: 25 },
  { date: '2025-10-23', Malaria: 42, COVID19: 32, Cholera: 14, Typhoid: 24 },
  { date: '2025-10-24', Malaria: 38, COVID19: 30, Cholera: 16, Typhoid: 22 },
  { date: '2025-10-25', Malaria: 48, COVID19: 28, Cholera: 20, Typhoid: 26 },
  { date: '2025-10-26', Malaria: 50, COVID19: 34, Cholera: 22, Typhoid: 28 },
];

const colors = {
  Malaria: "#ff6b6b",
  COVID19: "#4dabf7",
  Cholera: "#51cf66",
  Typhoid: "#ffd43b"
};

export function TrendChart({ detailed = false }: TrendChartProps) {
  return (
    <div className={detailed ? "h-[600px]" : "h-[300px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey="date" 
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend />
          {Object.entries(colors).map(([key, color]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              dot={detailed}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}