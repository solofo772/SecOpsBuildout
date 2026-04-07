import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch (err: any) {
      toast({
        title: "Échec de la connexion",
        description: err?.message || "Identifiant ou mot de passe incorrect.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DevSecOps Hub</h1>
            <p className="text-gray-400 text-sm">Plateforme de monitoring sécurisé</p>
          </div>
        </div>

        <Card className="border-gray-700 bg-gray-800/80 backdrop-blur shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-white mb-1">Connexion</h2>
            <p className="text-gray-400 text-sm mb-6">Accède à ton tableau de bord DevSecOps</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="username" className="text-gray-300">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: jean.dupont"
                  autoComplete="username"
                  required
                  className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-primary"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn || !username || !password}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5"
              >
                {isLoggingIn ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion...</>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm">
                Pas encore de compte ?{" "}
                <button
                  onClick={onSwitchToRegister}
                  className="text-primary hover:text-primary/80 font-medium underline"
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
