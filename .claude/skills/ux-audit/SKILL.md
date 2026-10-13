---
name: ux-audit
description: Deploy, update and extend the Laws of UX Audit tool (static page + Vercel functions + Upstash Redis report library) on GitHub and Vercel, add or tune rules, or run a Laws-of-UX heuristic audit directly on supplied HTML. Use for /ux-audit, "deploy the ux audit", "add a rule", "audit this page".
---

# Laws of UX Audit

`public/index.html` (app), `api/ai.js` (Claude, image input), `api/store.js` (Redis hash `reports`).

## Modes
1. **Audit directly** — the user pastes HTML or copy. Apply the rubric in the page: run the measurable checks in `rules()` by hand (count nav links, CTAs, fields, long paragraphs, scripts) and judge the rest against `LAWS`. Give verdict, evidence and a testable fix per law, then the five fixes to do first. Never invent elements that are not in the HTML.
2. **Deploy** — first time.
3. **Update** — add a measured rule, change thresholds, change the reviewer prompt or report layout; verify; redeploy.

Prerequisites for 2 and 3: `gh auth status`, `vercel whoami`, `ANTHROPIC_API_KEY`. If any is missing, give the exact fix and stop.

## Deploy
1. `npm install`; verify (below).
2. `git init && git add -A && git commit -m "Laws of UX audit"` then `gh repo create ux-laws-audit --public --source=. --push`.
3. `vercel --yes`; `printf '%s' "$ANTHROPIC_API_KEY" | vercel env add ANTHROPIC_API_KEY production`.
4. Saved reports need Redis: ask the user to open the Vercel dashboard → project → Storage → Create Database → **Upstash for Redis** → Connect. Without it the library resets on each cold start; audits and downloads still work. Wait for confirmation, then `vercel env pull .env.local` to check.
5. `vercel --prod --yes`; add the URL to README; commit; push.
6. Smoke test: open the URL, Load sample page, Audit; the reviewer pass should complete and the Example layouts panel appear. Save report, reload, confirm it is listed. Download .html and open the file.
7. Report live URL and repo URL.

## Where things live
- Rubric: `LAWS` array (id, name, group, def). The rubric panel and the reviewer prompt read from it.
- Measured rules: `rules(m, goal, device)` returns `{verdict, evidence, fix}` per law id; `measure(src)` computes the facts. Add a rule = add a line to `rules()` keyed by law id; it overrides the reviewer for that law unless its verdict is `warn` or `na`.
- Reviewer prompt: inside `review()`. Keep "Return ONLY JSON" and the `top[].before/after` wireframe schema.
- Wireframes: `wire(spec, device)` draws SVG from `{blocks:[{type,label,emphasis,size,problem}]}`.
- Report file: `reportHtml()`.
- Runtime shim (first `<script>`): routes `sample`, `db`, `downloads` to the API outside claude.ai. Do not remove.

## Verify
```
node -e 'const s=require("fs").readFileSync("public/index.html","utf8");const m=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)];require("fs").writeFileSync("/tmp/ux.js",m.map(x=>x[1]).join("\n"))' && node --check /tmp/ux.js
```
Then `npx vercel dev`, Load sample page, Audit, Download.

## Demo notes
Run it on the hiring company's landing page HTML (View Source, copy, paste) with a screenshot attached. Lead with the fix-first list and one before/after sketch, and say plainly that it is a heuristic evaluation to prioritise tests, not a substitute for user research.
