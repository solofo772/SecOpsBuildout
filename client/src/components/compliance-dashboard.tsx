import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Info, Shield } from "lucide-react";
import type { ComplianceCheck } from "@shared/schema";

export function ComplianceDashboard() {
  const { data: complianceChecks, isLoading } = useQuery<ComplianceCheck[]>({
    queryKey: ["/api/pipelines/1/compliance"],
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const groupedChecks = complianceChecks?.reduce((acc, check) => {
    if (!acc[check.framework]) {
      acc[check.framework] = [];
    }
    acc[check.framework].push(check);
    return acc;
  }, {} as Record<string, ComplianceCheck[]>);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Conformité et Audit</h3>
          </div>
          <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium">
            Voir les détails
          </Button>
        </div>

        {groupedChecks && Object.keys(groupedChecks).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedChecks).map(([framework, checks]) => (
              <div key={framework} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{framework}</h4>
                  <div className="flex space-x-1">
                    {checks.map((check) => (
                      <Badge 
                        key={check.id} 
                        variant={getStatusBadgeVariant(check.status)}
                        className="text-xs"
                      >
                        {check.status}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {checks.map((check) => {
                    const StatusIcon = getStatusIcon(check.status);
                    
                    return (
                      <div 
                        key={check.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${getStatusColor(check.status)}`}
                      >
                        <StatusIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900 truncate">
                              {check.checkName}
                            </h5>
                            <Badge variant="outline" className="text-xs ml-2">
                              {check.checkType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {check.description}
                          </p>
                          {check.evidence && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-700">Preuve: </span>
                              <span className="text-xs text-gray-600">{check.evidence}</span>
                            </div>
                          )}
                          {check.remediation && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <span className="text-xs font-medium text-yellow-800">Action requise: </span>
                              <span className="text-xs text-yellow-700">{check.remediation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune vérification de conformité disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              Les vérifications de conformité apparaîtront ici une fois configurées
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Dernière vérification: il y a 15 minutes</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Système conforme</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}