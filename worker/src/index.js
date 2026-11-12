// Proxy that keeps the newsdata.io and api-ninjas keys server-side.
//   GET /news?q=<query>  -> newsdata.io
//   GET /facts           -> api-ninjas facts

const NEWS_TTL_SECONDS = 600;
// Free-tier API Ninjas returns one fact per call and rejects `limit`, so each cache miss costs FACTS_COUNT upstream calls.
const FACTS_TTL_SECONDS = 3600;
const FACTS_COUNT = 4;
const MAX_QUERY_LENGTH = 100;

export default {
	async fetch(request, env, ctx) {
		const origin = request.headers.get("Origin");
		const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
		const corsOrigin = allowed.includes(origin) ? origin : null;

		if (request.method === "OPTIONS") {
			return respond(null, 204, corsOrigin);
		}
		if (request.method !== "GET") {
			return respond("Method not allowed", 405, corsOrigin);
		}
		// Browsers always send Origin on cross-origin fetches; reject others so the quota isn't an open relay.
		if (!corsOrigin) {
			return respond("Forbidden", 403, null);
		}

		const { pathname, searchParams } = new URL(request.url);

		if (pathname === "/news") {
			const q = (searchParams.get("q") || "India").slice(0, MAX_QUERY_LENGTH);
			const upstream =
				"https://newsdata.io/api/1/news?" +
				new URLSearchParams({ apikey: env.NEWSDATA_KEY, language: "en,hi", q });
			return cached(request, ctx, corsOrigin, NEWS_TTL_SECONDS, () => fetch(upstream));
		}

		if (pathname === "/facts") {
			return cached(request, ctx, corsOrigin, FACTS_TTL_SECONDS, () => fetchFacts(env.NINJAS_KEY));
		}

		return respond("Not found", 404, corsOrigin);
	},
};

async function fetchFacts(key) {
	const responses = await Promise.all(
		Array.from({ length: FACTS_COUNT }, () =>
			fetch("https://api.api-ninjas.com/v1/facts", { headers: { "X-Api-Key": key } }),
		),
	);
	const failed = responses.find((r) => !r.ok);
	if (failed) return failed;

	const facts = (await Promise.all(responses.map((r) => r.json()))).flat();
	return new Response(JSON.stringify(facts), {
		headers: { "Content-Type": "application/json" },
	});
}

async function cached(request, ctx, corsOrigin, ttl, fetchUpstream) {
	// Key on the URL only so the cache is shared across allowed origins.
	const cacheKey = new Request(request.url, { method: "GET" });
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (!response) {
		const upstream = await fetchUpstream();
		response = new Response(upstream.body, upstream);
		if (upstream.ok) {
			response.headers.set("Cache-Control", `public, max-age=${ttl}`);
			ctx.waitUntil(cache.put(cacheKey, response.clone()));
		}
	}

	const out = new Response(response.body, response);
	out.headers.set("Access-Control-Allow-Origin", corsOrigin);
	out.headers.set("Vary", "Origin");
	return out;
}

function respond(body, status, corsOrigin) {
	const headers = { Vary: "Origin" };
	if (corsOrigin) {
		headers["Access-Control-Allow-Origin"] = corsOrigin;
		headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
	}
	return new Response(body, { status, headers });
}
