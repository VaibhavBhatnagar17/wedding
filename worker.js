/* Both addresses serve this same site. On mahakwedsvaibhav.in the front door
   is Mahak's card, so the address and the WhatsApp preview both read
   "Mahak & Vaibhav". Every other file is served as itself. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const home = path === '/' || path === '/index' || path === '/index.html';
    if (home && /mahakwedsvaibhav/i.test(url.hostname)) {
      url.pathname = '/mahak.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};
