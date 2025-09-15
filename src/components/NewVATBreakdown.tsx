import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Info, TrendingUp, Users, Globe, Building, MapPin } from "lucide-react";
import { DetailedVATReport } from "@/utils/newVATRulesEngine";

interface NewVATBreakdownProps {
  report: DetailedVATReport;
  fileName?: string;
}

export function NewVATBreakdown({ report, fileName }: NewVATBreakdownProps) {
  const { breakdown, kpiCards, sanityCheckGlobal, sanityCheckByCountry, rulesApplied } = report;
  
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

  const getKPIIcon = (title: string) => {
    if (title.includes('Total')) return TrendingUp;
    if (title.includes('OSS')) return Globe;
    if (title.includes('B2C')) return Users;
    if (title.includes('B2B')) return Building;
    if (title.includes('Intracommunautaire')) return MapPin;
    if (title.includes('Export')) return MapPin;
    return AlertTriangle;
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪',
      'AT': '🇦🇹', 'PL': '🇵🇱', 'SE': '🇸🇪', 'DK': '🇩🇰', 'FI': '🇫🇮', 'NO': '🇳🇴',
      'PT': '🇵🇹', 'IE': '🇮🇪', 'LU': '🇱🇺', 'MT': '🇲🇹', 'CY': '🇨🇾', 'EE': '🇪🇪',
      'LV': '🇱🇻', 'LT': '🇱🇹', 'SI': '🇸🇮', 'SK': '🇸🇰', 'HR': '🇭🇷', 'BG': '🇧🇬',
      'RO': '🇷🇴', 'HU': '🇭🇺', 'CZ': '🇨🇿', 'GR': '🇬🇷', 'CH': '🇨🇭', 'GB': '🇬🇧',
      'US': '🇺🇸', 'CA': '🇨🇦', 'AU': '🇦🇺', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳',
      'BR': '🇧🇷', 'MX': '🇲🇽', 'IN': '🇮🇳', 'SG': '🇸🇬', 'AE': '🇦🇪', 'SA': '🇸🇦',
      'TR': '🇹🇷', 'IL': '🇮🇱', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'MA': '🇲🇦', 'NG': '🇳🇬'
    };
    return flags[countryCode] || '🏳️';
  };

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = getKPIIcon(kpi.title);
          const isTotal = kpi.title.includes('Total');
          
          return (
            <Card key={index} className={isTotal ? 'border-primary bg-primary/5' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className={`h-4 w-4 ${isTotal ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(kpi.amount)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(kpi.count)} transactions
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ventilation par Régime TVA */}
      <Card>
        <CardHeader>
          <CardTitle>Ventilation par Régime TVA</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Régime</TableHead>
                <TableHead className="text-right">Montant HT (signé)</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { label: 'OSS', match: (t: string) => t.includes('OSS') },
                { label: 'Domestique B2C', match: (t: string) => t.includes('B2C') },
                { label: 'Domestique B2B', match: (t: string) => t.includes('B2B') },
                { label: 'Intracommunautaire', match: (t: string) => t.includes('Intracommunautaire') },
                { label: 'Suisse (VOEC)', match: (t: string) => t.includes('Suisse') || t.includes('VOEC') },
                { label: 'Autre', match: (t: string) => t.includes('Autre') },
              ].map(({ label, match }) => {
                const kpi = kpiCards.find((k) => match(k.title)) || { amount: 0, count: 0 };
                return (
                  <TableRow key={label}>
                    <TableCell>{label}</TableCell>
                    <TableCell className="text-right font-mono">{kpi.amount ? formatAmount(kpi.amount) : '-'}</TableCell>
                    <TableCell className="text-right">{formatNumber(kpi.count || 0)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
                <TableHead className="text-right">OSS</TableHead>
                <TableHead className="text-right">B2C</TableHead>
                <TableHead className="text-right">B2B</TableHead>
                <TableHead className="text-right">Intracom</TableHead>
                <TableHead className="text-right">Suisse (VOEC)</TableHead>
                <TableHead className="text-right">Autre</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.map((row) => (
                <TableRow key={row.country}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(row.country)}</span>
                      <Badge variant="outline">{row.country}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.oss !== 0 ? formatAmount(row.oss) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.domesticB2C !== 0 ? formatAmount(row.domesticB2C) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.domesticB2B !== 0 ? formatAmount(row.domesticB2B) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.intracommunautaire !== 0 ? formatAmount(row.intracommunautaire) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.suisse !== 0 ? formatAmount(row.suisse) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.residuel !== 0 ? formatAmount(row.residuel) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{rulesApplied.ossRules}</div>
              <div className="text-sm text-blue-600">OSS</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{rulesApplied.domesticB2CRules}</div>
              <div className="text-sm text-green-600">B2C</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{rulesApplied.domesticB2BRules}</div>
              <div className="text-sm text-purple-600">B2B</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{rulesApplied.intracommunautaireRules}</div>
              <div className="text-sm text-orange-600">Intracommunautaire</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{rulesApplied.suisseRules}</div>
              <div className="text-sm text-red-600">Suisse</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{rulesApplied.residuelRules}</div>
              <div className="text-sm text-gray-600">Autre</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}