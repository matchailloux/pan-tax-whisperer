import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface VATBreakdownData {
  country: string;
  localB2C: number;
  localB2B: number;
  intracommunautaire: number;
  oss: number;
  total: number;
}

interface VATBreakdownProps {
  data: VATBreakdownData[];
  fileName?: string;
}

export function VATBreakdown({ data, fileName }: VATBreakdownProps) {
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);

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
                <TableHead>Pays</TableHead>
                <TableHead className="text-right">Ventes domestique B2C</TableHead>
                <TableHead className="text-right">Ventes domestique B2B</TableHead>
                <TableHead className="text-right">Ventes Intracommunautaire</TableHead>
                <TableHead className="text-right">Ventes OSS</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.country}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{row.country}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(row.localB2C)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(row.localB2B)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(row.intracommunautaire)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(row.oss)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Ventes domestique B2C</p>
            <p className="text-xl font-bold text-blue-600">
              {formatAmount(data.reduce((sum, item) => sum + item.localB2C, 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Ventes domestique B2B</p>
            <p className="text-xl font-bold text-green-600">
              {formatAmount(data.reduce((sum, item) => sum + item.localB2B, 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Ventes Intracommunautaire</p>
            <p className="text-xl font-bold text-orange-600">
              {formatAmount(data.reduce((sum, item) => sum + item.intracommunautaire, 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Ventes OSS</p>
            <p className="text-xl font-bold text-purple-600">
              {formatAmount(data.reduce((sum, item) => sum + item.oss, 0))}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}