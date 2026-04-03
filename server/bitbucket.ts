interface BitbucketConfig {
  workspace: string;
  repo: string;
  username: string;
  appPassword: string;
}

let bitbucketConfig: BitbucketConfig | null = null;

export function setBitbucketConfig(config: BitbucketConfig) {
  bitbucketConfig = config;
}

export function getBitbucketConfig(): BitbucketConfig | null {
  return bitbucketConfig;
}

export function clearBitbucketConfig() {
  bitbucketConfig = null;
}

async function bitbucketFetch(path: string, config: BitbucketConfig) {
  const credentials = Buffer.from(`${config.username}:${config.appPassword}`).toString("base64");
  const res = await fetch(`https://api.bitbucket.org/2.0${path}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bitbucket API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function fetchBitbucketPipelines(config: BitbucketConfig) {
  const data = await bitbucketFetch(
    `/repositories/${config.workspace}/${config.repo}/pipelines/?sort=-created_on&pagelen=10`,
    config
  );
  return data.values || [];
}

export async function fetchBitbucketRepoInfo(config: BitbucketConfig) {
  const [repo, commits] = await Promise.all([
    bitbucketFetch(`/repositories/${config.workspace}/${config.repo}`, config),
    bitbucketFetch(
      `/repositories/${config.workspace}/${config.repo}/commits?pagelen=5`,
      config
    ),
  ]);
  return { repo, commits: commits.values || [] };
}

export async function fetchBitbucketSecurityReports(config: BitbucketConfig) {
  try {
    const data = await bitbucketFetch(
      `/repositories/${config.workspace}/${config.repo}/reports?pagelen=20`,
      config
    );
    const reports = (data.values || []).filter(
      (r: any) => r.report_type === "SECURITY"
    );
    return reports;
  } catch {
    return [];
  }
}
