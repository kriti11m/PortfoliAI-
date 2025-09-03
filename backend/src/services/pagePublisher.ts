import { Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO!; // e.g. "your-username/ai-career-portfolio-pages"
const GITHUB_USERNAME = process.env.GITHUB_USERNAME!; // your github username

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export class PagesPublisher {
    static async publishFile(filePath: string, content: string, message: string) {
        try {
            // Validate environment variables
            if (!GITHUB_TOKEN || !GITHUB_REPO || !GITHUB_USERNAME) {
                throw new Error("Missing required environment variables: GITHUB_TOKEN, GITHUB_REPO, or GITHUB_USERNAME");
            }

            // 🔥 GitHub needs content as Base64
            const encodedContent = Buffer.from(content).toString("base64");

            // Split repo into owner/repo with validation
            const repoParts = GITHUB_REPO.split("/");
            let owner: string, repo: string;

            if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
                // Fallback: use GITHUB_USERNAME if GITHUB_REPO doesn't contain owner
                owner = GITHUB_USERNAME;
                repo = GITHUB_REPO.includes("/") ? repoParts[1] : GITHUB_REPO;
                console.log(`Using fallback: owner=${owner}, repo=${repo}`);
            } else {
                [owner, repo] = repoParts;
            }

            // Ensure we have valid owner and repo
            if (!owner || !repo) {
                throw new Error(`Invalid repository configuration. GITHUB_REPO should be in format "username/repository-name", got: "${GITHUB_REPO}"`);
            }

            console.log(`Publishing to: ${owner}/${repo} at path: ${filePath}`);

            // Check if file already exists → get sha
            let sha: string | undefined;
            try {
                const { data } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: filePath,
                });
                if ("sha" in data) sha = data.sha;
            } catch (err) {
                // File doesn’t exist yet → ignore
                sha = undefined;
            }

            // Commit file
            await octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: filePath,
                message,
                content: encodedContent,
                sha,
            });

            console.log(`✅ Published ${filePath} to GitHub Pages repo.`);
            return `https://${owner}.github.io/${repo}/${filePath}`;
        } catch (error: any) {
            console.error("❌ Error publishing to GitHub:", error.message);
            throw error;
        }
    }
}
