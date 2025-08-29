import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, Building2, User } from 'lucide-react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [firmAddress, setFirmAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'accountant'>('individual');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Détecter le type d'inscription depuis l'URL
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'accountant') {
      setAccountType('accountant');
      setIsLogin(false); // Default to signup tab for accountants
    }
  }, [searchParams]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      // Redirection intelligente sera gérée par AuthContext
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, firstName, lastName, accountType, firmName, firmAddress);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setFirmName('');
    setFirmAddress('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>

        <Card className="border-border/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CardTitle className="text-2xl font-bold">
                TVA Analysis Pro
              </CardTitle>
              {accountType === 'accountant' && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Mode Cabinet
                </Badge>
              )}
            </div>
            <CardDescription>
              {accountType === 'accountant' 
                ? 'Accédez à votre espace cabinet comptable'
                : 'Accédez à votre tableau de bord d\'analyse TVA'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Account Type Selection */}
            {!isLogin && (
              <div className="mb-6">
                <Label className="text-base font-medium mb-4 block">Type de compte</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={accountType === 'individual' ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setAccountType('individual')}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Individuel</span>
                    <span className="text-xs text-muted-foreground">Pour vendeurs Amazon</span>
                  </Button>
                  <Button
                    type="button"
                    variant={accountType === 'accountant' ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => setAccountType('accountant')}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Cabinet</span>
                    <span className="text-xs text-muted-foreground">Pour comptables</span>
                  </Button>
                </div>
              </div>
            )}

            <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(value) => {
              setIsLogin(value === 'login');
              resetForm();
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                {accountType === 'accountant' && (
                  <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <Badge variant="secondary">Cabinet Comptable</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vous créez un compte pour votre cabinet comptable avec gestion multi-clients.
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {accountType === 'accountant' && (
                    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium text-sm text-foreground">Informations du cabinet</h4>
                      <div className="space-y-2">
                        <Label htmlFor="firmName">Nom du cabinet *</Label>
                        <Input
                          id="firmName"
                          type="text"
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          required={accountType === 'accountant'}
                          placeholder="Cabinet Dupont & Associés"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firmAddress">Adresse du cabinet</Label>
                        <Input
                          id="firmAddress"
                          type="text"
                          value={firmAddress}
                          onChange={(e) => setFirmAddress(e.target.value)}
                          placeholder="123 Rue de la Comptabilité, 75001 Paris"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="password-signup"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Création...' : 'Créer un compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;