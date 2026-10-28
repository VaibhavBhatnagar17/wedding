/* Which family's card this is: 'groom' (Vaibhav's family) or 'bride'
   (Mahak's). Each family shares its own address, and the card names its own
   child first, shows that family's part in each ceremony and sends replies to
   that family. Decided once, before anything renders, in this order:

     <html data-side="bride">            mahak.html, generated from index.html
     ?side=bride or ?side=groom          for testing either card anywhere
     the address                         mahakwedsvaibhav.in or vaibhavwedsmahak.in
     otherwise                           Vaibhav's family's card

   Nothing is remembered between visits, so opening one family's card never
   changes what the other family's address shows. */
window.W = window.W || {};

(function (W) {
  'use strict';

  function pick() {
    const root = typeof document !== 'undefined' && document.documentElement;
    const fixed = root && root.getAttribute && root.getAttribute('data-side');
    if (fixed === 'bride' || fixed === 'groom') return fixed;
    if (typeof location === 'undefined') return 'groom';
    const q = /[?&]side=(groom|bride)\b/.exec(location.search || '');
    if (q) return q[1];
    if (/mahakwedsvaibhav/i.test(location.hostname || '')) return 'bride';
    return 'groom';
  }

  const side = pick();
  if (typeof document !== 'undefined' && document.documentElement && document.documentElement.setAttribute) {
    document.documentElement.setAttribute('data-side', side);
  }

  W.side = side;
})(window.W);
