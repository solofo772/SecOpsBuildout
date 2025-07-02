import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Laptop, 
  GitBranch, 
  Code, 
  Shield, 
  TestTube, 
  Search, 
  Server, 
  Cloud, 
  BarChart3,
  Download,
  Edit
} from "lucide-react";

export function ArchitectureDiagram() {
  return (
    <Card className="bg-white shadow-sm border border-gray-200 mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">DevSecOps Architecture</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 overflow-x-auto">
          <div className="min-w-max space-y-8">
            {/* Developer Environment */}
            <div className="flex justify-center">
              <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center w-40">
                <Laptop className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-bold text-blue-800">Developer</h4>
                <p className="text-xs text-blue-600">IDE + Security Plugins</p>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-400"></div>
            </div>

            {/* Source Control */}
            <div className="flex justify-center">
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center w-40">
                <GitBranch className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-bold text-green-800">Source Control</h4>
                <p className="text-xs text-green-600">Git + Branch Protection</p>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-400"></div>
            </div>

            {/* CI/CD Pipeline */}
            <div className="flex justify-center space-x-4">
              <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-3 text-center w-32">
                <Code className="mx-auto h-6 w-6 text-purple-600 mb-2" />
                <h5 className="font-bold text-purple-800 text-sm">Build</h5>
              </div>
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 text-center w-32">
                <Shield className="mx-auto h-6 w-6 text-red-600 mb-2" />
                <h5 className="font-bold text-red-800 text-sm">SAST</h5>
              </div>
              <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 text-center w-32">
                <TestTube className="mx-auto h-6 w-6 text-yellow-600 mb-2" />
                <h5 className="font-bold text-yellow-800 text-sm">Test</h5>
              </div>
              <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3 text-center w-32">
                <Search className="mx-auto h-6 w-6 text-orange-600 mb-2" />
                <h5 className="font-bold text-orange-800 text-sm">DAST</h5>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-400"></div>
            </div>

            {/* Deployment */}
            <div className="flex justify-center space-x-8">
              <div className="bg-indigo-100 border-2 border-indigo-300 rounded-lg p-4 text-center w-36">
                <Server className="mx-auto h-6 w-6 text-indigo-600 mb-2" />
                <h4 className="font-bold text-indigo-800">Staging</h4>
                <p className="text-xs text-indigo-600">Security Testing</p>
              </div>
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center w-36">
                <Cloud className="mx-auto h-6 w-6 text-green-600 mb-2" />
                <h4 className="font-bold text-green-800">Production</h4>
                <p className="text-xs text-green-600">Runtime Protection</p>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gray-400"></div>
            </div>

            {/* Monitoring */}
            <div className="flex justify-center">
              <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center w-48">
                <BarChart3 className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                <h4 className="font-bold text-gray-800">Monitoring & Alerting</h4>
                <p className="text-xs text-gray-600">Security Events + Performance</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
