// functions/_middleware.js  (or functions/docs/_middleware.js to scope it)
export async function onRequest(context) {
  const { request, next } = context;

  // Only negotiate on GET/HEAD so you don't accidentally affect form posts, etc.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  const accept = request.headers.get("Accept") || "";
  if (!accept.includes("text/markdown")) {
    return next();
  }

  const url = new URL(request.url);

  // Cloudflare Pages redirects *.html -> clean URL, so handle clean URLs primarily.
  // Also avoid rewriting obvious static assets.
  const p = url.pathname;

  // Skip root and common asset/file requests
  if (
    p === "/" ||
    p.startsWith("/assets/") ||
    p.startsWith("/static/") ||
    p.startsWith("/images/") ||
    p.startsWith("/img/") ||
    p.startsWith("/favicon") ||
    /\.[a-zA-Z0-9]+$/.test(p) // has an extension already (e.g. .js, .css, .png, .xml)
  ) {
    return next();
  }

  // Normalize: remove trailing slash (except "/")
  let base = p.endsWith("/") ? p.slice(0, -1) : p;

  // Just in case someone hits .html (they'll be redirected by Pages anyway)
  if (base.endsWith(".html")) {
    base = base.slice(0, -5);
  }

  // Map clean URL -> flat markdown file
  // /introduction      -> /introduction.md
  // /docs/page/        -> /docs/page.md
  const mdPath = `${base}.md`;

  const mdUrl = new URL(url.toString());
  mdUrl.pathname = mdPath;

  // Try markdown first
  const mdResp = await fetch(new Request(mdUrl.toString(), request));

  // If it doesn't exist, fall back to the normal HTML handling
  if (mdResp.status === 404) {
    return next();
  }

  // Return markdown with a helpful content type
  const resp = new Response(mdResp.body, mdResp);
  resp.headers.set("Content-Type", "text/markdown; charset=utf-8");

  // Safe default to avoid HTML/MD cache mixing problems
  resp.headers.set("Cache-Control", "no-store");

  return resp;
}
