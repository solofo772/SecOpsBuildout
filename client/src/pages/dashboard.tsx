import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MetricsGrid } from "@/components/metrics-grid";
import { PipelineVisualization } from "@/components/pipeline-visualization";
import { SecurityDashboard } from "@/components/security-dashboard";
import { QualityMetrics } from "@/components/quality-metrics";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { BestPractices } from "@/components/best-practices";
import { ComplianceDashboard } from "@/components/compliance-dashboard";
import { Button } from "@/components/ui/button";
import { Play, User, Settings } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ActiveSection = 'dashboard' | 'pipeline' | 'security' | 'quality' | 'compliance' | 'docs' | 'architecture';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startPipelineMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pipeline/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/runs"] });
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
            <PipelineVisualization />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SecurityDashboard />
              <QualityMetrics />
            </div>
            <ArchitectureDiagram />
            <BestPractices />
          </>
        );
      case 'pipeline':
        return (
          <>
            <PipelineVisualization />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pipeline History</h3>
              <p className="text-gray-600">Detailed pipeline execution history and logs would be displayed here.</p>
            </div>
          </>
        );
      case 'security':
        return (
          <>
            <SecurityDashboard />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Security Scanning Tools</h3>
              <p className="text-gray-600">Configure and manage security scanning tools and policies.</p>
            </div>
          </>
        );
      case 'quality':
        return (
          <>
            <QualityMetrics />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Reports</h3>
              <p className="text-gray-600">Detailed code quality reports and trends would be displayed here.</p>
            </div>
          </>
        );
      case 'compliance':
        return <ComplianceDashboard />;
      case 'docs':
        return <BestPractices />;
      case 'architecture':
        return <ArchitectureDiagram />;
      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return { title: "Tableau de Bord DevSecOps", subtitle: "Surveillez votre cycle de développement sécurisé" };
      case 'pipeline':
        return { title: "Pipeline CI/CD", subtitle: "Gérez et surveillez votre pipeline de déploiement" };
      case 'security':
        return { title: "Analyses de Sécurité", subtitle: "Évaluation et gestion des vulnérabilités de sécurité" };
      case 'quality':
        return { title: "Qualité du Code", subtitle: "Métriques et analyse de la qualité du code" };
      case 'compliance':
        return { title: "Conformité", subtitle: "Gestion de la conformité réglementaire et audit" };
      case 'docs':
        return { title: "Meilleures Pratiques", subtitle: "Guide d'implémentation DevSecOps" };
      case 'architecture':
        return { title: "Architecture", subtitle: "Architecture système et modèles de conception" };
      default:
        return { title: "Tableau de Bord DevSecOps", subtitle: "Surveillez votre cycle de développement sécurisé" };
    }
  };

  const { title, subtitle } = getSectionTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600">{subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => startPipelineMutation.mutate()}
                disabled={startPipelineMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <Play className="mr-2 h-4 w-4" />
                {startPipelineMutation.isPending ? "Démarrage..." : "Lancer Pipeline"}
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
