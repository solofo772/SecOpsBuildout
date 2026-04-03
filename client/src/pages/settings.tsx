import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Github, Shield, CheckCircle, XCircle, Loader2, Search, AlertTriangle, Package } from "lucide-react";

export function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [packageJsonContent, setPackageJsonContent] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);

  const { data: config } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/github/config", { owner, repo, token });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/security"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/repo"] });
      setToken("");
      toast({
        title: "Configuration sauvegardée",
        description: `Connecté au dépôt ${owner}/${repo} avec succès.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur de configuration",
        description: err.message || "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/github/config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/security"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/repo"] });
      toast({ title: "Déconnecté de GitHub" });
    },
  });

  const auditMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/github/npm-audit", { packageJson: packageJsonContent });
      return res.json();
    },
    onSuccess: (data: any) => {
      setAuditResult(data);
    },
    onError: (err: any) => {
      toast({
        title: "Erreur d'analyse",
        description: err.message || "Impossible d'analyser le package.json.",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Connexion GitHub */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Github className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connexion GitHub</h2>
              <p className="text-sm text-gray-500">Connecte ta plateforme à ton dépôt GitHub pour des données réelles</p>
            </div>
          </div>

          {config?.configured ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connecté à GitHub</p>
                  <p className="text-sm text-green-600">
                    Dépôt : <strong>{config.owner}/{config.repo}</strong>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Déconnecter GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner">Propriétaire du dépôt</Label>
                  <Input
                    id="owner"
                    placeholder="ex: mon-username"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="repo">Nom du dépôt</Label>
                  <Input
                    id="repo"
                    placeholder="ex: mon-app-js"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="token">Token d'accès GitHub (Personal Access Token)</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Crée un token sur{" "}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,security_events"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  avec les droits <strong>repo</strong> et <strong>security_events</strong>.
                </p>
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !owner || !repo || !token}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Github className="mr-2 h-4 w-4" />
                )}
                {saveMutation.isPending ? "Connexion..." : "Connecter GitHub"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyse npm audit */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Analyse de Sécurité — package.json</h2>
              <p className="text-sm text-gray-500">
                Colle le contenu de ton <code className="bg-gray-100 px-1 rounded">package.json</code> pour détecter les dépendances vulnérables
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="packageJson">Contenu du package.json</Label>
              <Textarea
                id="packageJson"
                placeholder='{"name": "mon-app", "dependencies": {"express": "^4.18.0", ...}}'
                value={packageJsonContent}
                onChange={(e) => setPackageJsonContent(e.target.value)}
                className="mt-1 font-mono text-sm h-40"
              />
            </div>

            <Button
              onClick={() => auditMutation.mutate()}
              disabled={auditMutation.isPending || !packageJsonContent.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {auditMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {auditMutation.isPending ? "Analyse en cours..." : "Analyser les vulnérabilités"}
            </Button>

            {auditResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">
                      {auditResult.totalPackages ?? 0} packages analysés
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (auditResult.vulnerabilities?.length ?? 0) === 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {(auditResult.vulnerabilities?.length ?? 0) === 0
                      ? "Aucune vulnérabilité"
                      : `${auditResult.vulnerabilities.length} vulnérabilité(s) trouvée(s)`}
                  </span>
                </div>

                {auditResult.error && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    {auditResult.error}
                  </div>
                )}

                {auditResult.vulnerabilities?.map((vuln: any, i: number) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${getSeverityColor(vuln.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {vuln.package} <span className="font-normal text-sm">({vuln.version})</span>
                        </p>
                        <p className="text-sm mt-1">{vuln.summary}</p>
                        <p className="text-xs mt-1 opacity-70">{vuln.id}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-white/60">
                          {vuln.severity}
                        </span>
                        {vuln.url && (
                          <a
                            href={vuln.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline"
                          >
                            Détails
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
