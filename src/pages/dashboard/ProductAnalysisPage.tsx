import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Package, FileText, TrendingUp } from "lucide-react";
import { useVATReports } from '@/hooks/useVATReports';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface ProductVATData {
  asin: string;
  productName: string;
  country: string;
  regime: string; // OSS, Domestique, Intracommunautaire, etc.
  totalHT: number;
  totalTTC: number;
  vatAmount: number;
  vatRate: number;
  transactions: number;
  accountType: string; // OSS, Domestique, Export, etc.
}

const ProductAnalysisPage = () => {
  const { reports, loading } = useVATReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [regimeFilter, setRegimeFilter] = useState<string>('all');
  const [productData, setProductData] = useState<ProductVATData[]>([]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const analyzeProductData = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report?.report_data?.processedTransactions) {
      toast.error("Aucune donnée de transaction disponible dans ce rapport");
      return;
    }

    const transactions = report.report_data.processedTransactions;
    const productMap = new Map<string, ProductVATData>();

    transactions.forEach((tx: any) => {
      const asin = tx.ASIN || tx.SKU || 'UNKNOWN';
      const productName = tx.PRODUCT_NAME || tx.ITEM_DESCRIPTION || asin;
      const country = tx.ARRIVAL || tx.DEPART || 'XX';
      const scheme = tx.SCHEME || 'REGULAR';
      
      // Déterminer le régime et le compte
      let regime = 'Domestique B2C';
      let accountType = 'Domestique';
      
      if (scheme === 'OSS') {
        regime = 'OSS';
        accountType = 'OSS';
      } else if (tx.CATEGORY?.includes('B2B')) {
        regime = 'Domestique B2B';
        accountType = 'Domestique B2B';
      } else if (tx.CATEGORY?.includes('INTRACOM')) {
        regime = 'Intracommunautaire';
        accountType = 'Export Intra-UE';
      } else if (tx.CATEGORY?.includes('CH_VOEC')) {
        regime = 'Suisse (VOEC)';
        accountType = 'Export Hors UE';
      }

      const key = `${asin}-${country}-${regime}`;
      const existing = productMap.get(key);

      const amountHT = Math.abs(tx.AMOUNT || 0);
      const vatAmount = Math.abs(tx.VAT_AMOUNT || 0);
      const amountTTC = amountHT + vatAmount;

      if (existing) {
        existing.totalHT += amountHT;
        existing.totalTTC += amountTTC;
        existing.vatAmount += vatAmount;
        existing.transactions += 1;
      } else {
        productMap.set(key, {
          asin,
          productName,
          country,
          regime,
          totalHT: amountHT,
          totalTTC: amountTTC,
          vatAmount,
          vatRate: tx.VAT_RATE || 0,
          transactions: 1,
          accountType
        });
      }
    });

    const data = Array.from(productMap.values()).sort((a, b) => b.totalTTC - a.totalTTC);
    setProductData(data);
    toast.success(`${data.length} produits analysés`);
  };

  const filteredData = productData.filter(p => {
    const matchesSearch = p.asin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegime = regimeFilter === 'all' || p.regime === regimeFilter;
    return matchesSearch && matchesRegime;
  });

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Feuille principale avec détail par produit
    const wsData = filteredData.map(p => ({
      'ASIN/SKU': p.asin,
      'Produit': p.productName,
      'Pays': p.country,
      'Régime TVA': p.regime,
      'Compte': p.accountType,
      'Montant HT': p.totalHT,
      'Montant TTC': p.totalTTC,
      'TVA': p.vatAmount,
      'Taux TVA (%)': p.vatRate,
      'Transactions': p.transactions
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Détail par produit');

    // Feuille synthèse par régime
    const regimeSummary = new Map<string, { totalHT: number; totalTVA: number; count: number }>();
    filteredData.forEach(p => {
      const key = p.regime;
      const existing = regimeSummary.get(key) || { totalHT: 0, totalTVA: 0, count: 0 };
      existing.totalHT += p.totalHT;
      existing.totalTVA += p.vatAmount;
      existing.count += p.transactions;
      regimeSummary.set(key, existing);
    });

    const wsSummaryData = Array.from(regimeSummary.entries()).map(([regime, data]) => ({
      'Régime TVA': regime,
      'Total HT': data.totalHT,
      'Total TVA': data.totalTVA,
      'Total TTC': data.totalHT + data.totalTVA,
      'Transactions': data.count
    }));
    const wsSummary = XLSX.utils.json_to_sheet(wsSummaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse par régime');

    XLSX.writeFile(wb, `analyse_produits_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Fichier Excel exporté avec succès");
  };

  const regimes = Array.from(new Set(productData.map(p => p.regime)));

  const stats = {
    totalProducts: new Set(productData.map(p => p.asin)).size,
    totalAmount: productData.reduce((sum, p) => sum + p.totalTTC, 0),
    totalVAT: productData.reduce((sum, p) => sum + p.vatAmount, 0),
    totalTransactions: productData.reduce((sum, p) => sum + p.transactions, 0)
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyse par Produit</h1>
          <p className="text-muted-foreground">
            Répartition des régimes TVA et montants par ASIN/SKU
          </p>
        </div>
      </div>

      {/* Sélection du rapport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sélectionner un rapport à analyser
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choisir un rapport TVA..." />
              </SelectTrigger>
              <SelectContent>
                {reports.map(report => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.report_name} - {formatAmount(report.total_amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => selectedReport && analyzeProductData(selectedReport)}
              disabled={!selectedReport || loading}
            >
              <Package className="h-4 w-4 mr-2" />
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>

      {productData.length > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Produits uniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Montant Total TTC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatAmount(stats.totalVAT)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ASIN ou nom de produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={regimeFilter} onValueChange={setRegimeFilter}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Filtrer par régime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les régimes</SelectItem>
                    {regimes.map(regime => (
                      <SelectItem key={regime} value={regime}>{regime}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={exportToExcel} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des produits */}
          <Card>
            <CardHeader>
              <CardTitle>Détail par Produit et Régime TVA</CardTitle>
              <CardDescription>
                {filteredData.length} produit(s) affiché(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ASIN/SKU</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Régime TVA</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead className="text-right">HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Tx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{product.asin}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={product.productName}>
                        {product.productName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.country}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            product.regime === 'OSS' ? 'default' :
                            product.regime.includes('B2B') ? 'secondary' :
                            'outline'
                          }
                        >
                          {product.regime}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.accountType}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(product.totalHT)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        {formatAmount(product.vatAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatAmount(product.totalTTC)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.vatRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.transactions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {productData.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Aucune analyse disponible</p>
            <p className="text-muted-foreground">
              Sélectionnez un rapport et cliquez sur "Analyser" pour voir le détail par produit
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductAnalysisPage;
