# Securing the NewsData.io (and API Ninjas) keys with a Cloudflare Worker

Contents: [1. Problem](#1-problem) | [2. Target design](#2-target-design) | [3. Options considered](#3-options-considered) | [4. Tracker](#4-tracker) | [5. How to use the Worker](#5-how-to-use-the-worker) | [6. Verification](#6-verification) | [7. Residual risks](#7-residual-risks) | [8. Rollback](#8-rollback)

## 1. Problem

The site is static (GitHub Pages), so every file is public. Two API keys were hard-coded in client JS:

| Key | Was in | Used for |
|---|---|---|
| NewsData.io | `assets/js/main-news.js` (reused by `main-news-trending.js`) | News cards, trending, ticker, search |
| API Ninjas | `assets/js/main-facts.js` | Random facts |

Consequences:
- Anyone can read the keys from the page source or the browser's Network tab and spend your quota (free-tier limits, possible lockout or billing).
- The keys are also in git history, so deleting them from the current code does not remove them.
- The trending script also sent the NewsData key twice per request (`apikey` in `url` and `&apiKey=`).

Goal: no API key in the repo, in git going forward, or in anything the browser downloads.

## 2. Target design

```
Browser (GitHub Pages)
   |  GET /news?q=...   GET /facts
   v
Cloudflare Worker  (worker/)        <- keys stored as encrypted Worker secrets
   |  adds the key server-side
   v
newsdata.io  /  api.api-ninjas.com
```

What the Worker does (`worker/src/index.js`):
- Two fixed routes only, `/news` and `/facts`. Everything else returns 404.
- Fixed upstream parameters (`language=en,hi`, `FACTS_COUNT=4`). The client can only choose `q` (capped at 100 characters, URL-encoded by the frontend).
- Checks the `Origin` header against `ALLOWED_ORIGINS` and returns 403 otherwise. CORS headers are only sent for allowed origins.
- `GET` and `OPTIONS` only.
- Caches successful responses (news 10 min, facts 1 hour), so repeated or abusive calls hit the cache instead of your upstream quota.
- Does not cache errors, and never echoes the key.

What the frontend does:
- `assets/js/config.js` holds only the public `API_BASE_URL`. It is loaded before `main-news.js`.
- `main-news.js`, `main-news-trending.js` and `main-facts.js` call the Worker and contain no keys.

## 3. Options considered

| Option | Verdict |
|---|---|
| Keep the key in client JS, restrict by domain at the provider | Not enough alone. The `Referer` header is easy to fake, and not every plan supports it. |
| Environment variable or GitHub Actions secret injected at build time | Does not help. The built JS served to browsers still contains the key. |
| Move to a backend server (Node, Java) | Works but needs hosting and upkeep for a tiny need. |
| **Cloudflare Worker proxy (chosen)** | Free tier, no server to run, secrets are encrypted at rest, built-in caching and rate limiting, keeps the site on GitHub Pages. |
| Netlify or Vercel functions | Equivalent, but would push toward moving hosting. Fallback if Cloudflare is not an option. |

## 4. Tracker

Legend: `[x]` done, `[ ]` to do. **(you)** means it needs your Cloudflare or provider account, or your secrets, so I can't do it for you. Run all shell commands from the repo root unless a step says otherwise. Dashboard screens change over time, so menu names below are approximate.

### Phase 0 - Prerequisites (you)
- [x] 0.1 Check Node.js: `node -v`. You need v18 or newer. If it's missing, install it with `brew install node`. Done: `v24.14.1`.
- [x] 0.2 Create a free Cloudflare account at https://dash.cloudflare.com/sign-up and verify your email. No domain or credit card is needed. Done: account created and logged in to the dashboard. This does not log in the CLI, so step 3.1 (`npx wrangler login`) is still needed.
- [x] 0.3 Check Wrangler runs: `cd worker && npx wrangler --version`. The first run asks to install the package, so answer `y`. Expected: a version number such as `4.x`. Done: Wrangler `4.160.1` installed and prints its command list.

### Phase 1 - Code changes (done)
- [x] 1.1 Add `worker/` (`wrangler.toml`, `src/index.js`) with `/news` and `/facts`, origin allow-list and caching
- [x] 1.2 Add `assets/js/config.js` with the public `API_BASE_URL`, loaded before `main-news.js` in `index.html`
- [x] 1.3 Remove the hard-coded keys from `main-news.js`, `main-news-trending.js`, `main-facts.js`
- [x] 1.4 Git-ignore `worker/.dev.vars`, `worker/.wrangler/`, `worker/node_modules/`
- [x] 1.5 Update `README.md` and `CLAUDE.md`

### Phase 2 - Get new keys and store them safely (you)
Generate the new keys first. The old keys stay active until step 5.3 so the live site keeps working meanwhile. If you see abuse on them (step 2.4), revoke immediately and accept the downtime.

- [x] 2.1 **New NewsData.io key.** Done: a new key was generated and the old key was not deleted, so it is still active and still used by the live site. It must be deleted manually in step 5.3. Store the new key in step 2.3.
  1. Log in at https://newsdata.io and open the Dashboard (the page that shows "API Key").
  2. Look for a "Regenerate", "Reset" or "Create new key" action next to the key and use it. If the old key is replaced immediately and there is no option to keep both, do this step at the same moment as step 4.5 to limit downtime.
  3. If there is no regenerate option, contact NewsData.io support to request a key reset.
  4. Copy the new key (it starts with `pub_`).
- [x] 2.2 **New API Ninjas key.** Done: the key was rotated, so the old key no longer works. Facts on the live site stay broken until the Worker is deployed and the site is released (Phases 4-5). Store the new key in step 2.3.
  1. Log in at https://api-ninjas.com and open "My Account".
  2. Click "Regenerate API Key" (or the equivalent) under your API key.
  3. Copy the new key.
- [ ] 2.3 **Store both keys safely.** Use one of the options below, and never paste a key into chat, a commit, a GitHub issue or a screenshot.
  - Option A, password manager (1Password, Bitwarden, etc.): create two entries named `newsdata-api-key` and `api-ninjas-key` and paste each key into the password field.
  - Option B, macOS Keychain, no extra software. Each command prompts you for the value, so it never lands in shell history:
    ```
    security add-generic-password -a "$USER" -s newsdata-api-key -w
    security add-generic-password -a "$USER" -s api-ninjas-key -w
    ```
    To read one back later: `security find-generic-password -a "$USER" -s newsdata-api-key -w`
  - The only other places the keys should ever exist are Cloudflare secrets (Phase 4) and the git-ignored `worker/.dev.vars` (Phase 3).
- [ ] 2.4 **Check for past abuse.** On each provider dashboard, open the usage or request history. If you see traffic you didn't generate, or you're near your limit unexpectedly, someone has been using the old keys.

### Phase 3 - Run the Worker locally (you)
- [x] 3.1 **Log in to Cloudflare:** `cd worker && npx wrangler login`. A browser tab opens, so click "Allow". Check with `npx wrangler whoami`. Expected: your account email and account id. Done: logged in to Cloudflare from the CLI.
- [x] 3.2 **Create the local secrets file.** From `worker/`, run `touch .dev.vars && chmod 600 .dev.vars`, then open it in an editor and paste the new keys (one per line, no quotes): Done: `worker/.dev.vars` exists, is git-ignored and `chmod 600`.
  ```
  NEWSDATA_KEY=<paste from password manager>
  NINJAS_KEY=<paste from password manager>
  ```
  Check it is ignored by git: `git check-ignore -v worker/.dev.vars`. Expected: it prints a `.gitignore` rule. If it prints nothing, stop and fix `.gitignore` before continuing.
- [x] 3.3 **Start the Worker:** `npx wrangler dev`. Expected output includes `Ready on http://localhost:8787`. Leave it running and open a second terminal for the next steps. Done: `wrangler dev` serves on `http://localhost:8787`.
- [x] 3.4 **Test it with curl** (second terminal): Done: `/news` returned `"status":"success"`, `/facts` returned 4 facts, and a request without `Origin` returned 403.
  ```
  curl -s -H "Origin: http://localhost:8000" "http://localhost:8787/news?q=India" | head -c 300
  curl -s -H "Origin: http://localhost:8000" "http://localhost:8787/facts" | head -c 300
  curl -i "http://localhost:8787/news?q=India"
  ```
  Expected: JSON for the first two, and `HTTP/1.1 403` for the third. If you get `{"status":"error",...}` from NewsData.io, the key is wrong, so recheck `.dev.vars` and restart `wrangler dev`.
- [x] 3.5 **Point the frontend at your local Worker.** From the repo root:
  ```
  sed -i '' 's#^const API_BASE_URL = .*#const API_BASE_URL = "http://localhost:8787";#' assets/js/config.js
  ```
  Check with `cat assets/js/config.js`. Do not commit this local value (step 4.5 sets the real one).
- [x] 3.6 **Serve the site:** `python3 -m http.server 8000` (from the repo root, a third terminal), then open http://localhost:8000.
- [x] 3.7 **Check it in the browser.** Confirm news cards, trending section, ticker, search box and facts all show content. Open dev tools -> Network (filter on "localhost:8787") and confirm there is no `apikey` in any request URL or header. Dev tools -> Console should show no CORS errors.
- [x] 3.8 Stop the two servers with Ctrl+C.

### Phase 4 - Deploy to Cloudflare (you)
Run all commands from `worker/`. Notes from the local run:
- `wrangler dev` printed `self-signed certificate in certificate chain` while fetching `Request.cf`. This is harmless locally (it falls back to a placeholder). It suggests the network re-signs TLS traffic, so `secret put` and `deploy` may fail with the same error.
- If they do, export your organisation's root CA as a PEM file and run `export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem` first, or switch networks. Do not set `NODE_TLS_REJECT_UNAUTHORIZED=0`, which turns off TLS checking while you upload secrets.

- [x] 4.1 **Upload the NewsData secret:** `cd worker && npx wrangler secret put NEWSDATA_KEY`. When it shows `Enter a secret value:`, paste the key from your password manager (the input is hidden) and press Enter. Expected: `Success! Uploaded secret NEWSDATA_KEY`. The first secret upload asks `There doesn't seem to be a Worker called "facts-and-news-proxy". Do you want to create a new Worker...?`, so answer `Y`. Status: not completed. The first attempt did not create the Worker (`wrangler secret list` returned `Worker "facts-and-news-proxy" not found`), so deploy first (4.4), then upload the secrets. Secrets survive later deploys. No certificate error occurred, so the TLS note above did not apply. Done: `NEWSDATA_KEY` uploaded.
- [x] 4.2 **Upload the API Ninjas secret:** `npx wrangler secret put NINJAS_KEY`, same as above (no create-Worker prompt this time). Done: `NINJAS_KEY` uploaded.
- [x] 4.3 **Check the secret names:** `npx wrangler secret list`. Expected: both `NEWSDATA_KEY` and `NINJAS_KEY` (values are never shown). Done: `secret list` shows `NEWSDATA_KEY` and `NINJAS_KEY`.
- [x] 4.4 **Deploy:** `npx wrangler deploy`. On the first deploy it may ask you to register a `workers.dev` subdomain, so pick a name. Expected: a line like `https://facts-and-news-proxy.<your-subdomain>.workers.dev`. Copy that URL. Done: deployed as `https://facts-and-news-proxy.shubhamchouksey.workers.dev` (workers.dev subdomain `shubhamchouksey` registered). No secrets are attached yet, so the routes fail until steps 4.1 and 4.2 are done.
- [x] 4.5 **Put the URL in the frontend.** Replace `<worker-url>` with the copied URL, from the repo root: Done: `assets/js/config.js` now points at the deployed Worker URL (no trailing slash).
  ```
  sed -i '' 's#^const API_BASE_URL = .*#const API_BASE_URL = "<worker-url>";#' assets/js/config.js
  cat assets/js/config.js
  ```
  There must be no trailing slash.
- [x] 4.6 **Run the checks in [section 6](#6-verification)** against the deployed URL. Everything must pass before you continue. Done: all checks passed against the deployed Worker (news and facts 200, CORS header present for the Pages origin, 403 without or with a wrong Origin, 404 unknown path, 405 POST, no key in responses).

### Phase 5 - Release (you)
- [ ] 5.1 **Commit on a branch and open a PR** (the repo history uses PRs):
  ```
  git checkout -b secure-api-keys
  git add .gitignore CLAUDE.md README.md assets/js index.html docs worker
  git status            # confirm no .dev.vars and no localhost in config.js
  git commit -m "Move API keys behind a Cloudflare Worker proxy"
  git push -u origin secure-api-keys
  gh pr create --fill
  ```
  Then merge the PR. GitHub Pages rebuilds from `master`.
- [ ] 5.2 **Wait for Pages to rebuild** (usually 1-2 minutes). Check with `gh api repos/ShubhamChouksey123/facts-and-news-website/pages/builds/latest --jq .status`. Expected: `built`.
- [ ] 5.3 **Verify the live site, then revoke the old keys.**
  1. Open https://shubhamchouksey123.github.io/facts-and-news-website/ and hard refresh (Cmd+Shift+R).
  2. Confirm news, trending, ticker and facts load, and Network requests go to your `workers.dev` URL with no key.
  3. Only then revoke the old keys. The old NewsData.io key was not deleted when the new one was generated (step 2.1), so delete it now on the NewsData.io dashboard. The API Ninjas key was already replaced in step 2.2, so nothing is left to revoke there.
- [ ] 5.4 **Confirm no live key is left in the code:** `grep -rnE "pub_[0-9a-f]{20,}" . --include='*.js' --include='*.html' --exclude-dir=.git --exclude='*.min.js'`. Expected: no output.

### Phase 6 - Hardening (recommended)
- [ ] 6.1 **Rate-limit the Worker.** Cloudflare dashboard -> Security -> WAF -> Rate limiting rules only works on a domain you own that is on Cloudflare. It does not apply to a `workers.dev` URL. Options:
  - If you have a domain: add a custom domain to the Worker (Workers & Pages -> your worker -> Settings -> Domains & Routes), then add a rule such as "more than 60 requests per minute per IP -> block for 10 minutes".
  - If you don't: use the Workers Rate Limiting binding (see "Rate Limiting" in the Cloudflare Workers docs) so the Worker itself limits per IP. Ask me to add it to `worker/src/index.js` and `wrangler.toml`.
- [ ] 6.2 **Usage alerts.** In each provider dashboard, enable email alerts for approaching the daily or monthly limit if the option exists. Otherwise check usage weekly.
- [ ] 6.3 **Restrict the new NewsData.io key** by domain or IP if your plan offers it. Check the key settings on the dashboard. Use `shubhamchouksey123.github.io` or the Worker's egress, depending on what the feature supports.
- [ ] 6.4 **Add secret scanning.**
  - GitHub: repo -> Settings -> Code security -> enable "Secret scanning" and "Push protection".
  - Local: `brew install gitleaks`, then `gitleaks detect --source .` to scan the repo and history. Optionally add `gitleaks protect --staged` as a pre-commit hook.
- [ ] 6.5 **Optional: purge old keys from git history.** Not needed once they are revoked, and it rewrites history for everyone who cloned. If you still want it:
  ```
  brew install git-filter-repo
  cd /tmp && git clone https://github.com/ShubhamChouksey123/facts-and-news-website.git clean && cd clean
  printf '%s\n' 'literal:<old-newsdata-key>==>REMOVED' 'literal:<old-ninjas-key>==>REMOVED' > /tmp/replacements.txt
  git filter-repo --replace-text /tmp/replacements.txt
  git remote add origin https://github.com/ShubhamChouksey123/facts-and-news-website.git
  git push --force --all
  rm /tmp/replacements.txt
  ```
  Existing clones must be re-cloned afterwards.

### Later (optional)
- [ ] Fix the TODOs in `project-info.md`

## 5. Command reference

Run from `worker/`.

| Task | Command |
|---|---|
| Log in to Cloudflare (once) | `npx wrangler login` |
| Who am I logged in as | `npx wrangler whoami` |
| Run locally on `http://localhost:8787` | `npx wrangler dev` (reads keys from `worker/.dev.vars`) |
| Store a production secret | `npx wrangler secret put NEWSDATA_KEY` (same for `NINJAS_KEY`) |
| List secret names (not values) | `npx wrangler secret list` |
| Deploy | `npx wrangler deploy` |
| Tail live logs | `npx wrangler tail` |
| Delete a secret | `npx wrangler secret delete <NAME>` |

Routes:
- `GET /news?q=<query>` returns NewsData.io results (English and Hindi, default query `India`).
- `GET /facts` returns 4 random facts (4 upstream calls per cache miss, since the free API Ninjas tier returns one fact per call and rejects `limit`).

To allow another site or port, add its origin to `ALLOWED_ORIGINS` in `worker/wrangler.toml` and run `npx wrangler deploy`.

## 6. Verification

Replace `<worker-url>` with your deployed URL.

| Check | Command | Expected |
|---|---|---|
| Allowed origin works | `curl -i -H "Origin: https://shubhamchouksey123.github.io" "<worker-url>/news?q=India"` | `200`, JSON, `Access-Control-Allow-Origin` header |
| Facts work | `curl -i -H "Origin: https://shubhamchouksey123.github.io" "<worker-url>/facts"` | `200`, JSON array |
| No origin is rejected | `curl -i "<worker-url>/news?q=India"` | `403` |
| Wrong origin is rejected | `curl -i -H "Origin: https://evil.example" "<worker-url>/news?q=India"` | `403` |
| Unknown path | `curl -i -H "Origin: https://shubhamchouksey123.github.io" "<worker-url>/other"` | `404` |
| Wrong method | `curl -i -X POST -H "Origin: https://shubhamchouksey123.github.io" "<worker-url>/news"` | `405` |
| Key not in site | `grep -rnE "pub_\|apikey" assets/js index.html` (ignoring `*.min.js`) | No matches |
| Key not in browser | Live site -> dev tools -> Network | Requests go to the Worker URL, none carry a key |

## 7. Residual risks

- **The `Origin` check is not authentication.** It stops other websites from using your proxy in a browser, but a script using `curl` can send any `Origin` header. This is why caching, rate limiting (6.1) and provider alerts (6.2) matter. The proxy can only be abused for the two fixed endpoints, never to read the key.
- **Cache keyed by URL:** each distinct `q` value is a separate upstream call on a cache miss. An attacker can burn quota by varying `q`. Rate limiting (6.1) is the mitigation, but see its note about `workers.dev`. If this happens, lower `MAX_QUERY_LENGTH` or restrict `q` to a pattern.
- **Free-tier limits:** Workers free tier allows 100,000 requests per day. Hitting it makes the site show empty sections but does not expose anything.
- **Old keys in git history:** harmless once revoked (step 5.3).
- **The Worker URL is public.** That is expected. It carries no secret.

## 8. Rollback

If the Worker is down or misbehaving after release:
1. Fastest: `git revert` the release commit. This only restores the old keys in the code, and the old API Ninjas key was already rotated (step 2.2), so facts will not work after a revert, and the old NewsData.io key only works until you delete it in step 5.3. Prefer fixing the Worker (items 2 and 3) over reverting.
2. Otherwise fix the Worker and redeploy (`npx wrangler deploy`), or roll back to a previous Worker version from the Cloudflare dashboard -> Workers -> your worker -> Deployments.
3. If a new key leaks, rotate it in the provider dashboard and run `npx wrangler secret put <NAME>` with the new value. No code change or redeploy of the site is needed.
