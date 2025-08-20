import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  BarChart, 
  Clock,
  MousePointer,
  FileText,
  Users,
  Eye,
  Timer
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useUserFiles } from '@/hooks/useUserFiles';
import { useVATReports } from '@/hooks/useVATReports';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const ActivityPage = () => {
  const { stats, formatLastActivity } = useDashboardStats();
  const { files } = useUserFiles();
  const { reports } = useVATReports();
  const [timeRange, setTimeRange] = useState<string>('month');

  const activityData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month' = 'day';

    switch (timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        groupBy = 'day';
        break;
      case 'month':
        startDate = subMonths(now, 1);
        groupBy = 'day';
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        groupBy = 'week';
        break;
      case 'year':
        startDate = subMonths(now, 12);
        groupBy = 'month';
        break;
      default:
        startDate = subMonths(now, 1);
        groupBy = 'day';
    }

    const activityMap = new Map<string, { uploads: number; analyses: number; date: Date }>();

    // Process file uploads
    files.forEach(file => {
      const fileDate = new Date(file.upload_date);
      if (fileDate >= startDate) {
        let key: string;
        if (groupBy === 'day') {
          key = format(fileDate, 'yyyy-MM-dd');
        } else if (groupBy === 'week') {
          key = format(fileDate, "'S'w yyyy");
        } else {
          key = format(fileDate, 'MMM yyyy');
        }

        if (!activityMap.has(key)) {
          activityMap.set(key, { uploads: 0, analyses: 0, date: fileDate });
        }
        activityMap.get(key)!.uploads++;
      }
    });

    // Process reports
    reports.forEach(report => {
      const reportDate = new Date(report.analysis_date);
      if (reportDate >= startDate) {
        let key: string;
        if (groupBy === 'day') {
          key = format(reportDate, 'yyyy-MM-dd');
        } else if (groupBy === 'week') {
          key = format(reportDate, "'S'w yyyy");
        } else {
          key = format(reportDate, 'MMM yyyy');
        }

        if (!activityMap.has(key)) {
          activityMap.set(key, { uploads: 0, analyses: 0, date: reportDate });
        }
        activityMap.get(key)!.analyses++;
      }
    });

    return Array.from(activityMap.entries())
      .map(([key, data]) => ({
        period: key,
        uploads: data.uploads,
        analyses: data.analyses,
        total: data.uploads + data.analyses,
        date: data.date
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [files, reports, timeRange]);

  const recentActivity = useMemo(() => {
    const allActivity = [
      ...files.map(file => ({
        type: 'upload' as const,
        name: file.file_name,
        date: new Date(file.upload_date),
        status: file.analysis_status,
        size: file.file_size
      })),
      ...reports.map(report => ({
        type: 'analysis' as const,
        name: report.report_name,
        date: new Date(report.created_at),
        amount: report.total_amount
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return allActivity.slice(0, 10);
  }, [files, reports]);

  const usageStats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);
    const completedFiles = files.filter(f => f.analysis_status === 'completed').length;
    const errorFiles = files.filter(f => f.analysis_status === 'error').length;
    const avgProcessingTime = '2.3'; // Placeholder - would need actual timing data

    return {
      totalSize,
      completedFiles,
      errorFiles,
      successRate: files.length > 0 ? ((completedFiles / files.length) * 100) : 0,
      avgProcessingTime
    };
  }, [files]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activité</h2>
          <p className="text-muted-foreground">
            Suivez vos statistiques d'utilisation et votre activité
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
            <SelectItem value="quarter">3 derniers mois</SelectItem>
            <SelectItem value="year">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichiers traités
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.filesProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Total depuis l'inscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de réussite
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {usageStats.completedFiles} réussies sur {files.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Données traitées
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(usageStats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Volume total traité
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Temps moyen
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.avgProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">
              Par analyse
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de l'activité</CardTitle>
          <CardDescription>
            Uploads de fichiers et analyses générées dans le temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  labelFormatter={(label) => `Période: ${label}`}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'uploads' ? 'Fichiers uploadés' : 'Analyses générées'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  stackId="1"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorUploads)"
                />
                <Area
                  type="monotone"
                  dataKey="analyses"
                  stackId="1"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorAnalyses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activité récente
            </CardTitle>
            <CardDescription>
              Vos 10 dernières actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      {activity.type === 'upload' ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <BarChart className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {activity.type === 'upload' ? 'Fichier importé' : 'Rapport généré'}
                        </span>
                        {activity.type === 'upload' && 'size' in activity && (
                          <span>• {formatFileSize(activity.size)}</span>
                        )}
                        {activity.type === 'analysis' && 'amount' in activity && (
                          <span>• €{activity.amount.toLocaleString('fr-FR')}</span>
                        )}
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques d'utilisation</CardTitle>
            <CardDescription>
              Performance et utilisation de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analyses réussies</span>
                <span>{usageStats.successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${usageStats.successRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{usageStats.completedFiles}</div>
                <div className="text-xs text-muted-foreground">Réussies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{usageStats.errorFiles}</div>
                <div className="text-xs text-muted-foreground">Échecs</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold">{formatLastActivity(stats.lastActivity)}</div>
                <div className="text-xs text-muted-foreground">Dernière activité</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityPage;