// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\github.ts
const GITHUB_API = "https://api.github.com";

interface FileToUpdate {
  path: string;      // e.g. "data/characters/characters.json"
  content: unknown;  // JS object/array
}

export async function updateMultipleFilesOnGithub(
  files: FileToUpdate[],
  message: string
) {
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN!;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const base = `${GITHUB_API}/repos/${owner}/${repo}`;

  // 1. Mevcut branch'in en son commit'ini ve tree SHA'sını al
  const refRes = await fetch(`${base}/git/ref/heads/${branch}`, { headers });
  if (!refRes.ok) {
    throw new Error(`Failed to get ref: ${refRes.status} ${await refRes.text()}`);
  }
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  const commitRes = await fetch(`${base}/git/commits/${latestCommitSha}`, { headers });
  if (!commitRes.ok) {
    throw new Error(`Failed to get commit: ${commitRes.status} ${await commitRes.text()}`);
  }
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 2. Her dosya için bir blob oluştur
  const blobs = await Promise.all(
    files.map(async (file) => {
      const content = Buffer.from(JSON.stringify(file.content, null, 2), "utf-8").toString(
        "base64"
      );
      const blobRes = await fetch(`${base}/git/blobs`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ content, encoding: "base64" }),
      });
      if (!blobRes.ok) {
        throw new Error(`Failed to create blob: ${blobRes.status} ${await blobRes.text()}`);
      }
      const blobData = await blobRes.json();
      return { path: file.path, sha: blobData.sha };
    })
  );

  // 3. Yeni tree oluştur (eski tree'nin üstüne, sadece değişen dosyalarla)
  const treeRes = await fetch(`${base}/git/trees`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });
  if (!treeRes.ok) {
    throw new Error(`Failed to create tree: ${treeRes.status} ${await treeRes.text()}`);
  }
  const treeData = await treeRes.json();

  // 4. Tek commit oluştur
  const newCommitRes = await fetch(`${base}/git/commits`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  });
  if (!newCommitRes.ok) {
    throw new Error(`Failed to create commit: ${newCommitRes.status} ${await newCommitRes.text()}`);
  }
  const newCommitData = await newCommitRes.json();

  // 5. Branch'i yeni commit'e işaret et
  const updateRefRes = await fetch(`${base}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommitData.sha }),
  });
  if (!updateRefRes.ok) {
    throw new Error(`Failed to update ref: ${updateRefRes.status} ${await updateRefRes.text()}`);
  }

  return newCommitData;
}