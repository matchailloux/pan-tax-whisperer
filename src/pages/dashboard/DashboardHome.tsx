import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Activity, Settings, Upload, Clock } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useVATReports } from '@/hooks/useVATReports';
import { useUserFiles } from '@/hooks/useUserFiles';
import { useOrganization } from '@/hooks/useOrganization';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { isFirmMode, loading: orgLoading } = useOrganization();
  const { stats, formatGrowth, formatAmount, formatLastActivity } = useDashboardStats();
  const { reports } = useVATReports();
  const { files } = useUserFiles();

  // Redirect FIRM users to their dedicated dashboard
  useEffect(() => {
    if (!orgLoading && isFirmMode()) {
      navigate('/dashboard/firm', { replace: true });
    }
  }, [isFirmMode, orgLoading, navigate]);

  const recentActivity = [
    ...files.slice(0, 3).map(file => ({
      type: 'file',
      name: file.file_name,
      date: new Date(file.upload_date),
      status: file.analysis_status
    })),
    ...reports.slice(0, 3).map(report => ({
      type: 'report',
      name: report.report_name,
      date: new Date(report.created_at),
      amount: report.total_amount
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">
          Gérez vos analyses TVA et suivez vos déclarations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        {/* Existing KPI Cards */}
        <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichiers traités
            </CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.filesProcessed}</div>
            <p className="text-xs text-muted-foreground">
              {formatGrowth(stats.filesGrowth)} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total TVA collectée
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalVATCollected)}</div>
            <p className="text-xs text-muted-foreground">
              {formatGrowth(stats.vatGrowth)} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rapports générés
            </CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsGenerated}</div>
            <p className="text-xs text-muted-foreground">
              {formatGrowth(stats.reportsGrowth)} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive bg-gradient-to-r from-destructive/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Analyses ce mois
            </CardTitle>
            <Settings className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analysesThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {formatGrowth(stats.analysesGrowth)} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        {/* Compliance KPI Cards */}
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA due ce mois
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€31,003</div>
            <p className="text-xs text-muted-foreground">
              Toutes juridictions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary bg-gradient-to-r from-secondary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Juridictions actives
            </CardTitle>
            <Activity className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              3 conformes, 1 alerte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Actions rapides
            </CardTitle>
            <CardDescription>
              Commencez une nouvelle analyse ou consultez vos données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              size="lg"
              asChild
            >
              <Link to="/dashboard/analysis">
                <Upload className="mr-2 h-4 w-4" />
                Nouvelle analyse TVA
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              asChild
            >
              <Link to="/dashboard/reports">
                <FileText className="mr-2 h-4 w-4" />
                Voir mes rapports
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activité récente
            </CardTitle>
            <CardDescription>
              Vos dernières analyses et actions
            </CardDescription>
          </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    {activity.type === 'file' ? (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'file' ? 'Fichier importé' : 'Rapport généré'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatLastActivity(activity.date)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune activité récente</p>
              <p className="text-sm mt-2">
                Commencez par importer votre premier fichier CSV
              </p>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <Card>
        <CardHeader>
          <CardTitle>Commencer</CardTitle>
          <CardDescription>
            Suivez ces étapes pour analyser vos données TVA Amazon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-semibold">
                1
              </div>
              <h4 className="font-medium mb-2">Téléchargez vos données</h4>
              <p className="text-sm text-muted-foreground">
                Exportez votre rapport TVA depuis Amazon Seller Central
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-semibold">
                2
              </div>
              <h4 className="font-medium mb-2">Analysez automatiquement</h4>
              <p className="text-sm text-muted-foreground">
                Notre moteur IA classe vos transactions selon les règles TVA
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-semibold">
                3
              </div>
              <h4 className="font-medium mb-2">Exportez vos rapports</h4>
              <p className="text-sm text-muted-foreground">
                Téléchargez vos déclarations TVA prêtes pour vos autorités fiscales
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;