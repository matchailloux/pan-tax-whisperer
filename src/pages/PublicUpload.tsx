import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp, Building, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useInvitations } from '@/hooks/useInvitations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SEOHead from '@/components/SEOHead';

const PublicUpload = () => {
  const [searchParams] = useSearchParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { validateInvitation, incrementInvitationUsage } = useInvitations();
  const token = searchParams.get('token');

  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setError('Token d\'invitation manquant');
        setLoading(false);
        return;
      }

      try {
        const invitationData = await validateInvitation(token);
        if (!invitationData) {
          setError('Invitation invalide ou expirée');
        } else {
          setInvitation(invitationData);
        }
      } catch (err) {
        console.error('Error validating invitation:', err);
        setError('Erreur lors de la validation de l\'invitation');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token, validateInvitation]);

  const handleFileUpload = async (file) => {
    if (!file || !invitation) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Here you would implement the actual file upload logic
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 3000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Increment invitation usage
      await incrementInvitationUsage(invitation.id);

      setUploadStatus('success');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <SEOHead 
          title="Erreur - Dépôt TVA | SellCount"
          description="Une erreur s'est produite lors de l'accès au lien de dépôt."
        />
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-semibold">Erreur d'accès</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`Dépôt TVA - ${invitation?.client_accounts?.display_name} | SellCount`}
        description="Déposez votre fichier de rapport TVA Amazon pour analyse automatique."
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
        {/* Header */}
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-6 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
              Dépôt de fichier TVA
            </h1>
            <p className="text-muted-foreground">
              Déposez votre rapport TVA Amazon pour analyse automatique
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Invitation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Détails de l'invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="text-lg font-medium">{invitation?.client_accounts?.display_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Période</label>
                  <p className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {invitation?.period}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Utilisations</label>
                  <p className="text-lg">
                    {invitation?.used_count} / {invitation?.max_uses}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expire le</label>
                  <p className="text-lg">
                    {new Date(invitation?.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              
              {invitation?.client_accounts?.vat_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Numéro TVA</label>
                  <p className="font-mono">{invitation.client_accounts.vat_number}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Status */}
          {uploadStatus === 'success' ? (
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                <strong>Fichier déposé avec succès !</strong>
                <br />
                Votre fichier a été reçu et l'analyse va commencer automatiquement. 
                Votre cabinet comptable sera notifié de la réception.
              </AlertDescription>
            </Alert>
          ) : uploadStatus === 'error' ? (
            <Alert className="border-destructive bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Erreur lors du dépôt</strong>
                <br />
                Une erreur s'est produite lors du téléchargement. Veuillez réessayer.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Upload Area */}
          {uploadStatus !== 'success' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Déposer votre fichier
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploadStatus === 'uploading' ? (
                  <div className="text-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg font-medium">Téléchargement en cours...</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Glissez-déposez votre fichier ici
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      ou cliquez pour sélectionner un fichier
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild className="mb-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Sélectionner un fichier
                      </label>
                    </Button>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Formats acceptés: CSV, Excel (.xlsx, .xls)</p>
                      <p>Taille maximale: 10 MB</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Téléchargez votre rapport TVA depuis Amazon Seller Central</li>
                <li>Assurez-vous que le fichier correspond à la période {invitation?.period}</li>
                <li>Déposez le fichier dans la zone ci-dessus</li>
                <li>L'analyse commencera automatiquement après le dépôt</li>
                <li>Votre cabinet comptable sera notifié de la réception</li>
              </ol>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important :</strong> Ce lien ne peut être utilisé que {invitation?.max_uses} fois 
                  et expire le {new Date(invitation?.expires_at).toLocaleDateString('fr-FR')}.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PublicUpload;