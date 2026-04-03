import { Shield, BarChart3, GitBranch, Lock, ChartLine, ClipboardCheck, Book, Network, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type ActiveSection = 'dashboard' | 'pipeline' | 'security' | 'quality' | 'compliance' | 'docs' | 'architecture' | 'settings';

interface SidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart3 },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
  { id: 'security', label: 'Analyses Sécurité', icon: Lock },
  { id: 'quality', label: 'Qualité Code', icon: ChartLine },
  { id: 'compliance', label: 'Conformité', icon: ClipboardCheck },
  { id: 'docs', label: 'Bonnes Pratiques', icon: Book },
  { id: 'architecture', label: 'Architecture', icon: Network },
] as const;

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { data: githubConfig } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const { data: gitlabConfig } = useQuery<{ configured: boolean; namespace?: string; repo?: string }>({
    queryKey: ["/api/gitlab/config"],
  });

  return (
    <div className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold">DevSecOps Hub</h1>
        </div>
      </div>

      {(githubConfig?.configured || gitlabConfig?.configured) && (
        <div className="mx-4 px-3 py-2 bg-green-900/40 border border-green-700/50 rounded-lg mb-2 space-y-1">
          {githubConfig?.configured && (
            <p className="text-xs text-green-400 font-medium">● GitHub : {githubConfig.owner}/{githubConfig.repo}</p>
          )}
          {gitlabConfig?.configured && (
            <p className="text-xs text-green-400 font-medium">● GitLab : {gitlabConfig.namespace}/{gitlabConfig.repo}</p>
          )}
        </div>
      )}
      
      <nav className="mt-2 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id as ActiveSection)}
              className={cn(
                "w-full flex items-center px-6 py-3 text-left transition-colors",
                isActive
                  ? "bg-primary/20 border-r-4 border-primary text-primary font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 mt-2">
        <button
          onClick={() => onSectionChange('settings')}
          className={cn(
            "w-full flex items-center px-6 py-4 text-left transition-colors",
            activeSection === 'settings'
              ? "bg-primary/20 border-r-4 border-primary text-primary font-medium"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Settings className="mr-3 h-4 w-4" />
          Paramètres
          {!githubConfig?.configured && !gitlabConfig?.configured && (
            <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full" title="Aucune connexion Git configurée" />
          )}
        </button>
      </div>
    </div>
  );
}
