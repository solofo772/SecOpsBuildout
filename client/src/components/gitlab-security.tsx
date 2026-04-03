import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, ExternalLink, CheckCircle } from "lucide-react";

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

const GitLabIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M190 350.606L254.765 153.779H125.235L190 350.606Z" fill="#E24329"/>
    <path d="M190 350.606L125.235 153.779H29.875L190 350.606Z" fill="#FC6D26"/>
    <path d="M29.875 153.779L7.975 221.496C6.073 227.203 8.131 233.472 12.995 237.017L190 350.606L29.875 153.779Z" fill="#FCA326"/>
    <path d="M29.875 153.779H125.235L85.885 29.434C83.88 23.256 75.334 23.256 73.33 29.434L29.875 153.779Z" fill="#E24329"/>
    <path d="M190 350.606L254.765 153.779H350.125L190 350.606Z" fill="#FC6D26"/>
    <path d="M350.125 153.779L372.025 221.496C373.927 227.203 371.869 233.472 367.005 237.017L190 350.606L350.125 153.779Z" fill="#FCA326"/>
    <path d="M350.125 153.779H254.765L294.115 29.434C296.12 23.256 304.666 23.256 306.67 29.434L350.125 153.779Z" fill="#E24329"/>
  </svg>
);

export function GitLabSecurity() {
  const { data: config } = useQuery<{ configured: boolean; namespace?: string; repo?: string; instanceUrl?: string }>({
    queryKey: ["/api/gitlab/config"],
  });

  const { data: vulns, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/gitlab/security"],
    enabled: config?.configured === true,
    refetchInterval: 60000,
  });

  if (!config?.configured) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <GitLabIcon />
            <h3 className="text-lg font-bold text-gray-900">Vulnérabilités GitLab</h3>
          </div>
          <div className="text-center py-8 text-gray-500">
            <div className="flex justify-center mb-3"><GitLabIcon /></div>
            <p className="font-medium">GitLab non configuré</p>
            <p className="text-sm mt-1">Va dans <strong>Paramètres</strong> pour connecter ton projet GitLab</p>
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

  const baseUrl = (config.instanceUrl ?? "https://gitlab.com").replace(/\/$/, "");
  const projectUrl = `${baseUrl}/${config.namespace}/${config.repo}`;

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  vulns?.forEach((v: any) => {
    const sev = v.severity?.toLowerCase();
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
            <GitLabIcon />
            <h3 className="text-lg font-bold text-gray-900">Vulnérabilités GitLab</h3>
          </div>
          <a
            href={`${projectUrl}/-/security/vulnerability_report`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            Voir sur GitLab <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>

        {error ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            La fonctionnalité de sécurité nécessite GitLab Ultimate, ou le token n'a pas les droits suffisants.
          </div>
        ) : !vulns?.length ? (
          <div className="text-center py-8">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400" />
            <p className="font-medium text-gray-700">Aucune vulnérabilité détectée</p>
            <p className="text-sm text-gray-500">Toutes les analyses de sécurité semblent propres</p>
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
              {vulns.map((v: any, i: number) => {
                const sev = v.severity ?? "unknown";
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${severityBorder(sev)}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${severityBg(sev)}`}>
                        <SeverityIcon severity={sev} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{v.name || v.title || "Vulnérabilité"}</p>
                        <p className="text-xs text-gray-500">{v.scanner?.name ?? v.report_type ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-white text-xs font-bold rounded uppercase ${severityBg(sev)}`}>
                        {sev}
                      </span>
                      {v.web_url && (
                        <a href={v.web_url} target="_blank" rel="noreferrer">
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
          <p className="text-xs text-gray-400">Données depuis GitLab Security Dashboard</p>
        </div>
      </CardContent>
    </Card>
  );
}
