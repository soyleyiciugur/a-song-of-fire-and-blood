# Content Sync — setup instructions

## 1. Add the files

Drop the three files into your project:

- `app/admin/content-sync/page.tsx`
- `app/admin/content-sync/content-sync.module.css`
- `app/api/admin/content-sync/route.ts`

## 2. Add API keys to .env.local

Add however many keys you want to rotate between (up to 5):

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_API_KEY_2=sk-ant-...
ANTHROPIC_API_KEY_3=sk-ant-...
ANTHROPIC_API_KEY_4=sk-ant-...
ANTHROPIC_API_KEY_5=sk-ant-...
```

Only `ANTHROPIC_API_KEY` is required. The others are optional — the switcher
on the page will show all 5 buttons but keys 2–5 will return an error if
they aren't configured in .env.local.

## 3. Add to your admin sidebar

In your admin sidebar nav (wherever your other admin links live), add:

```tsx
{ href: "/admin/content-sync", label: "Content sync" }
```

Or as JSX:
```tsx
<Link href="/admin/content-sync">Content sync</Link>
```

## 4. Usage

1. Paste your chapter prose into the text area
2. Optionally paste your existing JSON files (characters.json, houses.json, etc.)
   as context so the AI knows what already exists vs. what's new
3. Select what to detect
4. Pick an API key slot if your primary key is rate-limited
5. Hit Analyze
6. Accept or reject individual changes
7. Copy the final JSON diff and apply it to your data files manually,
   or paste into your admin panel editors
