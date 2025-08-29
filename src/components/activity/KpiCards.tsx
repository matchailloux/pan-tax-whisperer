import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CreditCard, ShoppingCart, BarChart3 } from 'lucide-react';

interface KpiCardsProps {
  gross: number;
  tax: number;
  totalTx: number;
  aov: number;
  currency?: string;
}

export default function KpiCards({ gross, tax, totalTx, aov, currency }: KpiCardsProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(n || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-6">
      <Card className="relative overflow-hidden border-2 border-gradient-to-br from-primary/20 to-secondary/20 bg-gradient-to-br from-card via-card to-card/80">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Montant brut
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {fmt(gross)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total TTC des ventes
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-2 border-gradient-to-br from-secondary/20 to-accent/20 bg-gradient-to-br from-card via-card to-card/80">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Montant TVA
          </CardTitle>
          <CreditCard className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            {fmt(tax)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total TVA collectée
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-2 border-gradient-to-br from-accent/20 to-primary/20 bg-gradient-to-br from-card via-card to-card/80">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total transactions
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            {totalTx.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ventes uniquement
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-2 border-gradient-to-br from-primary/20 to-accent/20 bg-gradient-to-br from-card via-card to-card/80">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Panier moyen
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="relative">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {fmt(aov)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Somme TTC / # ventes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}