import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UploadSection from '@/components/UploadSection';

const AnalysisPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analyse TVA</h2>
        <p className="text-muted-foreground">
          Importez et analysez vos fichiers CSV Amazon pour générer vos déclarations TVA
        </p>
      </div>

      {/* Analysis Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Outil d'analyse TVA</CardTitle>
          <CardDescription>
            Importez votre rapport TVA Amazon et obtenez une analyse détaillée conforme aux réglementations européennes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadSection />
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisPage;