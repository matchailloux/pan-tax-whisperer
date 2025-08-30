import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportCsv } from './exportCsv';

interface VentesExportPanelProps {
  byCountry: any[];
  byCountryRate: any[];
  ts: { period: string; gross: number; tax: number }[];
}

export function VentesExportPanel({ byCountry, byCountryRate, ts }: VentesExportPanelProps) {
  const timeSeriesRows = useMemo(() => 
    ts.map(row => ({
      period: row.period,
      gross: row.gross,
      tax: row.tax
    })), [ts]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exports CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          onClick={() => exportCsv(
            'totaux_par_pays.csv',
            byCountry,
            ['country', 'currency', 'gross_ttc', 'net_ht', 'tax_tva', 'sales_count', 'refund_count', 'return_count']
          )}
          className="w-full"
        >
          Totaux par pays
        </Button>
        
        <Button
          variant="outline"
          onClick={() => exportCsv(
            'totaux_par_pays_et_taux.csv',
            byCountryRate,
            ['country', 'vat_rate_pct', 'currency', 'gross_ttc', 'net_ht', 'tax_tva', 'sales_count', 'refund_count', 'return_count']
          )}
          className="w-full"
        >
          Pays & taux TVA
        </Button>
        
        <Button
          variant="outline"
          onClick={() => exportCsv(
            'time_series.csv',
            timeSeriesRows,
            ['period', 'gross', 'tax']
          )}
          className="w-full"
        >
          Série temporelle
        </Button>
      </CardContent>
    </Card>
  );
}