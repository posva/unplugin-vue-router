export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  const accept = request.headers.get("Accept") || "";
  const wantsMarkdown = accept.includes("text/markdown");

  if (!wantsMarkdown || (request.method !== "GET" && request.method !== "HEAD")) {
    return next();
  }

  // directory URLs only: /docs/page/ -> /docs/page.md
  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "") + ".md";

    const mdResp = await fetch(new Request(url.toString(), request));
    if (mdResp.status !== 404) {
      const resp = new Response(mdResp.body, mdResp);
      resp.headers.set("Content-Type", "text/markdown; charset=utf-8");
      resp.headers.set("Cache-Control", "no-store");
      return resp;
    }
  }

  return next();
}

