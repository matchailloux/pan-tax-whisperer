import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeSeriesData {
  period: string;
  gross: number;
  tax: number;
}

interface CountryData {
  key: string;
  gross: number;
}

export function TimeSeriesGrossTax({ data }: { data: TimeSeriesData[] }) {
  return (
    <Card className="relative overflow-hidden border-2 border-gradient-to-br from-primary/20 to-secondary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Évolution du CA et TVA
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="period" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="gross" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              name="CA Brut"
            />
            <Line 
              type="monotone" 
              dataKey="tax" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
              dot={false}
              name="TVA"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ByCountryBar({ data }: { data: CountryData[] }) {
  return (
    <Card className="relative overflow-hidden border-2 border-gradient-to-br from-secondary/20 to-accent/20">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
          Ventes par pays
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="key" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="gross" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="CA Brut"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}