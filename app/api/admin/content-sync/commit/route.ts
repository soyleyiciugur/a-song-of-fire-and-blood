// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\api\admin\content-sync\commit\route.ts

import { NextRequest, NextResponse } from "next/server";

function resolveGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || undefined;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { repo, branch = "main", path, content, message } = body as {
    repo?: string;
    branch?: string;
    path?: string;
    content?: string;
    message?: string;
  };

  if (!repo || !path || content == null) {
    return NextResponse.json(
      { error: "repo, path, and content are required." },
      { status: 400 }
    );
  }

  const token = resolveGithubToken();
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN is not configured in .env.local. A token with write access to the repo is required to push changes." },
      { status: 400 }
    );
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  try {
    // 1. Look up the file's current sha (required by GitHub to update an existing file).
    // If the file doesn't exist yet, we proceed without a sha (creates a new file).
    let sha: string | undefined;
    const existing = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
      headers,
      cache: "no-store",
    });
    if (existing.ok) {
      const existingData = await existing.json();
      sha = existingData.sha;
    } else if (existing.status !== 404) {
      const err = await existing.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to read current file: ${err.message ?? existing.statusText}` },
        { status: existing.status }
      );
    }

    // 2. Commit the new content.
    const commitRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: message || `content-sync: update ${path}`,
        content: Buffer.from(content, "utf-8").toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    const commitData = await commitRes.json();

    if (!commitRes.ok) {
      return NextResponse.json(
        { error: commitData.message ?? "GitHub commit failed" },
        { status: commitRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      commitUrl: commitData.commit?.html_url,
      contentUrl: commitData.content?.html_url,
      sha: commitData.content?.sha,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}