import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VentesTimeSeriesProps {
  data: { period: string; gross: number; tax: number }[];
}

export function VentesTimeSeries({ data }: VentesTimeSeriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution temporelle - TTC & TVA</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="gross" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              name="TTC"
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

interface VentesByCountryProps {
  data: { country: string; gross_ttc: number }[];
}

export function VentesByCountry({ data }: VentesByCountryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventes par pays (TTC)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="country" 
              className="text-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="gross_ttc" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface VentesByTypeProps {
  data: { type: string; gross_ttc: number }[];
}

export function VentesByType({ data }: VentesByTypeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="type" 
              className="text-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="gross_ttc" 
              fill="hsl(var(--primary))"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}