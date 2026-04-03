import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Loader2, GitBranch, ExternalLink, Github } from "lucide-react";
import { formatDuration } from "@/lib/utils";

function StatusIcon({ conclusion, status }: { conclusion: string | null; status: string }) {
  if (status === "in_progress" || status === "queued") {
    return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
  }
  if (conclusion === "success") return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (conclusion === "failure") return <XCircle className="h-5 w-5 text-red-500" />;
  return <Clock className="h-5 w-5 text-gray-400" />;
}

function StatusBadge({ conclusion, status }: { conclusion: string | null; status: string }) {
  if (status === "in_progress") return <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">En cours</span>;
  if (status === "queued") return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">En attente</span>;
  if (conclusion === "success") return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Succès</span>;
  if (conclusion === "failure") return <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">Échec</span>;
  if (conclusion === "cancelled") return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">Annulé</span>;
  return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">{conclusion || status}</span>;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "il y a quelques secondes";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export function GitHubPipeline() {
  const { data: config } = useQuery<{ configured: boolean; owner?: string; repo?: string }>({
    queryKey: ["/api/github/config"],
  });

  const { data: runs, isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/github/workflows"],
    enabled: config?.configured === true,
    refetchInterval: 30000,
  });

  if (!config?.configured) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Github className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900">GitHub Actions — Pipeline Réel</h3>
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
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">GitHub Actions</h3>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Erreur de connexion à GitHub. Vérifie ton token dans les Paramètres.
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
            <Github className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">
              GitHub Actions — {config.owner}/{config.repo}
            </h3>
          </div>
          <a
            href={`https://github.com/${config.owner}/${config.repo}/actions`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            Voir sur GitHub <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>

        {!runs?.length ? (
          <p className="text-gray-500 text-center py-6">Aucun workflow trouvé pour ce dépôt.</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run: any) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <StatusIcon conclusion={run.conclusion} status={run.status} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{run.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                      <GitBranch className="h-3 w-3" />
                      <span>{run.head_branch}</span>
                      <span>•</span>
                      <span>{run.head_commit?.message?.split("\n")[0]?.slice(0, 50) || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <StatusBadge conclusion={run.conclusion} status={run.status} />
                  <span className="text-xs text-gray-400">{timeAgo(run.updated_at)}</span>
                  <a href={run.html_url} target="_blank" rel="noreferrer">
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
