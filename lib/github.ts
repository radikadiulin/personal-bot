export async function triggerScraper(): Promise<void> {
  const token = process.env.GITHUB_TOKEN!;
  const repo = process.env.GITHUB_REPO!;
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/job-scraper.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { force: "true" } }),
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub dispatch failed: ${res.status}`);
  }
}
