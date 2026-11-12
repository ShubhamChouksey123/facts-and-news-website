# Daily New and Random Facts Website
## Overview
Welcome to my news and facts website repository! This digital canvas is a testament to my journey as a software engineer, where I showcase my skills, projects, and experiences. Crafted with care, it's tailored to offer visitors profound insights into my expertise and creative endeavors.

## Features
Dive into a world of random facts.
Explore a curated collection of the latest trending news.
Utilize a convenient search bar to find news related to specific topics.
Navigate through distinct categories including travel, photography, style, food & drinks, and culture.

## Live Site
Hosted on GitHub Pages: https://shubhamchouksey123.github.io/facts-and-news-website/

## Data Sources
The frontend is fully static. The browser calls a small Cloudflare Worker (`worker/`, deployed at `https://facts-and-news-proxy.shubhamchouksey.workers.dev`), which holds the API keys as secrets and forwards requests to these APIs:

```
Browser (GitHub Pages) -> Cloudflare Worker (keys as secrets) -> NewsData.io / API Ninjas
```

| Content | Provider | Worker route | Upstream | Script |
|---|---|---|---|---|
| News cards, trending news, ticker, search and category results | [NewsData.io](https://newsdata.io/) | `/news?q=<query>` | `https://newsdata.io/api/1/news` (English and Hindi, default query `India`) | `assets/js/main-news.js`, `assets/js/main-news-trending.js` |
| Random facts | [API Ninjas Facts API](https://api-ninjas.com/api/facts) | `/facts` | `https://api.api-ninjas.com/v1/facts` (called 4 times, as the free tier returns one fact per call) | `assets/js/main-facts.js` |

The Worker only answers requests from the allowed origins in `worker/wrangler.toml` and caches responses (news 10 min, facts 1 hour) to protect the free-tier quotas. The Worker's public URL is set in `assets/js/config.js`. The facts route makes 4 upstream calls per cache miss, because the free API Ninjas tier returns one fact per call.

## Security
API keys are never stored in the repo or in browser-visible code, because the Worker adds them server-side. The step-by-step guide, verification checks and rollback plan are in [docs/cloudflare-workers.md](docs/cloudflare-workers.md). Never commit `worker/.dev.vars`, which holds local keys and is git-ignored.

## API Key Setup
Only needed if you fork the project or want to change the Worker, since the live site already uses the deployed Worker. Requires Node.js 18+ and a free Cloudflare account. No keys are stored in the repo. See [docs/cloudflare-workers.md](docs/cloudflare-workers.md) for details.

1. Get keys from NewsData.io and API Ninjas.
2. Local dev: create `worker/.dev.vars` (git-ignored) containing `NEWSDATA_KEY=...` and `NINJAS_KEY=...`, run `cd worker && npx wrangler dev`, and set `API_BASE_URL` in `assets/js/config.js` to `http://localhost:8787`. Change it back before committing.
3. Production: `cd worker && npx wrangler login`, then `npx wrangler deploy`, then `npx wrangler secret put NEWSDATA_KEY` and the same for `NINJAS_KEY`. Set `API_BASE_URL` in `assets/js/config.js` to the printed `*.workers.dev` URL. If you host the site on another domain, add it to `ALLOWED_ORIGINS` in `worker/wrangler.toml` first.

## Getting Started
Visit the live site above. To run it locally, clone the repo and serve the root with `python3 -m http.server 8000`, then open `http://localhost:8000`. There is no build step. The page uses the deployed Worker, which allows requests from `localhost:8000`, so you don't need your own API keys just to browse it.

## Connect and Collaborate
Open to new opportunities, collaborations, and enriching discussions, I invite you to connect with me. Whether you have a project in mind, an idea to explore, or simply wish to share insights, please don't hesitate to reach out. You can contact me via:

- Email: shubhamchouksey1998@gmail.com
- Phone: +91 9479917417

I'm enthusiastic about embarking on new journeys and crafting innovative solutions together. Thank you for visiting my daily news and random facts website, and I eagerly anticipate connecting with you!

## License and Attribution
- This project operates under an open-source model and is available under the MIT License.
- Certain elements of this repository are copyrighted by [Colorlib](https://colorlib.com/wp/templates/).
The HTML design template is sourced from [ThemeWagon](https://themewagon.com/themes/free-bootstrap-4-html5-news-portal-website-template-aznews/), and is available under the free tier plan of the website.
- This project is not intended for commercial purposes.