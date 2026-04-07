import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MetricsGrid } from "@/components/metrics-grid";
import { PipelineVisualization } from "@/components/pipeline-visualization";
import { SecurityDashboard } from "@/components/security-dashboard";
import { QualityMetrics } from "@/components/quality-metrics";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { BestPractices } from "@/components/best-practices";
import { ComplianceDashboard } from "@/components/compliance-dashboard";
import { GitHubPipeline } from "@/components/github-pipeline";
import { GitHubSecurity } from "@/components/github-security";
import { GitLabPipeline } from "@/components/gitlab-pipeline";
import { GitLabSecurity } from "@/components/gitlab-security";
import { BitbucketPipeline } from "@/components/bitbucket-pipeline";
import { SettingsPage } from "@/pages/settings";
import { Button } from "@/components/ui/button";
import { Play, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ActiveSection = 'dashboard' | 'pipeline' | 'security' | 'quality' | 'compliance' | 'docs' | 'architecture' | 'settings';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: githubConfig } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const { data: gitlabConfig } = useQuery<{ configured: boolean; namespace?: string; repo?: string }>({
    queryKey: ["/api/gitlab/config"],
  });

  const { data: bitbucketConfig } = useQuery<{ configured: boolean; workspace?: string; repo?: string }>({
    queryKey: ["/api/bitbucket/config"],
  });

  const startPipelineMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pipeline/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/github/workflows"] });
      toast({
        title: "Pipeline Démarré",
        description: "Une nouvelle exécution de pipeline a été initiée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec du démarrage du pipeline.",
        variant: "destructive",
      });
    },
  });

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            <MetricsGrid />
            {githubConfig?.configured ? <GitHubPipeline /> :
             gitlabConfig?.configured ? <GitLabPipeline /> :
             bitbucketConfig?.configured ? <BitbucketPipeline /> :
             <PipelineVisualization />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {githubConfig?.configured ? <GitHubSecurity /> :
               gitlabConfig?.configured ? <GitLabSecurity /> :
               <SecurityDashboard />}
              <QualityMetrics />
            </div>
            <ArchitectureDiagram />
            <BestPractices />
          </>
        );
      case 'pipeline':
        return (
          <>
            {githubConfig?.configured ? <GitHubPipeline /> :
             gitlabConfig?.configured ? <GitLabPipeline /> :
             bitbucketConfig?.configured ? <BitbucketPipeline /> :
             <PipelineVisualization />}
            {!githubConfig?.configured && !gitlabConfig?.configured && !bitbucketConfig?.configured && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mt-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Connecte ton dépôt Git</h3>
                <p className="text-orange-700 text-sm">
                  Pour voir tes vrais pipelines, va dans{" "}
                  <button onClick={() => setActiveSection("settings")} className="font-bold underline">
                    Paramètres
                  </button>{" "}
                  et connecte GitHub ou GitLab.
                </p>
              </div>
            )}
          </>
        );
      case 'security':
        return (
          <>
            {githubConfig?.configured ? <GitHubSecurity /> :
             gitlabConfig?.configured ? <GitLabSecurity /> :
             <SecurityDashboard />}
            {!githubConfig?.configured && !gitlabConfig?.configured && !bitbucketConfig?.configured && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mt-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Active les alertes de sécurité réelles</h3>
                <p className="text-orange-700 text-sm">
                  Va dans{" "}
                  <button onClick={() => setActiveSection("settings")} className="font-bold underline">
                    Paramètres
                  </button>{" "}
                  pour connecter GitHub ou GitLab et voir les vraies vulnérabilités.
                </p>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyse npm audit</h3>
              <p className="text-gray-600 text-sm">
                Analyse directement ton{" "}
                <code className="bg-gray-100 px-1 rounded">package.json</code> dans{" "}
                <button onClick={() => setActiveSection("settings")} className="text-primary font-medium underline">
                  Paramètres → Analyse npm
                </button>.
              </p>
            </div>
          </>
        );
      case 'quality':
        return (
          <>
            <QualityMetrics />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rapports de Qualité</h3>
              <p className="text-gray-600 text-sm">
                Pour des métriques de qualité en temps réel, connecte{" "}
                <a
                  href="https://sonarcloud.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  SonarCloud
                </a>{" "}
                à ton dépôt GitHub. C'est gratuit pour les projets open source.
              </p>
            </div>
          </>
        );
      case 'compliance':
        return <ComplianceDashboard />;
      case 'docs':
        return <BestPractices />;
      case 'architecture':
        return <ArchitectureDiagram />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return { title: "Tableau de Bord DevSecOps", subtitle: "Surveillez votre cycle de développement sécurisé" };
      case 'pipeline':
        return { title: "Pipeline CI/CD", subtitle: githubConfig?.configured ? `GitHub Actions — ${githubConfig.owner}/${githubConfig.repo}` : "Gérez et surveillez votre pipeline de déploiement" };
      case 'security':
        return { title: "Analyses de Sécurité", subtitle: githubConfig?.configured ? "Alertes Dependabot en temps réel" : "Évaluation et gestion des vulnérabilités de sécurité" };
      case 'quality':
        return { title: "Qualité du Code", subtitle: "Métriques et analyse de la qualité du code" };
      case 'compliance':
        return { title: "Conformité", subtitle: "Gestion de la conformité réglementaire et audit" };
      case 'docs':
        return { title: "Meilleures Pratiques", subtitle: "Guide d'implémentation DevSecOps" };
      case 'architecture':
        return { title: "Architecture", subtitle: "Architecture système et modèles de conception" };
      case 'settings':
        return { title: "Paramètres", subtitle: "Configure ta connexion GitHub et analyse la sécurité de ton projet" };
      default:
        return { title: "Tableau de Bord DevSecOps", subtitle: "Surveillez votre cycle de développement sécurisé" };
    }
  };

  const { title, subtitle } = getSectionTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 text-sm">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-3">
              {activeSection !== 'settings' && (
                <Button 
                  onClick={() => startPipelineMutation.mutate()}
                  disabled={startPipelineMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {startPipelineMutation.isPending ? "Démarrage..." : "Lancer Pipeline"}
                </Button>
              )}
              <button
                onClick={() => setActiveSection('settings')}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
