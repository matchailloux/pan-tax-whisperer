import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter,
  Search,
  Eye,
  Trash2,
  MoreVertical,
  TrendingUp,
  FileText,
  Euro
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useVATReports } from '@/hooks/useVATReports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReportsPage = () => {
  const { reports, loading, deleteReport, getReportsStats } = useVATReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');
  const stats = getReportsStats();

  const filteredReports = useMemo(() => {
    let filtered = reports.filter(report =>
      report.report_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (periodFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.analysis_date);
        
        switch (periodFilter) {
          case 'today':
            return reportDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return reportDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return reportDate >= monthAgo;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            return reportDate >= quarterAgo;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => 
      new Date(b.analysis_date).getTime() - new Date(a.analysis_date).getTime()
    );
  }, [reports, searchTerm, periodFilter]);

  const chartData = useMemo(() => {
    const monthlyData = reports.reduce((acc, report) => {
      const month = format(new Date(report.analysis_date), 'MMM yyyy', { locale: fr });
      if (!acc[month]) {
        acc[month] = { month, amount: 0, count: 0 };
      }
      acc[month].amount += report.total_amount;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { month: string; amount: number; count: number }>);

    return Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [reports]);

  const countryData = useMemo(() => {
    const countryMap = new Map<string, number>();
    
    reports.forEach(report => {
      if (report.report_data?.breakdown) {
        report.report_data.breakdown.forEach((item: any) => {
          const country = item.country || 'Inconnu';
          const total =
            typeof item.total === 'number'
              ? item.total
              : ((item.OSS_total ?? 0) + (item.B2C_total ?? 0) + (item.B2B_total ?? 0) + (item.Intracom_total ?? 0) + (item.Suisse_total ?? 0)) ||
                ((item.oss ?? 0) + ((item.domesticB2C ?? item.localB2C) ?? 0) + ((item.domesticB2B ?? item.localB2B) ?? 0) + (item.intracommunautaire ?? 0) + (item.suisse ?? 0) + (item.residuel ?? 0));
          countryMap.set(country, (countryMap.get(country) || 0) + (isNaN(total) ? 0 : total));
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([country, amount]) => ({ country, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [reports]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = (report: any) => {
    console.log('Export Excel pour:', report.report_name);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Rapports TVA</h2>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rapports TVA</h2>
          <p className="text-muted-foreground">
            Consultez et analysez vos rapports d'analyse TVA
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Liste
          </Button>
          <Button 
            variant={viewMode === 'charts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('charts')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Graphiques
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total rapports
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Depuis le début
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ce mois
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthReports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reportsGrowth >= 0 ? '+' : ''}{stats.reportsGrowth.toFixed(1)}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA analysée
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.thisMonthTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dernière analyse
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastReport ? format(new Date(stats.lastReport.analysis_date), 'dd/MM', { locale: fr }) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastReport ? stats.lastReport.report_name.slice(0, 20) + '...' : 'Aucune analyse'}
            </p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'charts' ? (
        /* Charts View */
        <div className="space-y-6">
          {/* Evolution Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des analyses TVA</CardTitle>
              <CardDescription>Montants analysés par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatAmount(value)} />
                    <Tooltip 
                      formatter={(value: number) => [formatAmount(value), 'Montant TVA']}
                      labelFormatter={(label) => `Mois: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Nombre d'analyses par mois</CardTitle>
                <CardDescription>Évolution du volume d'analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [value, 'Analyses']}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Country Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 pays par montant TVA</CardTitle>
                <CardDescription>Répartition géographique</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {countryData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatAmount(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un rapport..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les périodes</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des rapports</CardTitle>
              <CardDescription>
                {filteredReports.length} rapport{filteredReports.length !== 1 ? 's' : ''} 
                {filteredReports.length !== reports.length && ` sur ${reports.length}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{report.report_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{formatAmount(report.total_amount)}</span>
                            <span>
                              {format(new Date(report.analysis_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </span>
                            {report.report_data?.breakdown && (
                              <span>{report.report_data.breakdown.length} pays</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="default">Terminé</Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le rapport
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToExcel(report)}>
                              <Download className="mr-2 h-4 w-4" />
                              Exporter Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    {reports.length === 0 ? 'Aucun rapport disponible' : 'Aucun rapport trouvé'}
                  </h3>
                  <p className="text-sm mb-4">
                    {reports.length === 0 
                      ? 'Vos rapports d\'analyse TVA apparaîtront ici une fois générés'
                      : 'Aucun rapport ne correspond aux filtres sélectionnés'
                    }
                  </p>
                  {reports.length === 0 && (
                    <Button asChild>
                      <a href="/dashboard/analysis">
                        Créer votre premier rapport
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;