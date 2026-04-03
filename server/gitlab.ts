interface GitLabConfig {
  instanceUrl: string;
  namespace: string;
  repo: string;
  token: string;
}

let gitlabConfig: GitLabConfig | null = null;

export function setGitLabConfig(config: GitLabConfig) {
  gitlabConfig = config;
}

export function getGitLabConfig(): GitLabConfig | null {
  return gitlabConfig;
}

export function clearGitLabConfig() {
  gitlabConfig = null;
}

async function gitlabFetch(path: string, config: GitLabConfig) {
  const base = config.instanceUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/api/v4${path}`, {
    headers: {
      "PRIVATE-TOKEN": config.token,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitLab API error ${res.status}: ${err}`);
  }
  return res.json();
}

function encodeProjectPath(namespace: string, repo: string) {
  return encodeURIComponent(`${namespace}/${repo}`);
}

export async function fetchGitLabPipelines(config: GitLabConfig) {
  const project = encodeProjectPath(config.namespace, config.repo);
  const data = await gitlabFetch(
    `/projects/${project}/pipelines?per_page=10&order_by=id&sort=desc`,
    config
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchGitLabVulnerabilities(config: GitLabConfig) {
  const project = encodeProjectPath(config.namespace, config.repo);
  try {
    const data = await gitlabFetch(
      `/projects/${project}/vulnerabilities?per_page=20&state=detected`,
      config
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchGitLabRepoInfo(config: GitLabConfig) {
  const project = encodeProjectPath(config.namespace, config.repo);
  const [projectInfo, commits] = await Promise.all([
    gitlabFetch(`/projects/${project}`, config),
    gitlabFetch(`/projects/${project}/repository/commits?per_page=5`, config),
  ]);
  return { project: projectInfo, commits };
}
