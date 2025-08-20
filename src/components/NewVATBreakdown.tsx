import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { VATRuleData, SanityCheckGlobal, SanityCheckByCountry, DetailedVATReport } from "@/utils/newVATRulesEngine";

interface NewVATBreakdownProps {
  data: VATRuleData[];
  sanityCheckGlobal: SanityCheckGlobal;
  sanityCheckByCountry: SanityCheckByCountry[];
  rulesApplied: {
    ossRules: number;
    domesticB2CRules: number;
    domesticB2BRules: number;
    intracommunautaireRules: number;
    totalProcessed: number;
  };
  fileName?: string;
}

export function NewVATBreakdown({ data, sanityCheckGlobal, sanityCheckByCountry, rulesApplied, fileName }: NewVATBreakdownProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const invalidCountries = sanityCheckByCountry.filter(c => !c.isValid);

  return (
    <div className="space-y-6">
      {/* Sanity Check Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {sanityCheckGlobal.isValid ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            Sanity Check Global
            {fileName && (
              <Badge variant="outline" className="font-normal ml-auto">
                {fileName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant={sanityCheckGlobal.isValid ? "default" : "destructive"}>
            <AlertDescription>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">Grand Total: {formatAmount(sanityCheckGlobal.grandTotal)}</p>
                  <p className="font-medium">OSS Total: {formatAmount(sanityCheckGlobal.ossTotal)}</p>
                  <p className="font-medium">REGULAR Total: {formatAmount(sanityCheckGlobal.regularTotal)}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Δ GT − (OSS+REG): {formatAmount(sanityCheckGlobal.diffGrandTotalVsSum)}</p>
                  <p className="font-medium">Δ REG − (B2C+B2B+Intra): {formatAmount(sanityCheckGlobal.diffRegularVsComponents)}</p>
                  <p className="text-sm text-muted-foreground">
                    {sanityCheckGlobal.isValid ? "✅ Calculs cohérents" : "❌ Écarts détectés"}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Sanity Check par pays - afficher seulement s'il y a des erreurs */}
      {invalidCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Sanity Check par Pays - Erreurs détectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pays</TableHead>
                  <TableHead className="text-right">REGULAR Total</TableHead>
                  <TableHead className="text-right">B2C</TableHead>
                  <TableHead className="text-right">B2B</TableHead>
                  <TableHead className="text-right">Intracom</TableHead>
                  <TableHead className="text-right">Différence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invalidCountries.map((check) => (
                  <TableRow key={check.country} className="bg-destructive/5">
                    <TableCell><Badge variant="outline">{check.country}</Badge></TableCell>
                    <TableCell className="text-right">{formatAmount(check.regularTotal)}</TableCell>
                    <TableCell className="text-right">{formatAmount(check.b2cTotal)}</TableCell>
                    <TableCell className="text-right">{formatAmount(check.b2bTotal)}</TableCell>
                    <TableCell className="text-right">{formatAmount(check.intracomTotal)}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatAmount(check.difference)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tableaux de synthèse par type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Domestique B2C</p>
            <p className="text-xl font-bold text-blue-600">
              {formatAmount(sanityCheckGlobal.b2cTotal)}
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
              {formatAmount(sanityCheckGlobal.b2bTotal)}
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
              {formatAmount(sanityCheckGlobal.intracomTotal)}
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
              {formatAmount(sanityCheckGlobal.ossTotal)}
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
              <p className="text-sm text-muted-foreground">Grand Total analysé</p>
              <p className="text-2xl font-bold text-primary">
                {formatAmount(sanityCheckGlobal.grandTotal)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(rulesApplied.totalProcessed)} transactions traitées
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
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Statistiques des Règles Appliquées
          </CardTitle>
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