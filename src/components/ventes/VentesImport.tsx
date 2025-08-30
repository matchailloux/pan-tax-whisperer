import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function VentesImport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://lxulrlyzieqvxrsgfxoj.supabase.co/functions/v1/import-activity-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.message || JSON.stringify(result));
      }

      toast({
        title: "Import réussi",
        description: `${result.inserted || 0} lignes importées, ${result.skipped || 0} ignorées`,
      });

      // Invalidate all sales queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['ventes_kpis'] });
      queryClient.invalidateQueries({ queryKey: ['ventes_country_totals'] });
      queryClient.invalidateQueries({ queryKey: ['ventes_country_vat_rate_totals'] });
      queryClient.invalidateQueries({ queryKey: ['ventes_timeseries'] });
      queryClient.invalidateQueries({ queryKey: ['ventes_breakdown_type'] });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: error.message || 'Une erreur est survenue lors de l\'import',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importer un fichier CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Importez vos données de transactions Amazon pour analyser vos ventes
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            disabled={isUploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Import...' : 'Choisir un fichier'}
          </Button>
        </div>

        {isUploading && (
          <div className="text-sm text-muted-foreground">
            Traitement en cours...
          </div>
        )}
      </CardContent>
    </Card>
  );
}