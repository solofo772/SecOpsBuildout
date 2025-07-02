import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Bot, 
  Eye, 
  Users, 
  ClipboardCheck, 
  History 
} from "lucide-react";

const bestPractices = [
  {
    icon: Shield,
    title: "Shift Left Security",
    description: "Integrate security testing early in the development cycle to catch vulnerabilities before production.",
    color: "primary"
  },
  {
    icon: Bot,
    title: "Automation First",
    description: "Automate security scans, compliance checks, and deployment processes to ensure consistency.",
    color: "secondary"
  },
  {
    icon: Eye,
    title: "Continuous Monitoring",
    description: "Monitor applications and infrastructure continuously for security threats and performance issues.",
    color: "success"
  },
  {
    icon: Users,
    title: "Culture & Training",
    description: "Foster security awareness and provide regular training to development and operations teams.",
    color: "warning"
  },
  {
    icon: ClipboardCheck,
    title: "Compliance as Code",
    description: "Implement compliance requirements as automated policies and tests within your pipeline.",
    color: "purple"
  },
  {
    icon: History,
    title: "Incident Response",
    description: "Maintain documented incident response procedures and practice them regularly.",
    color: "pink"
  }
];

const getColorClasses = (color: string) => {
  switch (color) {
    case 'primary':
      return 'bg-indigo-100 text-indigo-600';
    case 'secondary':
      return 'bg-cyan-100 text-cyan-600';
    case 'success':
      return 'bg-green-100 text-green-600';
    case 'warning':
      return 'bg-yellow-100 text-yellow-600';
    case 'purple':
      return 'bg-purple-100 text-purple-600';
    case 'pink':
      return 'bg-pink-100 text-pink-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export function BestPractices() {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">DevSecOps Best Practices</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestPractices.map((practice, index) => {
            const Icon = practice.icon;
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getColorClasses(practice.color)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{practice.title}</h4>
                <p className="text-sm text-gray-600">{practice.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
