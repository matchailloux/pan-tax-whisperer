import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Download, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserFiles } from '@/hooks/useUserFiles';
import { useVATReports } from '@/hooks/useVATReports';
import { VATBreakdown } from './VATBreakdown';
import { NewVATBreakdown } from './NewVATBreakdown';
import { VATAnalyticsCharts } from './VATAnalyticsCharts';
import { RulesConfig } from './RulesConfig';
import { processVATWithNewYAMLRules } from '@/utils/newYAMLVATEngine';
import * as XLSX from 'xlsx';
import { DebugYAMLBar } from '@/components/DebugYAMLBar';
import { PeriodSelectionDialog } from './PeriodSelectionDialog';

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
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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

    // Store the file and show period selection dialog
    setPendingFile(file);
    setShowPeriodDialog(true);
  };

  const handlePeriodConfirm = async (period: any) => {
    if (!pendingFile) return;

    setUploadedFile(pendingFile);
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Simulate progress for upload
    setProcessingProgress(20);
    
    // Upload file to Supabase Storage
    const fileId = await uploadFile(pendingFile);
    if (fileId) {
      setCurrentFileId(fileId);
      setProcessingProgress(40);
      await updateFileStatus(fileId, 'processing');
    }

    setProcessingProgress(60);
    // Process the file with period information
    await analyzeFile(pendingFile, fileId, period);
    setProcessingProgress(100);
    setTimeout(() => setIsProcessing(false), 500);
    
    setPendingFile(null);
  };

  const analyzeFile = async (file: File, fileId?: string | null, period?: any) => {
    try {
      const text = await file.text();
      
      if (useAutomaticEngine) {
        // Use new YAML engine
        const report = processVATWithNewYAMLRules(text);

        // Debug console: stats + aperçu résultat
        try {
          // Plusieurs clés possibles selon versions
          const stats = (report as any)?.rulesStatistics ?? (report as any)?.rulesStats ?? null;
          console.log('STATISTIQUES DE CLASSIFICATION YAML:', stats ?? 'indisponible');
          console.log('RÉSULTAT FINAL YAML:', {
            countries: Array.isArray((report as any)?.breakdown) ? (report as any).breakdown.length : 0,
            kpis: Array.isArray((report as any)?.kpiCards) ? (report as any).kpiCards.length : 0,
          });
        } catch {}

        // Mode debug: forcer l'utilisation du YAML même si breakdown vide
        const forceYAML = (() => {
          try {
            const v = localStorage.getItem('debug:forceYAML');
            return v === '1' || v === 'true';
          } catch {
            return false;
          }
        })();

        const hasCountries = Array.isArray(report.breakdown) && report.breakdown.length > 0;
        const hasAnyTx = (report as any)?.rulesApplied?.totalProcessed > 0;
        if (hasCountries || hasAnyTx || forceYAML) {
          setNewVatData(report);
          setVatBreakdown(null);

          if (fileId) {
            const title = forceYAML && (!report.breakdown || report.breakdown.length === 0)
              ? `Analyse ${file.name} (YAML forcé)`
              : `Analyse ${file.name}`;
            
            // Add period information to the report
            const reportWithPeriod = {
              ...report,
              periodStart: period?.startDate,
              periodEnd: period?.endDate,
              periodType: period?.type
            };
            
            await saveReport(reportWithPeriod, title, fileId);
            await updateFileStatus(fileId, 'completed');
          }

          toast({
            title: forceYAML && (!report.breakdown || report.breakdown.length === 0)
              ? 'Analyse terminée (YAML forcé)'
              : 'Analyse terminée',
            description: `${report?.breakdown?.length ?? 0} pays analysés${forceYAML ? ' • mode forcé' : ''}.`,
          });
        } else {
          // Pas de fallback: signaler l'erreur et ne pas enregistrer un faux rapport
          if (fileId) {
            await updateFileStatus(fileId, 'error');
          }
          toast({
            title: "Aucune transaction reconnue",
            description: "Impossible d'identifier des opérations SALE/REFUND. Vérifiez la colonne TRANSACTION_TYPE (valeurs SALE ou REFUND).",
            variant: "destructive",
          });
        }
      } else {
        // Use legacy engine
        const breakdown = processVATWithNewYAMLRules(text);
        setVatBreakdown(breakdown);
        setNewVatData(null);

        // Save report to database
        if (fileId) {
          const reportWithPeriod = {
            ...breakdown,
            periodStart: period?.startDate,
            periodEnd: period?.endDate,
            periodType: period?.type
          };
          await saveReport(reportWithPeriod, `Analyse ${file.name}`, fileId);
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
    <div className="space-y-8">
      <DebugYAMLBar report={newVatData} />
      {/* Upload Area - Design épuré */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Importez votre rapport Amazon</h3>
              <p className="text-muted-foreground">
                Glissez-déposez votre fichier CSV ou cliquez pour le sélectionner
              </p>
            </div>
            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragActive
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Formats supportés: .csv (Amazon VAT Transaction Report)
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
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
              </div>
            ) : (
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 rounded-xl border border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg">
                      <FileText className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{uploadedFile.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                        {isProcessing && ' - Analyse en cours...'}
                      </p>
                      {isProcessing && (
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progression</span>
                            <span className="font-medium text-primary">{processingProgress}%</span>
                          </div>
                          <Progress value={processingProgress} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAnalysis}
                    disabled={isProcessing}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engine Selection - Design minimaliste */}
      <Card className="bg-gradient-to-r from-background to-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">Moteur d'analyse</h3>
              <p className="text-sm text-muted-foreground">
                {useAutomaticEngine
                  ? "Moteur automatique avec règles TVA européennes"
                  : "Mode manuel avec configuration personnalisée"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Label htmlFor="automatic-engine" className="text-sm font-medium">
                Auto
              </Label>
              <Switch
                id="automatic-engine"
                checked={useAutomaticEngine}
                onCheckedChange={setUseAutomaticEngine}
              />
            </div>
          </div>
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

      {/* Résultats avec graphiques */}
      {newVatData && (
        <div className="space-y-6">
          {/* Header des résultats */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Résultats d'analyse</h2>
              <p className="text-muted-foreground">
                Analyse automatique avec vérifications de cohérence
              </p>
            </div>
            <Button onClick={exportToExcel} className="bg-gradient-primary hover:shadow-glow">
              <Download className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
          </div>

          {/* Graphiques d'analyse */}
          <VATAnalyticsCharts report={newVatData} />

          {/* Détails complets */}
          <NewVATBreakdown report={newVatData} fileName={uploadedFile?.name} />
        </div>
      )}

      {vatBreakdown && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Résultats d'analyse</h2>
              <p className="text-muted-foreground">
                Analyse avec moteur legacy
              </p>
            </div>
            <Button onClick={exportToExcel} className="bg-gradient-primary hover:shadow-glow">
              <Download className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <VATBreakdown data={vatBreakdown?.pivotView || []} fileName={uploadedFile?.name} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions - Design épuré */}
      <Card className="bg-gradient-to-r from-muted/30 to-accent/5 border-accent/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Info className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-3">Comment obtenir votre rapport Amazon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Seller Central → Rapports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Paiements → Activité transaction</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Générer "VAT Transaction Report"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <span>Importer le fichier CSV ici</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadSection;