import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DocumentsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Gérez vos fichiers CSV importés et leur historique d'analyse
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Nouveau fichier
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un fichier..."
                  className="pl-9"
                />
              </div>
            </div>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Filtrer par date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Fichiers récents</CardTitle>
          <CardDescription>
            Historique de vos imports et analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Aucun fichier importé</h3>
            <p className="text-sm mb-4">
              Commencez par importer votre premier fichier CSV Amazon
            </p>
            <Button>
              Importer un fichier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsPage;