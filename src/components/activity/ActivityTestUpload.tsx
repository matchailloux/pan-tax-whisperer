import { Button } from '@/components/ui/button';
import { useActivityIngestion } from '@/hooks/useActivityIngestion';
import { useRef, useState } from 'react';

export default function ActivityTestUpload() {
  const { ingestFromCSV } = useActivityIngestion();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTestUpload = async () => {
    setIsLoading(true);
    
    // Données de test CSV simplifiées
    const testCSV = `TRANSACTION_DEPART_DATE,TAXABLE_JURISDICTION,TRANSACTION_CURRENCY_CODE,TRANSACTION_TYPE,TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL,TOTAL_ACTIVITY_VALUE_VAT_AMT,TOTAL_ACTIVITY_VALUE_AMT_VAT_INCL
2025-08-01T10:00:00Z,FR,EUR,SALES,100.00,20.00,120.00
2025-08-02T11:00:00Z,DE,EUR,SALES,50.00,9.50,59.50
2025-08-03T12:00:00Z,ES,EUR,REFUND,-30.00,-6.30,-36.30
2025-08-04T13:00:00Z,IT,EUR,SALES,75.00,16.50,91.50
2025-08-05T14:00:00Z,FR,EUR,SALES,200.00,40.00,240.00`;

    try {
      await ingestFromCSV(testCSV, 'test-data.csv');
    } catch (error) {
      console.error('Test upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const text = await file.text();
      await ingestFromCSV(text, file.name);
      // Reset input to allow re-uploading the same file if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Full CSV upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handleTestUpload} 
          disabled={isLoading || isUploading}
          variant="outline"
        >
          {isLoading ? 'Test en cours...' : 'Tester ingestion données'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button onClick={handleSelectFile} disabled={isUploading || isLoading}>
          {isUploading ? 'Import en cours...' : 'Importer un CSV complet'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Utilisez « Importer un CSV complet » pour prendre en compte toutes vos lignes. Le bouton de test n’ajoute que 5 lignes d’exemple.
      </p>
    </div>
  );
}