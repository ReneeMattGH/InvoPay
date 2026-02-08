import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface YieldData {
  month: string;
  yield: number;
  balance: number;
}

interface YieldChartProps {
  data?: YieldData[];
}

export function YieldChart({ data }: YieldChartProps) {
  // Default empty state or placeholder if no data
  const chartData = data && data.length > 0 ? data : [
    { month: "Jan", yield: 0, balance: 0 },
    { month: "Feb", yield: 0, balance: 0 },
    { month: "Mar", yield: 0, balance: 0 },
  ];

  return (
    <Card className="glass-card hover-glow col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Yield Projection (6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <Area type="monotone" dataKey="yield" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorYield)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
