import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { getSeverityColor, getSeverityBadgeColor } from "@/lib/utils";
import type { SecurityIssue } from "@shared/schema";

export function SecurityDashboard() {
  const { data: issues, isLoading } = useQuery<SecurityIssue[]>({
    queryKey: ["/api/security/issues"],
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return AlertCircle;
      case 'high':
      case 'medium':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Security Scan Results</h3>
          <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium">
            View Details
          </Button>
        </div>

        <div className="space-y-4">
          {issues?.length ? (
            issues.map((issue) => {
              const SeverityIcon = getSeverityIcon(issue.severity);
              
              return (
                <div 
                  key={issue.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getSeverityBadgeColor(issue.severity)}`}>
                      <SeverityIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{issue.title}</p>
                      <p className="text-sm text-gray-600">{issue.file}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-white text-xs font-medium rounded uppercase ${getSeverityBadgeColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No security issues found</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Last scan: 2 minutes ago</p>
        </div>
      </CardContent>
    </Card>
  );
}
