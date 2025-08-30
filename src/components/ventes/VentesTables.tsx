import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportCsv } from './exportCsv';

type CountryRow = {
  country: string;
  currency: string;
  gross_ttc: number;
  net_ht: number;
  tax_tva: number;
  sales_count: number;
  refund_count: number;
  return_count: number;
};

type CountryRateRow = {
  country: string;
  vat_rate_pct: number;
  currency: string;
  gross_ttc: number;
  net_ht: number;
  tax_tva: number;
  sales_count: number;
  refund_count: number;
  return_count: number;
};

interface VentesCountryTotalsTableProps {
  rows: CountryRow[];
}

export function VentesCountryTotalsTable({ rows }: VentesCountryTotalsTableProps) {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount || 0);

  const downloadCsv = () => {
    exportCsv(
      'totaux_par_pays.csv',
      rows,
      ['country', 'currency', 'gross_ttc', 'net_ht', 'tax_tva', 'sales_count', 'refund_count', 'return_count']
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Totaux par pays</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['Pays', 'Devise', 'TTC', 'HT', 'TVA', '#Ventes', '#Remb.', '#Retours'].map(header => (
                  <th key={header} className="text-left p-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{row.country}</td>
                  <td className="p-3">{row.currency}</td>
                  <td className="p-3">{formatCurrency(row.gross_ttc, row.currency)}</td>
                  <td className="p-3">{formatCurrency(row.net_ht, row.currency)}</td>
                  <td className="p-3">{formatCurrency(row.tax_tva, row.currency)}</td>
                  <td className="p-3">{row.sales_count}</td>
                  <td className="p-3">{row.refund_count}</td>
                  <td className="p-3">{row.return_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface VentesCountryVatRateTableProps {
  rows: CountryRateRow[];
}

export function VentesCountryVatRateTable({ rows }: VentesCountryVatRateTableProps) {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount || 0);

  const downloadCsv = () => {
    exportCsv(
      'totaux_par_pays_et_taux.csv',
      rows,
      ['country', 'vat_rate_pct', 'currency', 'gross_ttc', 'net_ht', 'tax_tva', 'sales_count', 'refund_count', 'return_count']
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Répartition par taux de TVA (par pays)</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {['Pays', 'Taux TVA %', 'Devise', 'TTC', 'HT', 'TVA', '#Ventes', '#Remb.', '#Retours'].map(header => (
                  <th key={header} className="text-left p-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{row.country}</td>
                  <td className="p-3">{row.vat_rate_pct?.toFixed(2)}%</td>
                  <td className="p-3">{row.currency}</td>
                  <td className="p-3">{formatCurrency(row.gross_ttc, row.currency)}</td>
                  <td className="p-3">{formatCurrency(row.net_ht, row.currency)}</td>
                  <td className="p-3">{formatCurrency(row.tax_tva, row.currency)}</td>
                  <td className="p-3">{row.sales_count}</td>
                  <td className="p-3">{row.refund_count}</td>
                  <td className="p-3">{row.return_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}