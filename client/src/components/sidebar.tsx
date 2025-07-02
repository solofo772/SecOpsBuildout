import { Shield, BarChart3, GitBranch, Lock, ChartLine, ClipboardCheck, Book, Network } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveSection = 'dashboard' | 'pipeline' | 'security' | 'quality' | 'compliance' | 'docs' | 'architecture';

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
  return (
    <div className="w-64 bg-gray-900 text-white flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold">DevSecOps Hub</h1>
        </div>
      </div>
      
      <nav className="mt-8">
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
    </div>
  );
}
