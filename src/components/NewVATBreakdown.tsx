import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { VATRuleData, VerificationResult } from "@/utils/newVATRulesEngine";

interface NewVATBreakdownProps {
  data: VATRuleData[];
  verification: VerificationResult;
  rulesApplied: {
    ossRules: number;
    domesticB2CRules: number;
    domesticB2BRules: number;
    intracommunautaireRules: number;
  };
  fileName?: string;
}

export function NewVATBreakdown({ data, verification, rulesApplied, fileName }: NewVATBreakdownProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Carte de vérification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {verification.isValid ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            Vérification des Calculs
            {fileName && (
              <Badge variant="outline" className="font-normal ml-auto">
                {fileName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={verification.isValid ? "default" : "destructive"}>
            <AlertDescription>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total des règles: {formatAmount(verification.totalFromRules)}</p>
                  <p className="font-medium">Total du CSV: {formatAmount(verification.totalFromCSV)}</p>
                </div>
                <div>
                  <p className="font-medium">Différence: {formatAmount(verification.difference)}</p>
                  <p className="text-sm text-muted-foreground">
                    {verification.isValid ? "✅ Calculs cohérents" : "❌ Écart détecté"}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tableaux de synthèse par type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Domestique B2C</p>
            <p className="text-xl font-bold text-blue-600">
              {formatAmount(verification.details.domesticB2CTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rulesApplied.domesticB2CRules)} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Domestique B2B</p>
            <p className="text-xl font-bold text-green-600">
              {formatAmount(verification.details.domesticB2BTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rulesApplied.domesticB2BRules)} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Intracommunautaire</p>
            <p className="text-xl font-bold text-orange-600">
              {formatAmount(verification.details.intracommunautaireTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rulesApplied.intracommunautaireRules)} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">OSS</p>
            <p className="text-xl font-bold text-purple-600">
              {formatAmount(verification.details.ossTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(rulesApplied.ossRules)} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé par pays */}
      <Card>
        <CardHeader>
          <CardTitle>Ventilation TVA par Pays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-primary/10 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Montant total analysé</p>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(verification.totalFromRules)}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pays</TableHead>
                <TableHead className="text-right">Domestique B2C</TableHead>
                <TableHead className="text-right">Domestique B2B</TableHead>
                <TableHead className="text-right">Intracommunautaire</TableHead>
                <TableHead className="text-right">OSS</TableHead>
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
                    {formatAmount(row.domesticB2C)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(row.domesticB2B)}
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

      {/* Détails des règles appliquées */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des Règles Appliquées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(rulesApplied.domesticB2CRules)}</p>
              <p className="text-sm text-muted-foreground">Règles B2C</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatNumber(rulesApplied.domesticB2BRules)}</p>
              <p className="text-sm text-muted-foreground">Règles B2B</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(rulesApplied.intracommunautaireRules)}</p>
              <p className="text-sm text-muted-foreground">Règles Intracom</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(rulesApplied.ossRules)}</p>
              <p className="text-sm text-muted-foreground">Règles OSS</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}