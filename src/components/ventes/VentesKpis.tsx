import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VentesKpisProps {
  k: any;
}

export function VentesKpis({ k }: VentesKpisProps) {
  const currency = k?.currency || 'EUR';
  const formatCurrency = (n: number) => 
    new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency 
    }).format(n || 0);

  const formatNumber = (n: number) => 
    new Intl.NumberFormat().format(n || 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            TTC (Gross)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(Number(k?.gross_ttc || 0))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            HT (Net)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(Number(k?.net_ht || 0))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            TVA (Tax)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(Number(k?.tax_tva || 0))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(Number(k?.transactions_total || 0))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ventes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(Number(k?.sales_count || 0))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Remb./Retours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(Number(k?.refund_count || 0) + Number(k?.return_count || 0))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}