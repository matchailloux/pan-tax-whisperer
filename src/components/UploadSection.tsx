import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RulesConfig, VATRule } from "./RulesConfig";
import { VATBreakdown, VATBreakdownData } from "./VATBreakdown";
import { parseCSV, applyVATRules } from "@/utils/vatProcessor";
import { processAmazonVATReport } from "@/utils/amazonVATEngine";

const UploadSection = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rules, setRules] = useState<VATRule[]>([]);
  const [vatBreakdown, setVatBreakdown] = useState<VATBreakdownData[] | null>(null);
  const [showRulesConfig, setShowRulesConfig] = useState(false);
  const [useAutoEngine, setUseAutoEngine] = useState(true);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith('.csv')) {
      setUploadedFile(file);
      setVatBreakdown(null);
      toast({
        title: "Fichier téléchargé avec succès",
        description: `${file.name} est prêt à être analysé`,
      });
    } else {
      toast({
        title: "Format non supporté",
        description: "Veuillez télécharger un fichier CSV",
        variant: "destructive",
      });
    }
  };

  const analyzeFile = async () => {
    if (!uploadedFile) return;
    
    if (!useAutoEngine && rules.length === 0) {
      toast({
        title: "Impossible d'analyser",
        description: "Veuillez configurer au moins une règle de ventilation.",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = await uploadedFile.text();
      let breakdown: VATBreakdownData[];
      
      if (useAutoEngine) {
        breakdown = processAmazonVATReport(content);
      } else {
        const rows = parseCSV(content);
        breakdown = applyVATRules(rows, rules);
      }
      
      setVatBreakdown(breakdown);
      toast({
        title: "Analyse terminée",
        description: `${breakdown.length} pays analysés ${useAutoEngine ? '(moteur automatique)' : '(règles manuelles)'}.`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Impossible de traiter le fichier CSV.",
        variant: "destructive",
      });
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setVatBreakdown(null);
    toast({
      title: "Nouvelle analyse",
      description: "Vous pouvez maintenant importer un nouveau fichier.",
    });
  };

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Téléchargez votre rapport
              <span className="bg-gradient-hero bg-clip-text text-transparent"> Amazon TVA</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Traitement automatique des rapports Amazon VAT avec notre moteur intelligent
            </p>
            
            <div className="flex items-center justify-center space-x-4 mt-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-engine"
                  checked={useAutoEngine}
                  onCheckedChange={setUseAutoEngine}
                />
                <Label htmlFor="auto-engine" className="text-base">
                  Moteur automatique Amazon (recommandé)
                </Label>
              </div>
            </div>
            
            {!useAutoEngine && (
              <Alert className="mt-4 max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Mode manuel activé</AlertTitle>
                <AlertDescription>
                  Vous devrez configurer les règles de ventilation manuellement.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Rules Configuration - Only show in manual mode */}
          {!useAutoEngine && (
            <div className="mb-8">
              <Button 
                onClick={() => setShowRulesConfig(!showRulesConfig)}
                variant="outline" 
                className="mb-4"
              >
                {showRulesConfig ? 'Masquer' : 'Configurer'} les règles de ventilation
              </Button>
              
              {showRulesConfig && (
                <RulesConfig onRulesChange={setRules} />
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Upload Area */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Importer votre fichier CSV
                </CardTitle>
                <CardDescription>
                  Rapport de transaction TVA depuis Amazon Seller Central
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-smooth ${
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : uploadedFile 
                        ? "border-accent bg-accent/5" 
                        : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadedFile ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-accent">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button 
                        variant="accent" 
                        size="lg"
                        onClick={analyzeFile}
                        disabled={!useAutoEngine && rules.length === 0}
                      >
                        {useAutoEngine 
                          ? "Analyser automatiquement"
                          : `Analyser le fichier (${rules.length} règle${rules.length > 1 ? 's' : ''})`
                        }
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold mb-2">
                          Glissez-déposez votre fichier CSV ici
                        </p>
                        <p className="text-muted-foreground">
                          ou cliquez pour sélectionner
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" size="lg">
                        Sélectionner un fichier
                      </Button>
                    </div>
                  )}
                </div>

                {uploadedFile && (
                  <div className="mt-4 p-4 bg-accent/10 rounded-lg">
                    <p className="text-sm text-accent font-medium mb-2">
                      ✓ Fichier compatible détecté
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Format Amazon Transaction VAT Report reconnu
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* VAT Breakdown Results */}
            {vatBreakdown && (
              <div className="mb-8 col-span-full">
                <VATBreakdown data={vatBreakdown} fileName={uploadedFile?.name} />
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={resetAnalysis}
                  >
                    Importer un nouveau fichier
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comment obtenir votre rapport ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Connectez-vous à Amazon Seller Central</p>
                      <p className="text-sm text-muted-foreground">Accédez à votre compte vendeur</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Allez dans Rapports → Rapports fiscaux</p>
                      <p className="text-sm text-muted-foreground">Section "Transaction VAT Report"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Téléchargez le rapport au format CSV</p>
                      <p className="text-sm text-muted-foreground">Sélectionnez la période souhaitée</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/50 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-accent">Données sécurisées</p>
                      <p className="text-sm text-muted-foreground">
                        Vos fichiers sont traités en local et supprimés après analyse. 
                        Aucune donnée sensible n'est stockée sur nos serveurs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UploadSection;