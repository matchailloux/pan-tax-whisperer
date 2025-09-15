import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClientVATReports } from '@/hooks/useClientVATReports';
import { useClientFiles } from '@/hooks/useClientFiles';
import { useVATAnalysis } from '@/hooks/useVATAnalysis';
import { NewVATBreakdown } from '@/components/NewVATBreakdown';
import { Eye, FileText, BarChart3, Download, Calendar } from 'lucide-react';
import { DetailedVATReport } from '@/utils/newYAMLVATEngine';

const ClientVATAnalysis = () => {
  const { clientId } = useParams();
  const { reports, loading: reportsLoading } = useClientVATReports(clientId);
  const { files } = useClientFiles(clientId);
  const { getStoredReport } = useVATAnalysis();
  const [selectedReport, setSelectedReport] = useState<(DetailedVATReport & { fileName?: string }) | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const handleViewAnalysis = async (reportId: string, fileName: string) => {
    try {
      const storedReport = await getStoredReport(reportId);
      if (storedReport) {
        setSelectedReport({
          ...storedReport,
          fileName
        } as DetailedVATReport & { fileName: string });
        setShowAnalysisDialog(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (reportsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Analyses TVA</h3>
        <p className="text-muted-foreground">
          Rapports d'analyse TVA générés automatiquement avec le moteur de règles avancé
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Aucune analyse disponible</h3>
                <p className="text-muted-foreground mt-1">
                  Les analyses seront générées automatiquement lorsque le client uploade ses fichiers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => {
            const associatedFile = files.find(file => 
              file.file_name.includes(report.report_name.split('_')[0]) ||
              report.report_name.includes(file.file_name.split('.')[0])
            );

            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {report.report_name}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span>
                            Montant total: <strong>{formatAmount(report.total_amount)}</strong>
                          </span>
                          <span>Devise: {report.currency}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {associatedFile && (
                        <Badge variant="outline" className="text-xs">
                          {associatedFile.analysis_status === 'completed' ? 'Analysé' : 'En cours'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleViewAnalysis(report.id, report.report_name)}
                    >
                      <Eye className="h-3 w-3" />
                      Voir l'analyse complète
                    </Button>
                    
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-3 w-3" />
                      Télécharger PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog pour afficher l'analyse complète */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analyse TVA Complète
              {selectedReport?.fileName && (
                <Badge variant="outline" className="ml-2">
                  {selectedReport.fileName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="mt-6">
              <NewVATBreakdown 
                report={selectedReport} 
                fileName={selectedReport.fileName}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientVATAnalysis;