import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Github, Shield, CheckCircle, XCircle, Loader2, Search, AlertTriangle, Package, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const BitbucketIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.043 2a.96.96 0 0 0-.957 1.115l4.338 26.53A1.31 1.31 0 0 0 6.71 30.73l9.29-2.21 9.29 2.21a1.31 1.31 0 0 0 1.286-1.085l4.338-26.53A.96.96 0 0 0 29.957 2zm17.74 19.5h-7.566L10.37 10.5h11.26z" fill="#2684FF"/>
    <path d="M28.13 10.5H21.63l-1.847 11h-7.566L7.09 28.03a1.306 1.306 0 0 0 .85.7l9.06 2.16 9.06-2.16a1.31 1.31 0 0 0 1-1.1z" fill="url(#bb-grad-s)"/>
    <defs>
      <linearGradient id="bb-grad-s" x1="30.5" y1="13.4" x2="18.7" y2="27.4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0052CC"/><stop offset="1" stopColor="#2684FF"/>
      </linearGradient>
    </defs>
  </svg>
);

const GitLabIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M190 350.606L254.765 153.779H125.235L190 350.606Z" fill="#E24329"/>
    <path d="M190 350.606L125.235 153.779H29.875L190 350.606Z" fill="#FC6D26"/>
    <path d="M29.875 153.779L7.975 221.496C6.073 227.203 8.131 233.472 12.995 237.017L190 350.606L29.875 153.779Z" fill="#FCA326"/>
    <path d="M29.875 153.779H125.235L85.885 29.434C83.88 23.256 75.334 23.256 73.33 29.434L29.875 153.779Z" fill="#E24329"/>
    <path d="M190 350.606L254.765 153.779H350.125L190 350.606Z" fill="#FC6D26"/>
    <path d="M350.125 153.779L372.025 221.496C373.927 227.203 371.869 233.472 367.005 237.017L190 350.606L350.125 153.779Z" fill="#FCA326"/>
    <path d="M350.125 153.779H254.765L294.115 29.434C296.12 23.256 304.666 23.256 306.67 29.434L350.125 153.779Z" fill="#E24329"/>
  </svg>
);

type Tab = "github" | "gitlab" | "bitbucket" | "audit";

export function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("github");

  // GitHub state
  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghToken, setGhToken] = useState("");

  // GitLab state
  const [glNamespace, setGlNamespace] = useState("");
  const [glRepo, setGlRepo] = useState("");
  const [glToken, setGlToken] = useState("");
  const [glInstanceUrl, setGlInstanceUrl] = useState("https://gitlab.com");

  // Bitbucket state
  const [bbWorkspace, setBbWorkspace] = useState("");
  const [bbRepo, setBbRepo] = useState("");
  const [bbUsername, setBbUsername] = useState("");
  const [bbAppPassword, setBbAppPassword] = useState("");

  // npm audit state
  const [packageJsonContent, setPackageJsonContent] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);

  const { data: githubConfig } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const { data: gitlabConfig } = useQuery<{ configured: boolean; namespace?: string; repo?: string; instanceUrl?: string }>({
    queryKey: ["/api/gitlab/config"],
  });

  const { data: bitbucketConfig } = useQuery<{ configured: boolean; workspace?: string; repo?: string }>({
    queryKey: ["/api/bitbucket/config"],
  });

  // === GitHub mutations ===
  const githubSaveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/github/config", { owner: ghOwner, repo: ghRepo, token: ghToken });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/security"] });
      setGhToken("");
      toast({ title: "GitHub connecté", description: `Dépôt ${ghOwner}/${ghRepo} configuré avec succès.` });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible de sauvegarder.", variant: "destructive" });
    },
  });

  const githubDisconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/github/config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/github/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/security"] });
      toast({ title: "Déconnecté de GitHub" });
    },
  });

  // === GitLab mutations ===
  const gitlabSaveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gitlab/config", {
        namespace: glNamespace,
        repo: glRepo,
        token: glToken,
        instanceUrl: glInstanceUrl || "https://gitlab.com",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gitlab/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gitlab/pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gitlab/security"] });
      setGlToken("");
      toast({ title: "GitLab connecté", description: `Projet ${glNamespace}/${glRepo} configuré avec succès.` });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible de sauvegarder.", variant: "destructive" });
    },
  });

  const gitlabDisconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/gitlab/config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gitlab/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gitlab/pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gitlab/security"] });
      toast({ title: "Déconnecté de GitLab" });
    },
  });

  // === Bitbucket mutations ===
  const bitbucketSaveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bitbucket/config", {
        workspace: bbWorkspace, repo: bbRepo, username: bbUsername, appPassword: bbAppPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bitbucket/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bitbucket/pipelines"] });
      setBbAppPassword("");
      toast({ title: "Bitbucket connecté", description: `Dépôt ${bbWorkspace}/${bbRepo} configuré avec succès.` });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible de sauvegarder.", variant: "destructive" });
    },
  });

  const bitbucketDisconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/bitbucket/config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bitbucket/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bitbucket/pipelines"] });
      toast({ title: "Déconnecté de Bitbucket" });
    },
  });

  // === npm audit mutation ===
  const auditMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/github/npm-audit", { packageJson: packageJsonContent });
      return res.json();
    },
    onSuccess: (data: any) => setAuditResult(data),
    onError: (err: any) => {
      toast({ title: "Erreur d'analyse", description: err.message || "Impossible d'analyser le package.json.", variant: "destructive" });
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: "github",
      label: "GitHub",
      icon: <Github className="h-4 w-4" />,
      badge: githubConfig?.configured ? <span className="w-2 h-2 bg-green-400 rounded-full" /> : undefined,
    },
    {
      id: "gitlab",
      label: "GitLab",
      icon: <GitLabIcon className="h-4 w-4" />,
      badge: gitlabConfig?.configured ? <span className="w-2 h-2 bg-green-400 rounded-full" /> : undefined,
    },
    {
      id: "bitbucket",
      label: "Bitbucket",
      icon: <BitbucketIcon className="h-4 w-4" />,
      badge: bitbucketConfig?.configured ? <span className="w-2 h-2 bg-green-400 rounded-full" /> : undefined,
    },
    {
      id: "audit",
      label: "Analyse npm",
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        ))}
      </div>

      {/* === Onglet GitHub === */}
      {activeTab === "github" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connexion GitHub</h2>
                <p className="text-sm text-gray-500">Connecte ta plateforme à ton dépôt GitHub</p>
              </div>
            </div>

            {githubConfig?.configured ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Connecté à GitHub</p>
                    <p className="text-sm text-green-600">Dépôt : <strong>{githubConfig.owner}/{githubConfig.repo}</strong></p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => githubDisconnectMutation.mutate()}
                  disabled={githubDisconnectMutation.isPending}
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
                    <Label htmlFor="gh-owner">Propriétaire du dépôt</Label>
                    <Input id="gh-owner" placeholder="ex: mon-username" value={ghOwner} onChange={(e) => setGhOwner(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gh-repo">Nom du dépôt</Label>
                    <Input id="gh-repo" placeholder="ex: mon-app-js" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gh-token">Personal Access Token</Label>
                  <Input id="gh-token" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value={ghToken} onChange={(e) => setGhToken(e.target.value)} className="mt-1" />
                  <p className="text-xs text-gray-500 mt-1">
                    Crée un token sur{" "}
                    <a href="https://github.com/settings/tokens/new?scopes=repo,security_events" target="_blank" rel="noreferrer" className="text-primary underline">
                      github.com/settings/tokens
                    </a>{" "}
                    avec les droits <strong>repo</strong> et <strong>security_events</strong>.
                  </p>
                </div>
                <Button
                  onClick={() => githubSaveMutation.mutate()}
                  disabled={githubSaveMutation.isPending || !ghOwner || !ghRepo || !ghToken}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {githubSaveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}
                  {githubSaveMutation.isPending ? "Connexion..." : "Connecter GitHub"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === Onglet GitLab === */}
      {activeTab === "gitlab" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <GitLabIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connexion GitLab</h2>
                <p className="text-sm text-gray-500">Connecte ta plateforme à ton projet GitLab (gitlab.com ou auto-hébergé)</p>
              </div>
            </div>

            {gitlabConfig?.configured ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Connecté à GitLab</p>
                    <p className="text-sm text-green-600">
                      Projet : <strong>{gitlabConfig.namespace}/{gitlabConfig.repo}</strong>
                      {gitlabConfig.instanceUrl !== "https://gitlab.com" && (
                        <span className="ml-2 text-xs opacity-75">({gitlabConfig.instanceUrl})</span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => gitlabDisconnectMutation.mutate()}
                  disabled={gitlabDisconnectMutation.isPending}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Déconnecter GitLab
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="gl-instance">URL de l'instance GitLab</Label>
                  <Input
                    id="gl-instance"
                    placeholder="https://gitlab.com"
                    value={glInstanceUrl}
                    onChange={(e) => setGlInstanceUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Laisse <code>https://gitlab.com</code> pour le GitLab public, ou entre l'URL de ton instance auto-hébergée.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gl-namespace">Namespace (groupe ou utilisateur)</Label>
                    <Input id="gl-namespace" placeholder="ex: mon-groupe" value={glNamespace} onChange={(e) => setGlNamespace(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gl-repo">Nom du projet</Label>
                    <Input id="gl-repo" placeholder="ex: mon-app-js" value={glRepo} onChange={(e) => setGlRepo(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gl-token">Personal Access Token</Label>
                  <Input id="gl-token" type="password" placeholder="glpat-xxxxxxxxxxxxxxxxxxxx" value={glToken} onChange={(e) => setGlToken(e.target.value)} className="mt-1" />
                  <p className="text-xs text-gray-500 mt-1">
                    Crée un token sur GitLab dans{" "}
                    <a href="https://gitlab.com/-/user_settings/personal_access_tokens" target="_blank" rel="noreferrer" className="text-primary underline">
                      Profil → Access Tokens
                    </a>{" "}
                    avec les scopes <strong>read_api</strong> et <strong>read_repository</strong>.
                  </p>
                </div>
                <Button
                  onClick={() => gitlabSaveMutation.mutate()}
                  disabled={gitlabSaveMutation.isPending || !glNamespace || !glRepo || !glToken}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {gitlabSaveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitLabIcon className="h-4 w-4 mr-2" />}
                  {gitlabSaveMutation.isPending ? "Connexion..." : "Connecter GitLab"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === Onglet Bitbucket === */}
      {activeTab === "bitbucket" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BitbucketIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connexion Bitbucket</h2>
                <p className="text-sm text-gray-500">Connecte ta plateforme à ton dépôt Bitbucket Cloud</p>
              </div>
            </div>

            {bitbucketConfig?.configured ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Connecté à Bitbucket</p>
                    <p className="text-sm text-green-600">Dépôt : <strong>{bitbucketConfig.workspace}/{bitbucketConfig.repo}</strong></p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => bitbucketDisconnectMutation.mutate()}
                  disabled={bitbucketDisconnectMutation.isPending}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Déconnecter Bitbucket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bb-workspace">Workspace</Label>
                    <Input id="bb-workspace" placeholder="ex: mon-workspace" value={bbWorkspace} onChange={(e) => setBbWorkspace(e.target.value)} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">Le nom du workspace visible dans l'URL Bitbucket</p>
                  </div>
                  <div>
                    <Label htmlFor="bb-repo">Nom du dépôt</Label>
                    <Input id="bb-repo" placeholder="ex: mon-app-js" value={bbRepo} onChange={(e) => setBbRepo(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bb-username">Nom d'utilisateur Bitbucket</Label>
                  <Input id="bb-username" placeholder="ex: john.doe" value={bbUsername} onChange={(e) => setBbUsername(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="bb-app-password">App Password</Label>
                  <Input id="bb-app-password" type="password" placeholder="xxxxxxxxxxxxxxxxxxxx" value={bbAppPassword} onChange={(e) => setBbAppPassword(e.target.value)} className="mt-1" />
                  <p className="text-xs text-gray-500 mt-1">
                    Crée un App Password sur{" "}
                    <a href="https://bitbucket.org/account/settings/app-passwords/new" target="_blank" rel="noreferrer" className="text-primary underline">
                      bitbucket.org → App passwords
                    </a>{" "}
                    avec les droits <strong>Pipelines: Read</strong> et <strong>Repositories: Read</strong>.
                  </p>
                </div>
                <Button
                  onClick={() => bitbucketSaveMutation.mutate()}
                  disabled={bitbucketSaveMutation.isPending || !bbWorkspace || !bbRepo || !bbUsername || !bbAppPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {bitbucketSaveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                  {bitbucketSaveMutation.isPending ? "Connexion..." : "Connecter Bitbucket"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === Onglet npm audit === */}
      {activeTab === "audit" && (
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
                  placeholder={`{\n  "name": "mon-app",\n  "dependencies": {\n    "express": "^4.18.2",\n    "react": "^18.0.0"\n  }\n}`}
                  value={packageJsonContent}
                  onChange={(e) => setPackageJsonContent(e.target.value)}
                  className="mt-1 font-mono text-sm h-48"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Colle le fichier <strong>complet</strong> avec les sections <code>dependencies</code> et <code>devDependencies</code>.
                </p>
              </div>

              <Button
                onClick={() => auditMutation.mutate()}
                disabled={auditMutation.isPending || !packageJsonContent.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {auditMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {auditMutation.isPending ? "Analyse en cours..." : "Analyser les vulnérabilités"}
              </Button>

              {auditResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-700">{auditResult.totalPackages ?? 0} packages analysés</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${(auditResult.vulnerabilities?.length ?? 0) === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
                    <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(vuln.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{vuln.package} <span className="font-normal text-sm">({vuln.version})</span></p>
                          <p className="text-sm mt-1">{vuln.summary}</p>
                          <p className="text-xs mt-1 opacity-70">{vuln.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-white/60">{vuln.severity}</span>
                          {vuln.url && (
                            <a href={vuln.url} target="_blank" rel="noreferrer" className="text-xs underline">Détails</a>
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
      )}
    </div>
  );
}
