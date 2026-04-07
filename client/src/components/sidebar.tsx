import { Shield, BarChart3, GitBranch, Lock, ChartLine, ClipboardCheck, Book, Network, Settings, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, logout } = useAuth();

  const { data: githubConfig } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const { data: gitlabConfig } = useQuery<{ configured: boolean; namespace?: string; repo?: string }>({
    queryKey: ["/api/gitlab/config"],
  });

  const { data: bitbucketConfig } = useQuery<{ configured: boolean; workspace?: string; repo?: string }>({
    queryKey: ["/api/bitbucket/config"],
  });

  const anyConnected = githubConfig?.configured || gitlabConfig?.configured || bitbucketConfig?.configured;

  return (
    <div className="w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold">DevSecOps Hub</h1>
        </div>
      </div>

      {/* Connexion status badge */}
      {anyConnected && (
        <div className="mx-4 px-3 py-2 bg-green-900/40 border border-green-700/50 rounded-lg mb-2 space-y-1 flex-shrink-0">
          {githubConfig?.configured && (
            <p className="text-xs text-green-400 font-medium">● GitHub : {githubConfig.owner}/{githubConfig.repo}</p>
          )}
          {gitlabConfig?.configured && (
            <p className="text-xs text-green-400 font-medium">● GitLab : {gitlabConfig.namespace}/{gitlabConfig.repo}</p>
          )}
          {bitbucketConfig?.configured && (
            <p className="text-xs text-green-400 font-medium">● Bitbucket : {bitbucketConfig.workspace}/{bitbucketConfig.repo}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto mt-2">
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

      {/* Bottom actions — always visible */}
      <div className="border-t border-gray-700 flex-shrink-0">
        {/* Connexion Git button — only when nothing is connected */}
        {!anyConnected && (
          <button
            onClick={() => onSectionChange('settings')}
            className="w-full flex items-center px-6 py-3 text-left transition-colors text-orange-300 hover:bg-gray-800 hover:text-orange-200"
          >
            <LogIn className="mr-3 h-4 w-4" />
            Connexion Git
            <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => onSectionChange('settings')}
          className={cn(
            "w-full flex items-center px-6 py-3 text-left transition-colors",
            activeSection === 'settings'
              ? "bg-primary/20 border-r-4 border-primary text-primary font-medium"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Settings className="mr-3 h-4 w-4" />
          Paramètres
        </button>

        {/* User info + logout */}
        {user && (
          <div className="mx-3 mb-3 mt-1 p-3 bg-gray-800 rounded-lg flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Se déconnecter"
              className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
