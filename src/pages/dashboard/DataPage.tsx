import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Upload, 
  Download, 
  Archive,
  HardDrive,
  Cloud,
  FileSpreadsheet,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useUserFiles } from '@/hooks/useUserFiles';
import { useVATReports } from '@/hooks/useVATReports';
import { useToast } from '@/hooks/use-toast';

const DataPage = () => {
  const { files } = useUserFiles();
  const { reports } = useVATReports();
  const { toast } = useToast();
  const [autoBackup, setAutoBackup] = useState(true);
  const [retentionDays, setRetentionDays] = useState('90');
  const [compressionEnabled, setCompressionEnabled] = useState(true);

  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);
  const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
  const usagePercentage = (totalSize / storageLimit) * 100;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBulkExport = () => {
    toast({
      title: "Export en cours",
      description: "Préparation de l'archive avec tous vos données...",
    });
    // Implementation would go here
  };

  const handleDataCleanup = () => {
    toast({
      title: "Nettoyage programmé",
      description: "Les fichiers anciens seront supprimés selon vos paramètres.",
    });
  };

  const handleBackupSettings = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Vos préférences de sauvegarde ont été mises à jour.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Données</h2>
          <p className="text-muted-foreground">
            Gérez vos données, imports et exports en masse
          </p>
        </div>
        <Button onClick={handleBulkExport}>
          <Download className="mr-2 h-4 w-4" />
          Export global
        </Button>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Vue d'ensemble du stockage
          </CardTitle>
          <CardDescription>
            Utilisation de votre espace de stockage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Espace utilisé</span>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(totalSize)} / {formatFileSize(storageLimit)}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    usagePercentage > 80 ? 'bg-red-500' : 
                    usagePercentage > 60 ? 'bg-yellow-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {usagePercentage.toFixed(1)}% utilisé
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{files.length}</div>
                <div className="text-xs text-muted-foreground">Fichiers CSV</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(totalSize)}
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Archive className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{reports.length}</div>
                <div className="text-xs text-muted-foreground">Rapports TVA</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Analyse sauvegardée
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Cloud className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">
                  {Math.max(0, Math.round((storageLimit - totalSize) / (1024 * 1024)))}
                </div>
                <div className="text-xs text-muted-foreground">MB disponibles</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Espace libre
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Tools */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import en masse
            </CardTitle>
            <CardDescription>
              Importez plusieurs fichiers CSV simultanément
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Glissez-déposez plusieurs fichiers ici
              </p>
              <Button size="sm">
                Sélectionner des fichiers
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Formats supportés : CSV uniquement • Max 50MB par fichier
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export global
            </CardTitle>
            <CardDescription>
              Exportez toutes vos données et rapports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="export-files" defaultChecked />
                <Label htmlFor="export-files" className="text-sm">
                  Fichiers CSV originaux
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="export-reports" defaultChecked />
                <Label htmlFor="export-reports" className="text-sm">
                  Rapports d'analyse
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="export-metadata" defaultChecked />
                <Label htmlFor="export-metadata" className="text-sm">
                  Métadonnées et historique
                </Label>
              </div>
            </div>
            <Button onClick={handleBulkExport} className="w-full">
              Créer l'archive
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archivage
            </CardTitle>
            <CardDescription>
              Archivez vos anciennes données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="retention" className="text-sm">
                  Conserver les fichiers (jours)
                </Label>
                <Input
                  id="retention"
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="compression"
                  checked={compressionEnabled}
                  onCheckedChange={setCompressionEnabled}
                />
                <Label htmlFor="compression" className="text-sm">
                  Compression automatique
                </Label>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Configurer l'archivage
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup & Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sauvegarde et synchronisation
          </CardTitle>
          <CardDescription>
            Configurez vos préférences de sauvegarde automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sauvegarde automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Sauvegarde quotidienne de vos données
                  </p>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Synchronisation cloud</Label>
                  <p className="text-sm text-muted-foreground">
                    Synchroniser avec le stockage cloud
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications de sauvegarde</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications de confirmation
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-time" className="text-sm">
                  Heure de sauvegarde
                </Label>
                <Input
                  id="backup-time"
                  type="time"
                  defaultValue="02:00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="backup-location" className="text-sm">
                  Dossier de sauvegarde
                </Label>
                <Input
                  id="backup-location"
                  placeholder="/backups/tva-analysis"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="backup-notes" className="text-sm">
                  Notes de configuration
                </Label>
                <Textarea
                  id="backup-notes"
                  placeholder="Ajoutez vos notes sur la configuration de sauvegarde..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button onClick={handleBackupSettings}>
              Sauvegarder les paramètres
            </Button>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Lancer sauvegarde maintenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Outils de maintenance</CardTitle>
          <CardDescription>
            Utilitaires pour optimiser et nettoyer vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Nettoyage</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supprimer les fichiers temporaires
                </p>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Archive className="h-4 w-4" />
                  <span className="font-medium">Compression</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compresser les anciens fichiers
                </p>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Optimisation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optimiser les performances
                </p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={handleDataCleanup}
            >
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">Purge</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supprimer définitivement
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPage;