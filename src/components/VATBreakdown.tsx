import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface VATBreakdownData {
  country: string;
  localB2C: number;
  localB2B: number;
  intracommunautaire: number;
  oss: number;
  switzerland: number;
  total: number;
  // Montants de TVA due par régime
  vatLocalB2C: number;
  vatLocalB2B: number;
  vatIntracommunautaire: number; // Toujours 0 (auto-liquidation)
  vatOss: number;
  vatSwitzerland: number; // Toujours 0 (export)
  totalVat: number;
}

interface VATBreakdownProps {
  data: VATBreakdownData[];
  fileName?: string;
}

export function VATBreakdown({ data, fileName }: VATBreakdownProps) {
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const totalVatAmount = data.reduce((sum, item) => sum + item.totalVat, 0);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Ventilation TVA par Pays
            {fileName && (
              <Badge variant="outline" className="font-normal">
                {fileName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-primary/10 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Montant total TVA</p>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(totalAmount)}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="border-r">Pays</TableHead>
                <TableHead colSpan={5} className="text-center border-r">Montant des Ventes (HT)</TableHead>
                <TableHead colSpan={5} className="text-center">TVA Due</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-right text-xs">B2C National</TableHead>
                <TableHead className="text-right text-xs">B2B National</TableHead>
                <TableHead className="text-right text-xs">Intracommunautaire</TableHead>
                <TableHead className="text-right text-xs">OSS/IOSS</TableHead>
                <TableHead className="text-right text-xs border-r">Suisse (VOEC)</TableHead>
                <TableHead className="text-right text-xs bg-orange-50">B2C National</TableHead>
                <TableHead className="text-right text-xs bg-orange-50">B2B National</TableHead>
                <TableHead className="text-right text-xs bg-orange-50">Intracommunautaire</TableHead>
                <TableHead className="text-right text-xs bg-orange-50">OSS/IOSS</TableHead>
                <TableHead className="text-right text-xs bg-orange-50">Suisse (VOEC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.country}>
                  <TableCell className="font-medium border-r">
                    <Badge variant="outline">{row.country}</Badge>
                  </TableCell>
                  {/* Ventes */}
                  <TableCell className="text-right text-sm">
                    {formatAmount(row.localB2C)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatAmount(row.localB2B)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatAmount(row.intracommunautaire)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatAmount(row.oss)}
                  </TableCell>
                  <TableCell className="text-right text-sm border-r">
                    {formatAmount(row.switzerland)}
                  </TableCell>
                  {/* TVA Due */}
                  <TableCell className="text-right text-sm font-medium text-orange-600 bg-orange-50">
                    {formatAmount(row.vatLocalB2C)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-orange-600 bg-orange-50">
                    {formatAmount(row.vatLocalB2B)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-muted-foreground bg-orange-50">
                    {formatAmount(row.vatIntracommunautaire)} <span className="text-xs">(0%)</span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-orange-600 bg-orange-50">
                    {formatAmount(row.vatOss)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-muted-foreground bg-orange-50">
                    {formatAmount(row.vatSwitzerland)} <span className="text-xs">(0%)</span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Ligne de totaux */}
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell className="border-r">TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatAmount(data.reduce((sum, item) => sum + item.localB2C, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(data.reduce((sum, item) => sum + item.localB2B, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(data.reduce((sum, item) => sum + item.intracommunautaire, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(data.reduce((sum, item) => sum + item.oss, 0))}
                </TableCell>
                <TableCell className="text-right border-r">
                  {formatAmount(data.reduce((sum, item) => sum + item.switzerland, 0))}
                </TableCell>
                <TableCell className="text-right text-orange-600 bg-orange-100">
                  {formatAmount(data.reduce((sum, item) => sum + item.vatLocalB2C, 0))}
                </TableCell>
                <TableCell className="text-right text-orange-600 bg-orange-100">
                  {formatAmount(data.reduce((sum, item) => sum + item.vatLocalB2B, 0))}
                </TableCell>
                <TableCell className="text-right text-muted-foreground bg-orange-100">
                  {formatAmount(0)}
                </TableCell>
                <TableCell className="text-right text-orange-600 bg-orange-100">
                  {formatAmount(data.reduce((sum, item) => sum + item.vatOss, 0))}
                </TableCell>
                <TableCell className="text-right text-muted-foreground bg-orange-100">
                  {formatAmount(0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Récap Ventes par Régime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ventilation par Régime TVA - Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">B2C National</span>
                <span className="font-bold text-blue-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.localB2C, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">B2B National</span>
                <span className="font-bold text-green-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.localB2B, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Intracommunautaire</span>
                <span className="font-bold text-orange-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.intracommunautaire, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">OSS/IOSS</span>
                <span className="font-bold text-purple-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.oss, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Suisse (VOEC)</span>
                <span className="font-bold text-cyan-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.switzerland, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Récap TVA Due par Régime */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ventilation par Régime TVA - TVA Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded-lg bg-orange-50">
                <span className="text-sm text-muted-foreground">B2C National</span>
                <span className="font-bold text-orange-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.vatLocalB2C, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-orange-50">
                <span className="text-sm text-muted-foreground">B2B National</span>
                <span className="font-bold text-orange-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.vatLocalB2B, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                <span className="text-sm text-muted-foreground">
                  Intracommunautaire <span className="text-xs">(auto-liquidation)</span>
                </span>
                <span className="font-bold text-muted-foreground">
                  {formatAmount(0)} (0%)
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-orange-50">
                <span className="text-sm text-muted-foreground">OSS/IOSS</span>
                <span className="font-bold text-orange-600">
                  {formatAmount(data.reduce((sum, item) => sum + item.vatOss, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                <span className="text-sm text-muted-foreground">
                  Suisse (VOEC) <span className="text-xs">(export 0%)</span>
                </span>
                <span className="font-bold text-muted-foreground">
                  {formatAmount(0)} (0%)
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-100 border-2 border-orange-300 rounded-lg">
                <span className="font-medium">Total TVA Due</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatAmount(totalVatAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}