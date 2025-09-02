// backend/src/services/githubService.ts
import fetch from "node-fetch";

export async function fetchGitHubRepos(username: string) {
  const url = `https://api.github.com/users/${username}/repos?sort=updated`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Invalid GitHub username or API error");
  }

  const repos = await response.json();
  return repos.map((repo: any) => ({
    name: repo.name,
    description: repo.description || "No description",
    url: repo.html_url,
    language: repo.language
  }));
}
