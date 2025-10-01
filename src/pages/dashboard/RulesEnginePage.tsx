import { useState } from "react";
import { Upload, FileText, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { processAdvancedVAT, type AdvancedVATReport } from "@/utils/advancedVATEngine";

const RulesEnginePage = () => {
  const [report, setReport] = useState<AdvancedVATReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await file.text();
      const result = processAdvancedVAT(content);
      setReport(result);
      toast({
        title: "✅ Analyse terminée",
        description: `${result.consolidated.length - 1} lignes consolidées, ${result.anomalies.length} anomalies détectées`
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le fichier",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCountry = (countryKey: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryKey)) {
        newSet.delete(countryKey);
      } else {
        newSet.add(countryKey);
      }
      return newSet;
    });
  };

  const renderRegimeTable = (regime: 'unionOSS' | 'regular' | 'voec' | 'empty', title: string) => {
    if (!report) return null;
    
    const data = report[regime];
    if (data.countries.length === 0) return null;

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Pays</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">TVA</TableHead>
              <TableHead className="text-right">Devise</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.countries.map((country, idx) => {
              const key = `${regime}-${country.country}`;
              const isExpanded = expandedCountries.has(key);
              const hasDetails = country.details && country.details.length > 0;

              return (
                <>
                  {/* Main country row */}
                  <TableRow 
                    key={idx}
                    className={`${hasDetails ? 'cursor-pointer hover:bg-muted/50' : ''} ${isExpanded ? 'bg-muted/30' : ''}`}
                    onClick={() => hasDetails && toggleCountry(key)}
                  >
                    <TableCell>
                      {hasDetails && (
                        isExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{country.country}</TableCell>
                    <TableCell className="text-right">{country.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{country.base.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{country.vat.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{country.currency}</TableCell>
                  </TableRow>

                  {/* Expanded detail rows (SALE/REFUND) */}
                  {isExpanded && country.details && country.details.map((detail, detailIdx) => (
                    <TableRow 
                      key={`${key}-${detailIdx}`}
                      className={`bg-muted/20 ${detail.type === 'REFUND' ? 'text-destructive' : 'text-green-600'}`}
                    >
                      <TableCell></TableCell>
                      <TableCell className="pl-8">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          detail.type === 'REFUND' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {detail.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{detail.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{detail.base.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{detail.vat.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{detail.currency}</TableCell>
                    </TableRow>
                  ))}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Moteur de Règle TVA
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Analysez vos rapports de transactions TVA Amazon avec catégorisation avancée et détection automatique du format
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Importer un rapport TVA Amazon</CardTitle>
          <CardDescription>
            Format CSV avec détection automatique du délimiteur (tabulation, point-virgule, virgule)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? "Analyse en cours..." : "Sélectionner un fichier"}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6">
          {/* Diagnostic Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Diagnostic CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Délimiteur détecté:</strong> {report.diagnostic.delimiter}</p>
                <p><strong>Nombre de lignes:</strong> {report.diagnostic.rowCount}</p>
                <p><strong>Aperçu des colonnes (3 premières valeurs):</strong></p>
                <div className="mt-2 space-y-1 font-mono text-xs max-h-60 overflow-y-auto bg-muted p-3 rounded">
                  {report.diagnostic.columns.map((col, idx) => (
                    <div key={idx}>
                      <strong className="text-primary">{col.name}:</strong>{' '}
                      {col.samples.length > 0 ? col.samples.join(' | ') : '(vide)'}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {report.currencies.length > 1 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Plusieurs devises détectées: {report.currencies.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* TVA détaillée - Tabbed Interface */}
          <Card>
            <CardHeader>
              <CardTitle>📋 TVA Détaillée</CardTitle>
              <CardDescription>Vue par régime TVA avec détail SALE/REFUND par pays</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="unionOSS" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="unionOSS">UNION-OSS</TabsTrigger>
                  <TabsTrigger value="regular">REGULAR</TabsTrigger>
                  <TabsTrigger value="voec">VOEC</TabsTrigger>
                  <TabsTrigger value="empty">EMPTY</TabsTrigger>
                </TabsList>

                <TabsContent value="unionOSS" className="mt-4">
                  {renderRegimeTable('unionOSS', 'UNION-OSS')}
                  {report.unionOSS.countries.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Aucune transaction UNION-OSS</p>
                  )}
                </TabsContent>

                <TabsContent value="regular" className="mt-4">
                  {renderRegimeTable('regular', 'REGULAR')}
                  {report.regular.countries.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Aucune transaction REGULAR</p>
                  )}
                </TabsContent>

                <TabsContent value="voec" className="mt-4">
                  {renderRegimeTable('voec', 'VOEC')}
                  {report.voec.countries.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Aucune transaction VOEC</p>
                  )}
                </TabsContent>

                <TabsContent value="empty" className="mt-4">
                  {renderRegimeTable('empty', 'EMPTY')}
                  {report.empty.countries.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Aucune transaction sans pays</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Anomalies */}
          {report.anomalies.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>⚠️ Anomalies Détectées ({report.anomalies.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 max-h-60 overflow-y-auto">
                  {report.anomalies.slice(0, 100).map((anomaly, idx) => (
                    <li key={idx} className="text-sm">
                      <strong>{anomaly.type}:</strong> {anomaly.description}
                      {anomaly.tx_event_id && <span className="text-xs ml-2">(ID: {anomaly.tx_event_id})</span>}
                    </li>
                  ))}
                  {report.anomalies.length > 100 && (
                    <li className="text-xs text-muted-foreground">
                      ... et {report.anomalies.length - 100} autres anomalies
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {report.anomalies.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Aucune anomalie détectée
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {!report && !isProcessing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun rapport analysé. Importez un fichier CSV pour commencer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RulesEnginePage;
