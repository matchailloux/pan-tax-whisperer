import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Globe, MapPin } from 'lucide-react';

interface VATAnalyticsChartsProps {
  report: any;
}

export function VATAnalyticsCharts({ report }: VATAnalyticsChartsProps) {
  const { breakdown, kpiCards } = report;

  // Préparer les données pour le graphique par pays
  const countryData = breakdown
    .filter((item: any) => item.total > 0)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 8)
    .map((item: any) => ({
      country: item.country,
      total: item.total,
      oss: item.oss || 0,
      b2c: item.domesticB2C || 0,
      b2b: item.domesticB2B || 0,
      intracom: item.intracommunautaire || 0
    }));

  // Préparer les données pour le graphique par régime
  const regimeData = [
    { name: 'OSS', value: kpiCards.find((k: any) => k.title.includes('OSS'))?.amount || 0, color: '#3B82F6' },
    { name: 'B2C National', value: kpiCards.find((k: any) => k.title.includes('B2C'))?.amount || 0, color: '#10B981' },
    { name: 'B2B National', value: kpiCards.find((k: any) => k.title.includes('B2B'))?.amount || 0, color: '#8B5CF6' },
    { name: 'Intracommunautaire', value: kpiCards.find((k: any) => k.title.includes('Intracommunautaire'))?.amount || 0, color: '#F59E0B' },
    { name: 'Export', value: kpiCards.find((k: any) => k.title.includes('Export'))?.amount || 0, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatAmount(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.payload.color }}>
            {formatAmount(data.value)} ({((data.value / regimeData.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const totalAmount = regimeData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Graphique en secteurs - Répartition par régime */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Répartition par Régime TVA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regimeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Légende */}
          <div className="space-y-2 mt-4">
            {regimeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{formatAmount(item.value)}</span>
                  <span className="text-muted-foreground ml-1">
                    ({((item.value / totalAmount) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Graphique en barres - Top pays */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            Top 8 Pays par CA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="country" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  fill="url(#gradient)" 
                  radius={[4, 4, 0, 0]}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Résumé */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Top 3 pays représentent
              </span>
              <span className="font-semibold">
                {countryData.length >= 3 ? (
                  ((countryData.slice(0, 3).reduce((acc, item) => acc + item.total, 0) / 
                    countryData.reduce((acc, item) => acc + item.total, 0)) * 100).toFixed(1)
                ) : '0'}% du CA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}