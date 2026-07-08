const GITHUB_API = "https://api.github.com";

interface GithubFileUpdateOptions {
  path: string;        // e.g. "data/characters/characters.json"
  content: unknown;    // JS object/array — will be JSON.stringified
  message: string;      // commit message
}

export async function updateJsonFileOnGithub({
  path,
  content,
  message,
}: GithubFileUpdateOptions) {
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN!;

  const apiUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  // 1. Get current file SHA (required by GitHub to update a file)
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers });
  if (!getRes.ok) {
    throw new Error(`Failed to fetch current file: ${getRes.status} ${await getRes.text()}`);
  }
  const currentFile = await getRes.json();
  const sha = currentFile.sha;

  // 2. Encode new content as base64
  const jsonString = JSON.stringify(content, null, 2);
  const base64Content = Buffer.from(jsonString, "utf-8").toString("base64");

  // 3. Push the update
  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: base64Content,
      sha,
      branch,
    }),
  });

  if (!putRes.ok) {
    throw new Error(`Failed to update file: ${putRes.status} ${await putRes.text()}`);
  }

  return putRes.json();
}