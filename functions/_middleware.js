/* Kept for a Pages-style host. The live site is a Cloudflare Worker and
   uses worker.js, which does the same thing. GitHub Pages ignores both. */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const home = url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/index';
  if (home && /mahakwedsvaibhav/i.test(url.hostname)) {
    url.pathname = '/mahak.html';
    return context.env.ASSETS.fetch(new Request(url, context.request));
  }
  return context.next();
}
