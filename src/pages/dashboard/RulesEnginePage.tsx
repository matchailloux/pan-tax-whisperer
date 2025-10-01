import { useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { processAdvancedVAT, type AdvancedVATReport } from "@/utils/advancedVATEngine";

const RulesEnginePage = () => {
  const [report, setReport] = useState<AdvancedVATReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

          {/* Consolidated Table */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Tableau Consolidé (Pays × Catégorie)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">CA HT (€)</TableHead>
                    <TableHead className="text-right">TVA (€)</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.consolidated.map((row, idx) => (
                    <TableRow key={idx} className={row.pays === 'TOTAL GÉNÉRAL' ? 'font-bold bg-muted' : ''}>
                      <TableCell>{row.pays}</TableCell>
                      <TableCell>{row.categorie}</TableCell>
                      <TableCell className="text-right">{row.ca_ht.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.tva.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.transactions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Domestic VAT Table */}
          <Card>
            <CardHeader>
              <CardTitle>🇪🇺 (A) TVA DOMESTIQUE (REGULAR)</CardTitle>
              <CardDescription>Pays cibles: FR, DE, ES, IT</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead className="text-right">TVA Regular (€)</TableHead>
                    <TableHead className="text-right">CA HT Regular (€)</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.domesticVAT.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.pays}</TableCell>
                      <TableCell className="text-right">{row.tva.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.ca_ht.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.transactions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* OSS VAT Table */}
          <Card>
            <CardHeader>
              <CardTitle>🌍 (B) TVA OSS</CardTitle>
              <CardDescription>Détail par pays UE + Total OSS</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays de destination (UE)</TableHead>
                    <TableHead className="text-right">TVA OSS (€)</TableHead>
                    <TableHead className="text-right">CA HT OSS (€)</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.ossVAT.map((row, idx) => (
                    <TableRow key={idx} className={row.pays === 'TOTAL OSS' ? 'font-bold bg-muted' : ''}>
                      <TableCell>{row.pays}</TableCell>
                      <TableCell className="text-right">{row.tva.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.ca_ht.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.transactions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
