// backend/src/services/githubService.ts
import fetch from 'node-fetch';

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
}

interface ProcessedRepo {
  name: string;
  description: string;
  url: string;
  language: string | null;
  stargazers_count: number;
}

export async function fetchGitHubRepos(username: string): Promise<ProcessedRepo[]> {
  try {
    const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
    const response = await fetch(url, { 
      headers: { "User-Agent": "ai-career-agent" } 
    });

    if (!response.ok) {
      throw new Error("Invalid GitHub username or API error");
    }

    const repos = await response.json() as GitHubRepo[];
    
    return repos.map((repo: GitHubRepo) => ({
      name: repo.name,
      description: repo.description || "No description",
      url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count || 0,
    }));
    
  } catch (error) {
    console.error('GitHub API error:', error);
    throw new Error(`Failed to fetch GitHub repos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}