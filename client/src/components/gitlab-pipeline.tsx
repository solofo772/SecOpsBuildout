import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Loader2, GitBranch, ExternalLink } from "lucide-react";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "failed": return <XCircle className="h-5 w-5 text-red-500" />;
    case "running": return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case "pending": return <Clock className="h-5 w-5 text-yellow-500" />;
    case "canceled": return <XCircle className="h-5 w-5 text-gray-400" />;
    default: return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    running: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    canceled: "bg-gray-100 text-gray-600",
    skipped: "bg-gray-100 text-gray-500",
  };
  const labelMap: Record<string, string> = {
    success: "Succès", failed: "Échec", running: "En cours",
    pending: "En attente", canceled: "Annulé", skipped: "Ignoré",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labelMap[status] ?? status}
    </span>
  );
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "il y a quelques secondes";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
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

export function GitLabPipeline() {
  const { data: config } = useQuery<{ configured: boolean; namespace?: string; repo?: string; instanceUrl?: string }>({
    queryKey: ["/api/gitlab/config"],
  });

  const { data: pipelines, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/gitlab/pipelines"],
    enabled: config?.configured === true,
    refetchInterval: 30000,
  });

  if (!config?.configured) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <GitLabIcon />
            <h3 className="text-lg font-bold text-gray-900">GitLab CI/CD — Pipeline Réel</h3>
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
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const baseUrl = (config.instanceUrl ?? "https://gitlab.com").replace(/\/$/, "");
  const projectUrl = `${baseUrl}/${config.namespace}/${config.repo}`;

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <GitLabIcon />
            <h3 className="text-lg font-bold text-gray-900">
              GitLab CI/CD — {config.namespace}/{config.repo}
            </h3>
          </div>
          <a
            href={`${projectUrl}/-/pipelines`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            Voir sur GitLab <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Erreur de connexion à GitLab. Vérifie ton token dans les Paramètres.
          </div>
        ) : !pipelines?.length ? (
          <p className="text-gray-500 text-center py-6">Aucun pipeline trouvé pour ce projet.</p>
        ) : (
          <div className="space-y-3">
            {pipelines.map((pipeline: any) => (
              <div
                key={pipeline.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <StatusIcon status={pipeline.status} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Pipeline #{pipeline.id}
                      {pipeline.name ? ` — ${pipeline.name}` : ""}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                      <GitBranch className="h-3 w-3" />
                      <span>{pipeline.ref}</span>
                      {pipeline.sha && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{pipeline.sha?.slice(0, 8)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusBadge status={pipeline.status} />
                  <span className="text-xs text-gray-400">
                    {pipeline.updated_at ? timeAgo(pipeline.updated_at) : "—"}
                  </span>
                  <a href={pipeline.web_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 text-gray-400 hover:text-primary" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">Actualisé toutes les 30 secondes</p>
      </CardContent>
    </Card>
  );
}
