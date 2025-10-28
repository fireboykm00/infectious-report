import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";

interface DemographicChartProps {
  detailed?: boolean;
}

const data = [
  { age: '0-17', male: 65, female: 60 },
  { age: '18-24', male: 85, female: 90 },
  { age: '25-34', male: 120, female: 110 },
  { age: '35-44', male: 95, female: 85 },
  { age: '45-54', male: 75, female: 80 },
  { age: '55-64', male: 60, female: 65 },
  { age: '65+', male: 45, female: 55 },
];

export function DemographicChart({ detailed = false }: DemographicChartProps) {
  return (
    <div className={detailed ? "h-[600px]" : "h-[300px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            dataKey="age"
            stroke="#888888"
            fontSize={12}
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
          />
          <Legend />
          <Bar 
            dataKey="male" 
            name="Male" 
            fill="#4dabf7" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="female" 
            name="Female" 
            fill="#ff6b6b" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}