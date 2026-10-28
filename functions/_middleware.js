/* Cloudflare Pages only (GitHub Pages ignores this folder). Both addresses
   serve the same site; on mahakwedsvaibhav.in the home page is Mahak's
   family's card, mahak.html, so the address and the WhatsApp preview both
   read "Mahak & Vaibhav". Pages serves mahak.html at /mahak. */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const home = url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/index';
  if (home && /mahakwedsvaibhav/i.test(url.hostname)) {
    return context.env.ASSETS.fetch(new URL('/mahak', url));
  }
  return context.next();
}
