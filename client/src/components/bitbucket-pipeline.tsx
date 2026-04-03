import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Loader2, GitBranch, ExternalLink } from "lucide-react";

const BitbucketIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.043 2a.96.96 0 0 0-.957 1.115l4.338 26.53A1.31 1.31 0 0 0 6.71 30.73l9.29-2.21 9.29 2.21a1.31 1.31 0 0 0 1.286-1.085l4.338-26.53A.96.96 0 0 0 29.957 2zm17.74 19.5h-7.566L10.37 10.5h11.26z" fill="#2684FF"/>
    <path d="M28.13 10.5H21.63l-1.847 11h-7.566L7.09 28.03a1.306 1.306 0 0 0 .85.7l9.06 2.16 9.06-2.16a1.31 1.31 0 0 0 1-1.1z" fill="url(#bitbucket-grad)"/>
    <defs>
      <linearGradient id="bitbucket-grad" x1="30.5" y1="13.4" x2="18.7" y2="27.4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0052CC"/>
        <stop offset="1" stopColor="#2684FF"/>
      </linearGradient>
    </defs>
  </svg>
);

function StatusIcon({ state }: { state: string }) {
  switch (state?.toUpperCase()) {
    case "SUCCESSFUL": return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "FAILED": return <XCircle className="h-5 w-5 text-red-500" />;
    case "IN_PROGRESS": return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case "PENDING": return <Clock className="h-5 w-5 text-yellow-500" />;
    case "STOPPED": return <XCircle className="h-5 w-5 text-gray-400" />;
    default: return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function StatusBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    SUCCESSFUL: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    STOPPED: "bg-gray-100 text-gray-600",
    ERROR: "bg-red-100 text-red-700",
  };
  const labelMap: Record<string, string> = {
    SUCCESSFUL: "Succès",
    FAILED: "Échec",
    IN_PROGRESS: "En cours",
    PENDING: "En attente",
    STOPPED: "Arrêté",
    ERROR: "Erreur",
  };
  const key = state?.toUpperCase();
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[key] ?? "bg-gray-100 text-gray-600"}`}>
      {labelMap[key] ?? state}
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

export function BitbucketPipeline() {
  const { data: config } = useQuery<{ configured: boolean; workspace?: string; repo?: string }>({
    queryKey: ["/api/bitbucket/config"],
  });

  const { data: pipelines, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/bitbucket/pipelines"],
    enabled: config?.configured === true,
    refetchInterval: 30000,
  });

  if (!config?.configured) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BitbucketIcon />
            <h3 className="text-lg font-bold text-gray-900">Bitbucket Pipelines — Réels</h3>
          </div>
          <div className="text-center py-8 text-gray-500">
            <div className="flex justify-center mb-3"><BitbucketIcon /></div>
            <p className="font-medium">Bitbucket non configuré</p>
            <p className="text-sm mt-1">Va dans <strong>Paramètres</strong> pour connecter ton dépôt Bitbucket</p>
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

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <BitbucketIcon />
            <h3 className="text-lg font-bold text-gray-900">
              Bitbucket Pipelines — {config.workspace}/{config.repo}
            </h3>
          </div>
          <a
            href={`https://bitbucket.org/${config.workspace}/${config.repo}/pipelines`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            Voir sur Bitbucket <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Erreur de connexion à Bitbucket. Vérifie ton App Password dans les Paramètres.
          </div>
        ) : !pipelines?.length ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Aucun pipeline trouvé.</p>
            <p className="text-xs text-gray-400 mt-1">Assure-toi que les Pipelines sont activés sur ce dépôt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pipelines.map((pipeline: any) => {
              const state = pipeline.state?.name ?? pipeline.state?.result?.name ?? "UNKNOWN";
              const branch = pipeline.target?.ref_name ?? pipeline.target?.branch ?? "—";
              const commitMsg = pipeline.target?.commit?.message?.split("\n")[0]?.slice(0, 50) ?? "—";
              const sha = pipeline.target?.commit?.hash?.slice(0, 8) ?? "";
              const updatedAt = pipeline.completed_on ?? pipeline.created_on;
              const pipelineUrl = `https://bitbucket.org/${config.workspace}/${config.repo}/pipelines/results/${pipeline.build_number}`;

              return (
                <div
                  key={pipeline.uuid}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <StatusIcon state={state} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Pipeline #{pipeline.build_number}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                        <GitBranch className="h-3 w-3" />
                        <span>{branch}</span>
                        {sha && <><span>•</span><span className="font-mono">{sha}</span></>}
                        {commitMsg !== "—" && <><span>•</span><span>{commitMsg}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge state={state} />
                    {updatedAt && <span className="text-xs text-gray-400">{timeAgo(updatedAt)}</span>}
                    <a href={pipelineUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 text-gray-400 hover:text-primary" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">Actualisé toutes les 30 secondes</p>
      </CardContent>
    </Card>
  );
}
