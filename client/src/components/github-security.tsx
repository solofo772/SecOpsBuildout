import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, Github, ExternalLink, CheckCircle } from "lucide-react";

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "high":
      return <AlertCircle className="h-4 w-4 text-white" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4 text-white" />;
    default:
      return <Info className="h-4 w-4 text-white" />;
  }
}

function severityBg(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-600";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    default: return "bg-blue-500";
  }
}

function severityBorder(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-50 border-red-200";
    case "high": return "bg-orange-50 border-orange-200";
    case "medium": return "bg-yellow-50 border-yellow-200";
    default: return "bg-blue-50 border-blue-200";
  }
}

export function GitHubSecurity() {
  const { data: config } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const { data: alerts, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/github/security"],
    enabled: config?.configured === true,
    refetchInterval: 60000,
  });

  if (!config?.configured) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Github className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900">Alertes Dependabot — Réelles</h3>
          </div>
          <div className="text-center py-8 text-gray-500">
            <Github className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">GitHub non configuré</p>
            <p className="text-sm mt-1">Va dans <strong>Paramètres</strong> pour connecter ton dépôt GitHub</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  alerts?.forEach((a: any) => {
    const sev = a.security_advisory?.severity?.toLowerCase();
    if (sev === "critical") counts.critical++;
    else if (sev === "high") counts.high++;
    else if (sev === "medium") counts.medium++;
    else counts.low++;
  });

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Github className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Alertes Dependabot</h3>
          </div>
          <a
            href={`https://github.com/${config.owner}/${config.repo}/security/dependabot`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            Voir sur GitHub <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>

        {error ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Dependabot n'est peut-être pas activé sur ce dépôt, ou le token n'a pas les droits <strong>security_events</strong>.
          </div>
        ) : !alerts?.length ? (
          <div className="text-center py-8">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-gray-700">Aucune alerte Dependabot</p>
            <p className="text-sm text-gray-500">Toutes les dépendances semblent saines</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "Critique", count: counts.critical, color: "bg-red-100 text-red-700" },
                { label: "Élevée", count: counts.high, color: "bg-orange-100 text-orange-700" },
                { label: "Moyenne", count: counts.medium, color: "bg-yellow-100 text-yellow-700" },
                { label: "Faible", count: counts.low, color: "bg-blue-100 text-blue-700" },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-lg p-2 text-center ${color}`}>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs">{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {alerts.map((alert: any, i: number) => {
                const sev = alert.security_advisory?.severity || "low";
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${severityBorder(sev)}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${severityBg(sev)}`}>
                        <SeverityIcon severity={sev} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {alert.security_advisory?.summary || alert.dependency?.package?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {alert.dependency?.package?.name} {alert.dependency?.manifest_path && `· ${alert.dependency.manifest_path}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-white text-xs font-bold rounded uppercase ${severityBg(sev)}`}>
                        {sev}
                      </span>
                      {alert.html_url && (
                        <a href={alert.html_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3 text-gray-400 hover:text-primary" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Données en temps réel depuis GitHub Dependabot</p>
        </div>
      </CardContent>
    </Card>
  );
}
