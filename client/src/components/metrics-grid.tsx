import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, PieChart, Rocket } from "lucide-react";
import type { Metrics } from "@shared/schema";

export function MetricsGrid() {
  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">No metrics available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pipeline Success Rate</p>
              <p className="text-3xl font-bold text-green-600">{metrics.successRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.successRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Issues</p>
              <p className="text-3xl font-bold text-yellow-600">{metrics.securityIssues}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">3 Critical, 9 Medium</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Code Coverage</p>
              <p className="text-3xl font-bold text-cyan-600">{metrics.coverage}%</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <PieChart className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-cyan-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.coverage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deployment Frequency</p>
              <p className="text-3xl font-bold text-indigo-600">{metrics.deployments}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Rocket className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">This month</p>
        </CardContent>
      </Card>
    </div>
  );
}
