# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A static news + random-facts website built on the Colorlib/ThemeWagon "AZ News" Bootstrap template, hosted on GitHub Pages (https://shubhamchouksey123.github.io/facts-and-news-website/, served from `master`). The frontend has no build system, package manager, linter, or test suite. The only code that needs tooling is the Cloudflare Worker in `worker/` (run through `npx wrangler`).

To develop the frontend, serve the repo root with any static server (e.g. `python3 -m http.server 8000`) — `main-date-other.js` scrolls to `location.hash`, so serving over HTTP is preferable to opening the file. By default it talks to the deployed Worker, which allows `http://localhost:8000`, so no local Worker is needed unless you are changing the Worker.

`project-info.md` holds the TODO list (trending news at top, incorrect weather for India).

## Architecture

- **Pages** are standalone HTML files at the repo root (`index.html`, `about.html`, `blog.html`, `categori.html`, `contact.html`, `details.html`, `latest_news.html`, `single-blog.html`, `elements.html`). There are no includes or templating, so the header, footer and script block are duplicated per page — shared changes must be made in every file. `main.html` is just the template's copyright placeholder.
- **Dynamic content lives only in `index.html`**, populated client-side by scripts at the bottom of the page. They rely on load order and shared globals:
  - `assets/js/config.js` defines `API_BASE_URL` (the Cloudflare Worker URL) and must load before the scripts below.
  - `assets/js/main-news.js` defines the global `url` (`API_BASE_URL + "/news?q="`) and fills the news cards (`#container-news-card`) via `fetchNews(query)`.
  - `assets/js/main-news-trending.js` **reuses `url` from `main-news.js`**, so it must be loaded after it. It fills the trending section and moving ticker titles.
  - `assets/js/main-facts.js` fetches facts from the Worker's `/facts` route (4 facts) and fills the facts slots (using indices 10–13).
  - `assets/js/main-date-other.js` sets the date (`#today-date`) and scrolls to the URL hash target.
- **`worker/`** is the Cloudflare Worker proxy (`facts-and-news-proxy`, deployed at `https://facts-and-news-proxy.shubhamchouksey.workers.dev`). It holds the newsdata.io and api-ninjas keys as secrets (`NEWSDATA_KEY`, `NINJAS_KEY`) and exposes `GET /news?q=` and `GET /facts`. Responses are cached (news 10 min, facts 1 hour), and requests whose `Origin` is not in `ALLOWED_ORIGINS` get a 403. The free API Ninjas tier rejects `limit` and returns one fact per call, so `/facts` makes 4 upstream calls per cache miss. Its local secrets go in the git-ignored `worker/.dev.vars`. Commands run from `worker/`: `npx wrangler dev` (serves `http://localhost:8787`), `npx wrangler deploy`, `npx wrangler secret put <NAME>`. See `docs/cloudflare-workers.md` for the full guide, verification checks and rollout tracker.
- Search and category keywords call `fetchNews(keyword)` and `fetchNewsForTrending(keyword)` (see the bottom of `main-news.js` and `main-news-trending.js`). The DOM ids they write to must exist in `index.html`.
- Everything else in `assets/js` is third-party template plugins (jQuery 1.12, slick, owl, etc.). `assets/css/style-news.css` holds site-specific styles; the other CSS files are template or vendor styles. `assets/scss` is the template's SCSS source, with no compile step in the repo.
- `contact_process.php` is the template's mail handler and is unmodified. It has a hard-coded recipient and an undefined `$csubject`.

## Gotchas

- Never put API keys in client JS; add new upstream calls as Worker routes instead. The earlier keys were exposed in git history and have been rotated.
- `assets/js/config.js` must hold the deployed Worker URL when committed. If you point it at `http://localhost:8787` to test a local Worker, change it back before committing.
- The Worker rejects requests whose `Origin` is not in `ALLOWED_ORIGINS` (`worker/wrangler.toml`), so a new hosting domain or port must be added there and redeployed. The `Origin` check is not authentication (non-browser clients can fake it), so the Worker also relies on caching.
- `wrangler dev` prints a `self-signed certificate in certificate chain` warning on this network. It is harmless locally.
- Never print or read `worker/.dev.vars`, since it holds live keys.
- Free-tier rate limits and the Worker cache affect what you see when testing, so repeated identical requests return cached data.
- Template copyright footers must stay (see `main.html`).
