import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWxybHl6aWVxdnhyc2dmeG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODUxMjUsImV4cCI6MjA3MTI2MTEyNX0.pGakaRoFTQJIzwD671BgQPS2xTL3qr2tYHbfljAUztc";
const normTok = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const detectDelimiter = (sample: string) => {
  const counts = {
    comma: (sample.match(/,/g) || []).length,
    semicolon: (sample.match(/;/g) || []).length,
    tab: (sample.match(/\t/g) || []).length,
  };
  if (counts.semicolon > counts.comma && counts.semicolon >= counts.tab) return ";";
  if (counts.tab >= counts.comma && counts.tab >= counts.semicolon) return "\t";
  return ",";
};
const resolveHeader = (headers: string[], candidates: readonly string[]) => {
  const map = new Map(headers.map((h) => [normTok(h), h]));
  for (const c of candidates) {
    const k = normTok(c);
    if (map.has(k)) return map.get(k)!;
  }
  for (const h of headers) {
    const t = normTok(h);
    if (candidates.some((c) => t.includes(normTok(c)))) return h;
  }
  return null;
};
const REQUIRED = {
  TAXABLE_JURISDICTION: [
    "TAXABLE_JURISDICTION",
    "taxable_jurisdiction",
    "juridiction",
    "jurisdiction",
    "country",
    "pays",
    "tax_jurisdiction",
    "destination_country",
    "ship_country",
  ],
  TRANSACTION_DEPART_DATE: [
    "TRANSACTION_DEPART_DATE",
    "transaction_depart_date",
    "date",
    "transaction_date",
    "order_date",
    "purchase_date",
    "event_date",
    "date_operation",
    "activity_period",
  ],
  TRANSACTION_CURRENCY_CODE: [
    "TRANSACTION_CURRENCY_CODE",
    "currency",
    "devise",
    "curr",
    "currency_code",
  ],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: [
    "TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL",
    "ttc",
    "gross",
    "amount_gross",
    "total_gross",
    "price_gross",
    "montant_ttc",
  ],
  TOTAL_ACTIVITY_VALUE_VAT_AMT: [
    "TOTAL_ACTIVITY_VALUE_VAT_AMT",
    "vat",
    "tax",
    "amount_vat",
    "vat_amount",
    "tax_amount",
    "montant_tva",
    "tva",
  ],
  TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: [
    "TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL",
    "ht",
    "net",
    "amount_net",
    "price_net",
    "montant_ht",
  ],
  TRANSACTION_TYPE: [
    "TRANSACTION_TYPE",
    "type",
    "operation",
    "event_type",
    "order_type",
    "sales_or_refund",
  ],
} as const;

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

      // Client-side preflight: strip BOM and validate essential columns
      const originalText = await file.text();
      const cleanedText = originalText.replace(/^\uFEFF/, '');
      const firstLine = cleanedText.split(/\r?\n/)[0] || '';
      const delimiter = detectDelimiter(firstLine);
      const headers = firstLine.split(delimiter).map(h => h?.trim() || '');

      const headerMap = {
        TAXABLE_JURISDICTION: resolveHeader(headers, REQUIRED.TAXABLE_JURISDICTION),
        TRANSACTION_DEPART_DATE: resolveHeader(headers, REQUIRED.TRANSACTION_DEPART_DATE),
        TRANSACTION_CURRENCY_CODE: resolveHeader(headers, REQUIRED.TRANSACTION_CURRENCY_CODE),
        TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL: resolveHeader(headers, REQUIRED.TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL),
        TOTAL_ACTIVITY_VALUE_VAT_AMT: resolveHeader(headers, REQUIRED.TOTAL_ACTIVITY_VALUE_VAT_AMT),
        TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: resolveHeader(headers, REQUIRED.TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL),
        TRANSACTION_TYPE: resolveHeader(headers, REQUIRED.TRANSACTION_TYPE),
      } as const;

      if (!headerMap.TAXABLE_JURISDICTION || !headerMap.TRANSACTION_DEPART_DATE) {
        throw new Error('Colonnes manquantes: pays ou date introuvables');
      }

      // Prepare multipart with cleaned CSV to reduce server parsing issues
      const formData = new FormData();
      formData.append('file', new Blob([cleanedText], { type: 'text/csv' }), file.name);
      formData.append('upload_id', crypto.randomUUID());

      const response = await fetch('https://lxulrlyzieqvxrsgfxoj.supabase.co/functions/v1/import-ventes-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: formData,
      });

      const isAccepted = response.status === 202;
      const result = await response.json().catch(() => ({}));

      if (!response.ok && !isAccepted) {
        throw new Error(result?.message || 'Import échoué');
      }

      if (isAccepted) {
        toast({
          title: 'Import lancé',
          description: `Fichier reçu. Upload ${result.upload_id || ''}. Traitement en arrière-plan...`,
        });
      } else {
        toast({
          title: 'Import réussi',
          description: `${result.inserted || 0} lignes importées, ${result.skipped || 0} ignorées`,
        });
      }


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