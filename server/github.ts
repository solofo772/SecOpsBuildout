interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

let githubConfig: GitHubConfig | null = null;

export function setGitHubConfig(config: GitHubConfig) {
  githubConfig = config;
}

export function getGitHubConfig(): GitHubConfig | null {
  return githubConfig;
}

export function clearGitHubConfig() {
  githubConfig = null;
}

async function githubFetch(path: string, token: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function fetchWorkflowRuns(config: GitHubConfig) {
  const data = await githubFetch(
    `/repos/${config.owner}/${config.repo}/actions/runs?per_page=10`,
    config.token
  );
  return data.workflow_runs || [];
}

export async function fetchDependabotAlerts(config: GitHubConfig) {
  try {
    const data = await githubFetch(
      `/repos/${config.owner}/${config.repo}/dependabot/alerts?per_page=20&state=open`,
      config.token
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchRepoInfo(config: GitHubConfig) {
  const [repo, languages, commits] = await Promise.all([
    githubFetch(`/repos/${config.owner}/${config.repo}`, config.token),
    githubFetch(`/repos/${config.owner}/${config.repo}/languages`, config.token),
    githubFetch(`/repos/${config.owner}/${config.repo}/commits?per_page=5`, config.token),
  ]);
  return { repo, languages, commits };
}

export async function analyzePackageJson(packageJsonContent: string) {
  let pkg: any;
  try {
    pkg = JSON.parse(packageJsonContent);
  } catch {
    throw new Error("JSON invalide dans le package.json");
  }

  const deps: Record<string, string> = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if (Object.keys(deps).length === 0) {
    return { vulnerabilities: [], totalPackages: 0 };
  }

  const queries = Object.entries(deps).map(([name, version]) => ({
    package: {
      name,
      ecosystem: "npm",
    },
    version: String(version).replace(/[\^~>=<]/g, "").split(" ")[0],
  }));

  try {
    const res = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    });

    if (!res.ok) throw new Error("OSV API error");

    const data = await res.json();
    const results = data.results || [];

    const vulnerabilities: any[] = [];
    results.forEach((result: any, index: number) => {
      const [pkgName] = Object.entries(deps)[index];
      if (result.vulns && result.vulns.length > 0) {
        result.vulns.forEach((vuln: any) => {
          const severity =
            vuln.database_specific?.severity?.toLowerCase() ||
            vuln.severity?.[0]?.score >= 9
              ? "critical"
              : vuln.severity?.[0]?.score >= 7
              ? "high"
              : vuln.severity?.[0]?.score >= 4
              ? "medium"
              : "low";

          vulnerabilities.push({
            package: pkgName,
            version: deps[pkgName],
            id: vuln.id,
            summary: vuln.summary || vuln.details || "Vulnérabilité détectée",
            severity: typeof severity === "string" ? severity : "medium",
            url: `https://osv.dev/vulnerability/${vuln.id}`,
          });
        });
      }
    });

    return {
      vulnerabilities,
      totalPackages: Object.keys(deps).length,
    };
  } catch {
    return { vulnerabilities: [], totalPackages: Object.keys(deps).length, error: "Impossible de contacter l'API de vulnérabilités" };
  }
}
