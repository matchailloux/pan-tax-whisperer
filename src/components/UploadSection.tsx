import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserFiles } from '@/hooks/useUserFiles';
import { useVATReports } from '@/hooks/useVATReports';
import { VATBreakdown } from './VATBreakdown';
import { NewVATBreakdown } from './NewVATBreakdown';
import { RulesConfig } from './RulesConfig';
import { processVATWithNewRules } from '@/utils/newVATRulesEngine';
import { processAmazonVATReport } from '@/utils/amazonVATEngine';
import * as XLSX from 'xlsx';

const UploadSection = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [vatBreakdown, setVatBreakdown] = useState<any>(null);
  const [newVatData, setNewVatData] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [useAutomaticEngine, setUseAutomaticEngine] = useState(true);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, updateFileStatus } = useUserFiles();
  const { saveReport } = useVATReports();

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      toast({
        title: "Format non supporté",
        description: "Veuillez télécharger un fichier CSV",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate progress for upload
    setProcessingProgress(20);
    
    // Upload file to Supabase Storage
    const fileId = await uploadFile(file);
    if (fileId) {
      setCurrentFileId(fileId);
      setProcessingProgress(40);
      await updateFileStatus(fileId, 'processing');
    }

    setProcessingProgress(60);
    // Process the file
    await analyzeFile(file, fileId);
    setProcessingProgress(100);
    setTimeout(() => setIsProcessing(false), 500);
  };

  const analyzeFile = async (file: File, fileId?: string | null) => {
    try {
      const text = await file.text();
      
      if (useAutomaticEngine) {
        // Use new engine
        const report = processVATWithNewRules(text);
        setNewVatData(report);
        setVatBreakdown(null);

        // Save report to database
        if (fileId) {
          await saveReport(report, `Analyse ${file.name}`, fileId);
          await updateFileStatus(fileId, 'completed');
        }

        toast({
          title: "Analyse terminée",
          description: `${report.breakdown.length} pays analysés avec succès et sauvegardé.`,
        });
      } else {
        // Use legacy engine
        const breakdown = processAmazonVATReport(text);
        setVatBreakdown(breakdown);
        setNewVatData(null);

        // Save report to database
        if (fileId) {
          await saveReport(breakdown, `Analyse ${file.name}`, fileId);
          await updateFileStatus(fileId, 'completed');
        }

        toast({
          title: "Analyse terminée",
          description: "Votre fichier a été analysé avec succès et sauvegardé.",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      if (fileId) {
        await updateFileStatus(fileId, 'error');
      }
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse du fichier.",
        variant: "destructive",
      });
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setVatBreakdown(null);
    setNewVatData(null);
    setCurrentFileId(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportToExcel = () => {
    if (!newVatData && !vatBreakdown) return;

    const wb = XLSX.utils.book_new();
    
    if (newVatData) {
      // Export KPI Cards
      const kpiData = newVatData.kpiCards.map((kpi: any) => ({
        'Catégorie': kpi.title,
        'Montant HT (signé)': kpi.metrics.find((m: any) => m.label === 'Montant HT (signé)')?.value || 0,
        'Transactions': kpi.metrics.find((m: any) => m.label === 'Transactions')?.value || 0
      }));
      const kpiWs = XLSX.utils.json_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(wb, kpiWs, 'Résumé');

      // Export Country Breakdown
      if (newVatData.breakdown && newVatData.breakdown.length > 0) {
        const countryData = newVatData.breakdown.map((item: any) => ({
          'Pays': item.country,
          'OSS': item.OSS_total || 0,
          'B2C': item.B2C_total || 0,
          'B2B': item.B2B_total || 0,
          'Intracommunautaire': item.Intracom_total || 0,
          'Export': item.Suisse_total || 0
        }));
        const countryWs = XLSX.utils.json_to_sheet(countryData);
        XLSX.utils.book_append_sheet(wb, countryWs, 'Ventilation par pays');
      }
    } else if (vatBreakdown) {
      // Export old format
      const oldData = vatBreakdown.pivotView.map((item: any) => ({
        'Pays': item.country,
        'Local B2C': item.localB2C || 0,
        'Local B2B': item.localB2B || 0,
        'Intracommunautaire': item.intracommunautaire || 0,
        'OSS': item.oss || 0,
        'Total': item.total || 0
      }));
      const oldWs = XLSX.utils.json_to_sheet(oldData);
      XLSX.utils.book_append_sheet(wb, oldWs, 'Données');
    }

    const fileName = `rapport-tva-amazon-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Export réussi",
      description: `Le fichier ${fileName} a été téléchargé.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Import de fichier CSV</CardTitle>
          <CardDescription>
            Téléchargez votre rapport TVA Amazon pour l'analyser automatiquement.
            Les analyses sont automatiquement sauvegardées dans votre tableau de bord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Glissez-déposez votre fichier CSV ici
              </h3>
              <p className="text-muted-foreground mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? 'Traitement...' : 'Choisir un fichier'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{uploadedFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                    {isProcessing && ' - Traitement en cours...'}
                  </p>
                  {isProcessing && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progression</span>
                        <span>{processingProgress}%</span>
                      </div>
                      <Progress value={processingProgress} className="w-full" />
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAnalysis}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engine Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Moteur d'analyse</CardTitle>
          <CardDescription>
            Choisissez le type d'analyse à effectuer sur vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="automatic-engine"
              checked={useAutomaticEngine}
              onCheckedChange={setUseAutomaticEngine}
            />
            <Label htmlFor="automatic-engine">
              Utiliser le moteur automatique (recommandé)
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {useAutomaticEngine
              ? "Le moteur automatique applique les dernières règles TVA européennes et effectue des vérifications de cohérence."
              : "Mode manuel avec configuration de règles personnalisées."}
          </p>
        </CardContent>
      </Card>

      {/* Rules Configuration (only in manual mode) */}
      {!useAutomaticEngine && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration des règles</CardTitle>
            <CardDescription>Mode manuel activé</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Results */}
      {newVatData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Résultats d'analyse</CardTitle>
                <CardDescription>
                  Analyse automatique avec vérifications de cohérence
                </CardDescription>
              </div>
              <Button onClick={exportToExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <NewVATBreakdown report={newVatData} fileName={uploadedFile?.name} />
          </CardContent>
        </Card>
      )}

      {vatBreakdown && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Résultats d'analyse</CardTitle>
                <CardDescription>
                  Analyse avec règles personnalisées
                </CardDescription>
              </div>
              <Button onClick={exportToExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <VATBreakdown data={vatBreakdown?.pivotView || []} fileName={uploadedFile?.name} />
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Comment obtenir votre rapport Amazon</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>Connectez-vous à Amazon Seller Central</li>
            <li>Allez dans Rapports → Paiements → Rapports d'activité de transaction</li>
            <li>Générez un rapport "Amazon VAT Transaction Report"</li>
            <li>Téléchargez le fichier CSV généré</li>
            <li>Importez-le ici pour analyse automatique</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadSection;