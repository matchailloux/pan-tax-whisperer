import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Upload, Download, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DataPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Données</h2>
        <p className="text-muted-foreground">
          Gérez vos données, imports et exports en masse
        </p>
      </div>

      {/* Data Management Cards */}
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
          <CardContent>
            <Button className="w-full">
              Importer des fichiers
            </Button>
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
          <CardContent>
            <Button variant="outline" className="w-full">
              Exporter tout
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
          <CardContent>
            <Button variant="outline" className="w-full">
              Gérer les archives
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble du stockage</CardTitle>
          <CardDescription>
            Utilisation de votre espace de stockage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fichiers CSV</span>
              <span className="text-sm text-muted-foreground">0 fichiers</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rapports générés</span>
              <span className="text-sm text-muted-foreground">0 rapports</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Espace utilisé</span>
              <span className="text-sm text-muted-foreground">0 MB / 1 GB</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Outils de données</CardTitle>
          <CardDescription>
            Utilitaires pour gérer vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="justify-start">
              <Database className="mr-2 h-4 w-4" />
              Nettoyage des données
            </Button>
            <Button variant="outline" className="justify-start">
              <Archive className="mr-2 h-4 w-4" />
              Sauvegarde automatique
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPage;