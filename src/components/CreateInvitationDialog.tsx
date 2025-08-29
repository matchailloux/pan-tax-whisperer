import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInvitations } from '@/hooks/useInvitations';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  period: z.string().regex(/^[0-9]{4}-[0-9]{2}$/, {
    message: "Format requis: YYYY-MM (ex: 2024-01)",
  }),
  max_uses: z.number().min(1).max(10).default(1),
  ttl_hours: z.number().min(1).max(720).default(168), // 1 week default, max 1 month
});

interface CreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  clientName?: string;
}

const CreateInvitationDialog: React.FC<CreateInvitationDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  clientName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const { createInvitation } = useInvitations();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
      max_uses: 1,
      ttl_hours: 168, // 7 days
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      const token = await createInvitation({
        client_account_id: clientId,
        period: values.period,
        max_uses: values.max_uses,
        ttl_hours: values.ttl_hours,
      });

      if (token) {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/upload?token=${token}`;
        setInvitationLink(link);
        
        // Copy to clipboard
        navigator.clipboard.writeText(link);
        toast({
          title: "Lien créé et copié",
          description: "Le lien d'invitation a été copié dans le presse-papier",
        });
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setInvitationLink(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle invitation de dépôt</DialogTitle>
          <DialogDescription>
            Créez un lien sécurisé pour que {clientName} puisse déposer ses fichiers TVA.
          </DialogDescription>
        </DialogHeader>

        {!invitationLink ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Période *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="YYYY-MM" 
                        {...field} 
                        pattern="[0-9]{4}-[0-9]{2}"
                      />
                    </FormControl>
                    <FormDescription>
                      Période de déclaration au format YYYY-MM (ex: 2024-01)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_uses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utilisations maximales</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre de fois que le lien peut être utilisé (1-10)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ttl_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée de validité (heures)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={720}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Durée de validité du lien en heures (max 30 jours = 720h)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer l\'invitation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Lien d'invitation créé :</h4>
              <div className="p-2 bg-background rounded border font-mono text-sm break-all">
                {invitationLink}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Le lien a été copié automatiquement dans votre presse-papier.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions :</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Envoyez ce lien à votre client par email</li>
                <li>• Le client pourra déposer son fichier TVA via ce lien</li>
                <li>• Vous recevrez une notification lors du dépôt</li>
                <li>• L'analyse commencera automatiquement</li>
              </ul>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Terminer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvitationDialog;