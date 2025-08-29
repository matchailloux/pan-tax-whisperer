import React, { useState } from 'react';
import { BarChart3, Calendar, FileText, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClientVATReports } from '@/hooks/useClientVATReports';
import { useVATAnalysis } from '@/hooks/useVATAnalysis';
import { NewVATBreakdown } from '@/components/NewVATBreakdown';
import { DetailedVATReport } from '@/utils/newVATRulesEngine';

interface LatestAnalysisCardProps {
  clientId: string;
  clientName: string;
}

const LatestAnalysisCard: React.FC<LatestAnalysisCardProps> = ({ clientId, clientName }) => {
  const { reports, loading } = useClientVATReports(clientId);
  const { getStoredReport } = useVATAnalysis();
  const [selectedReport, setSelectedReport] = useState<(DetailedVATReport & { fileName?: string }) | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const latestReport = reports.length > 0 ? reports[0] : null;

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dernière Analyse TVA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestReport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dernière Analyse TVA
          </CardTitle>
          <CardDescription>
            Résultats de la dernière analyse pour {clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune analyse disponible</h3>
            <p className="text-muted-foreground">
              Les analyses apparaîtront ici après l'upload et le traitement des fichiers du client.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dernière Analyse TVA
          </CardTitle>
          <CardDescription>
            Résultats de la dernière analyse pour {clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{latestReport.report_name}</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(latestReport.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span>Devise: {latestReport.currency}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    {formatAmount(latestReport.total_amount)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Montant total
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={() => handleViewAnalysis(latestReport.id, latestReport.report_name)}
                className="w-full gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir l'analyse complète
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
};

export default LatestAnalysisCard;