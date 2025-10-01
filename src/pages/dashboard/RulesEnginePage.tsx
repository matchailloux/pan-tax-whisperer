import { useState } from "react";
import { Upload, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        title: "Analyse terminée",
        description: "Le rapport TVA a été analysé avec succès"
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
          Moteur de Règle
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Analysez vos rapports de transactions TVA Amazon avec catégorisation avancée
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Importer un rapport TVA Amazon</CardTitle>
          <CardDescription>
            Format CSV attendu avec colonnes Amazon (TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, TRANSACTION_TYPE, etc.)
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
        <>
          {/* Devises détectées */}
          {report.currencies.length > 1 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Plusieurs devises détectées: {report.currencies.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Tableau consolidé */}
          <Card>
            <CardHeader>
              <CardTitle>Tableau Consolidé par Pays et Catégorie</CardTitle>
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

          {/* TVA Domestique (REGULAR) */}
          <Card>
            <CardHeader>
              <CardTitle>(A) TVA DOMESTIQUE (REGULAR)</CardTitle>
              <CardDescription>FR, DE, ES, IT</CardDescription>
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

          {/* TVA OSS */}
          <Card>
            <CardHeader>
              <CardTitle>(B) TVA OSS</CardTitle>
              <CardDescription>Détail par pays UE</CardDescription>
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
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  ⚠️ Anomalies détectées ({report.anomalies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.anomalies.slice(0, 50).map((anomaly, idx) => (
                    <Alert key={idx} variant="destructive">
                      <AlertDescription>
                        <span className="font-medium">{anomaly.type}:</span> {anomaly.description}
                        {anomaly.tx_event_id && ` (ID: ${anomaly.tx_event_id})`}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {report.anomalies.length > 50 && (
                    <p className="text-sm text-muted-foreground">
                      ... et {report.anomalies.length - 50} autres anomalies
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
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
