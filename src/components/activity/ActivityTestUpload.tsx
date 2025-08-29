import { Button } from '@/components/ui/button';
import { useActivityIngestion } from '@/hooks/useActivityIngestion';
import { useState } from 'react';

export default function ActivityTestUpload() {
  const { ingestFromCSV } = useActivityIngestion();
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="mb-4">
      <Button 
        onClick={handleTestUpload} 
        disabled={isLoading}
        variant="outline"
      >
        {isLoading ? 'Test en cours...' : 'Tester ingestion données'}
      </Button>
      <p className="text-xs text-muted-foreground mt-1">
        Ajoute des données de test pour vérifier le module Activité
      </p>
    </div>
  );
}