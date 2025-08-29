import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Settings, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useClientAccounts } from '@/hooks/useClientAccounts';
import { useOrganization } from '@/hooks/useOrganization';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CreateClientDialog from '@/components/CreateClientDialog';

const FirmClients = () => {
  const { clientAccounts, loading } = useClientAccounts();
  const { canManageClients } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredClients = clientAccounts.filter(client =>
    client.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.vat_number && client.vat_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Gestion des Clients</h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos clients Amazon et leurs déclarations TVA
          </p>
        </div>
        
        {canManageClients() && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau Client
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Rechercher par nom ou numéro TVA..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientAccounts.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients OSS</CardTitle>
            <Settings className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientAccounts.filter(c => c.oss_opt_in).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Dépôts attendus
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-destructive bg-gradient-to-r from-destructive/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Actions requises
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{client.display_name}</CardTitle>
                  <CardDescription>
                    {client.vat_number && (
                      <span className="font-mono text-xs">TVA: {client.vat_number}</span>
                    )}
                    {client.country && (
                      <span className="block text-xs mt-1">{client.country}</span>
                    )}
                  </CardDescription>
                </div>
                {client.oss_opt_in && (
                  <Badge variant="secondary" className="text-xs">
                    OSS
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Créé le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </div>
                
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link to={`/dashboard/firm/clients/${client.id}`}>
                      <Eye className="h-3 w-3" />
                      Voir
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-3 w-3" />
                    Inviter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Aucun client trouvé</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm 
                    ? "Aucun client ne correspond à votre recherche"
                    : "Commencez par créer votre premier client"
                  }
                </p>
              </div>
              {canManageClients() && !searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateClientDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};

export default FirmClients;