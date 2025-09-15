import React from 'react';
import UploadSection from '@/components/UploadSection';

const AnalysisPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      {/* Modern Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Montants HT par régime
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Analysez vos rapports TVA Amazon en quelques secondes avec notre moteur d'analyse intelligent
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <UploadSection />
      </div>
    </div>
  );
};

export default AnalysisPage;