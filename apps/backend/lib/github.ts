import axios from "axios";

export type GithubRepo = {
  description: string | null;
  name: string;
  full_name: string;
  stargazers_count: number;
  language: string | null;
  html_url: string;
};

function getProxyConfig() {
  const proxyUrl = process.env.PROXY_URL;
  if (!proxyUrl) return undefined;

  const parsed = new URL(proxyUrl);
  return {
    protocol: parsed.protocol.replace(":", ""),
    host: parsed.hostname,
    port: Number(parsed.port) || (parsed.protocol === "https:" ? 443 : 80),
    auth: parsed.username
      ? {
          username: decodeURIComponent(parsed.username),
          password: decodeURIComponent(parsed.password),
        }
      : undefined,
  };
}

export async function fetchGithubRepos(username: string): Promise<GithubRepo[]> {
  const token = process.env.GITHUB_TOKEN;

  const response = await axios.get<GithubRepo[]>(`https://api.github.com/users/${username}/repos`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    proxy: getProxyConfig(),
    params: {
      per_page: 100,
      sort: "updated",
    },
  });

  return response.data;
}

export function toGithubRepoSummary(repos: GithubRepo[]) {
  return repos.map((repo) => ({
    description: repo.description,
    name: repo.name,
    fullName: repo.full_name,
    starCount: repo.stargazers_count,
    language: repo.language,
    url: repo.html_url,
  }));
}
