# Laws of UX Audit

Upload or paste a page's HTML (plus optional screenshots) and get a heuristic evaluation against the 30 Laws of UX (lawsofux.com, Jon Yablonski). A deterministic pass measures what can be measured on the DOM; a reviewer pass asks Claude to judge the rest with the laws as the rubric and the measured numbers as facts it may not contradict. Output: score, fix-first list, before/after wireframe sketches, every law with verdict, evidence and a testable fix; save to a shared library, download as a standalone HTML report, or copy as Markdown.

`public/index.html` is the app. `api/ai.js` calls Claude (with image input). `api/store.js` keeps the report library in Upstash Redis.

## Run locally
```
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY
npx vercel dev
```
## Deploy
See `.claude/skills/ux-audit/SKILL.md`. Live: _add URL after deploy_
