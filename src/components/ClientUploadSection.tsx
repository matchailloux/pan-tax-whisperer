import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClientFiles } from '@/hooks/useClientFiles';
import { useClientVATReports } from '@/hooks/useClientVATReports';
import { useVATAnalysis } from '@/hooks/useVATAnalysis';
import { useToast } from '@/hooks/use-toast';
import { DebugYAMLBar } from '@/components/DebugYAMLBar';

interface ClientUploadSectionProps {
  clientId: string;
  clientName: string;
}

const ClientUploadSection: React.FC<ClientUploadSectionProps> = ({ clientId, clientName }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { files, uploadFile, updateFileStatus, loading: filesLoading } = useClientFiles(clientId);
  const { reports, loading: reportsLoading } = useClientVATReports(clientId);
  const { analyzeFile, isAnalyzing } = useVATAnalysis();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Upload du fichier vers Supabase Storage
      const fileId = await uploadFile(file, clientId);
      
      if (fileId) {
        toast({
          title: "Fichier uploadé",
          description: `Le fichier ${file.name} a été téléchargé avec succès pour ${clientName}. Analyse en cours...`,
        });

        // Analyse automatique du fichier
        await analyzeFile(file, fileId, updateFileStatus, clientId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible de télécharger le fichier. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Analysé';
      case 'processing':
        return 'En cours';
      case 'error':
        return 'Erreur';
      default:
        return 'En attente';
    }
  };

  return (
    <div className="space-y-6">
      <DebugYAMLBar />
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de fichier TVA pour {clientName}
          </CardTitle>
          <CardDescription>
            Téléchargez les fichiers de transactions Amazon de votre client pour analyse automatique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Glissez-déposez votre fichier ici
                </h3>
                <p className="text-muted-foreground mb-4">
                  Ou cliquez pour sélectionner un fichier (.csv, .xlsx, .txt)
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button
                  disabled={isUploading || isAnalyzing}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {isUploading || isAnalyzing ? 'Traitement en cours...' : 'Sélectionner un fichier'}
                </Button>
              </div>
              
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Fichiers du client ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des fichiers...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun fichier téléchargé pour ce client
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString('fr-FR')} • {(file.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.analysis_status)}
                    <Badge variant="outline">
                      {getStatusLabel(file.analysis_status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports d'analyse TVA ({reports.length})</CardTitle>
          <CardDescription>
            Analyses TVA générées automatiquement avec le moteur de règles avancé
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des rapports...
            </div>
          ) : reports.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun rapport d'analyse disponible pour ce client. 
                Les rapports seront générés automatiquement après l'upload et l'analyse des fichiers.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{report.report_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString('fr-FR')} • 
                      Montant total: {report.total_amount.toFixed(2)} {report.currency}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Naviguer vers l'onglet analyse ou ouvrir un dialog avec l'analyse
                        const tabsElement = document.querySelector('[data-value="analysis"]') as HTMLButtonElement;
                        tabsElement?.click();
                      }}
                    >
                      Voir l'analyse
                    </Button>
                    <Button variant="outline" size="sm">
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientUploadSection;