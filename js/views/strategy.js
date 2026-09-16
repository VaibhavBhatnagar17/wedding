/* Strategy, risks and the RSVP inbox. */
window.W = window.W || {}; W.views = W.views || {};

(function (W) {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;

  /* ================= STRATEGY ================= */

  W.views.strategy = function () {
    const wrap = el('div');

    wrap.appendChild(UI.pageHead('Strategy',
      'The reasoning behind every number in this console. Read this once properly — it is what lets you say no to things in December without renegotiating the whole plan.'));

    wrap.appendChild(UI.panel('The binding constraint', {}, [
      el('p', { style: 'font-size:15px', html:
        '<strong>1,130 meal covers.</strong> A hundred and eighty guests across three functions plus 650 at the reception. ' +
        'Even at a lean ₹700 a plate that is ₹10 lakh — half your budget — before a single flower is bought. ' +
        'Every other decision in this plan follows from that one number.' }),
      el('p', { html:
        'Which means the levers that actually move the needle are: how many covers you serve, what you pay per cover, ' +
        'and whether you are paying for rooms. Décor, flowers and outfits feel like the big decisions but they are ' +
        'less than a fifth of the budget between them. Do not spend your energy there.' })
    ]));

    wrap.appendChild(UI.panel('Three structural choices', {}, [
      el('div', { class: 'qa' }, [
        el('b', { text: 'The venue must be a garden or mid-tier resort, not a palace' }),
        el('span', { html: 'A luxury property starts at ₹1 crore for this size. A premium resort runs ₹35–70 lakh. Your tier is a heritage or mid-resort with a 700+ lawn, or a marriage garden that permits your own caterer — where ₹650–800 a plate is genuinely achievable at volume. You lose a brand name; you keep the Aravalli backdrop and the lake light.' })
      ]),
      el('div', { class: 'qa' }, [
        el('b', { text: 'Guest rooms are blocked, not bought' }),
        el('span', { html: 'Fifty-two rooms for two nights is ₹7.3 lakh on its own. Standard destination practice: negotiate a block rate, guests pay their own, you cover immediate family and VIPs. This plan budgets ten host-paid rooms. <strong>Doubling couples up, and putting each elderly parent in with the family who care for them, is what takes the block from 73 rooms to 52</strong> — but four adults need a room with two double beds, not two twins, so that count has to be confirmed in writing before you sign.' })
      ]),
      el('div', { class: 'qa' }, [
        el('b', { text: 'The engagement merges into the sangeet evening' }),
        el('span', { html: 'A standalone engagement means another dinner for 285, another décor setup and another venue slot — about ₹2.6 lakh. A 30-minute ring ceremony at 19:00 on the sangeet stage is the single biggest saving available to you, and it paces the night better than two separate evenings would.' })
      ])
    ]));

    wrap.appendChild(UI.panel('Why 1–2 February is in your favour', {}, [
      el('p', { html:
        '1 February 2027 is a <strong>Monday</strong>, the 2nd a <strong>Tuesday</strong>. Weekday weddings in Udaipur price ' +
        '10–15% below Saturday and Sunday, and the good vendors are still available. On a budget this tight that is worth ' +
        'about ₹1.2 lakh. <strong>Do not move it to a weekend.</strong>' }),
      el('p', { html:
        'February is peak season regardless, so book early. Days run 25–27°C, nights 10–12°C, sunrise around 07:05 and ' +
        '<strong>sunset at 18:10</strong>. Two consequences are already built into the schedule: outdoor daytime functions ' +
        'wrap by 17:30, and both evenings need patio heaters and a shawl favour.' }),
      el('div', { class: 'callout', html:
        '<b>Verify with your pandit and a 2027 panchang:</b> whether 2 February sits in a shubh vivah muhurat window, and whether ' +
        'Basant Panchami (around 11 February 2027) or another abooj muhurat falls close enough to cluster vendor bookings. ' +
        'If 1–2 February turns out to be a heavy muhurat date, expect +15% on rates and book fourteen months out.' })
    ]));

    /* cuts */
    const cutTotal = U.sum(D.cuts, function (c) { return c.saving; });
    wrap.appendChild(UI.panel('Every cut, with its saving', {
      sub: 'About ' + U.lakh(cutTotal) + ' against a conventionally planned wedding of this size',
      flush: true
    }, UI.table([
      { key: 'decision', label: 'Decision' },
      { key: 'saving', label: 'Saves', num: true, render: function (r) { return el('strong', { text: U.inr(r.saving) }); } }
    ], D.cuts, { footer: [el('td', { text: 'Total' }), el('td', { class: 'num', text: U.inr(cutTotal) })] })));

    wrap.appendChild(UI.panel('Do not cut these, at any point', {}, el('ul', { class: 'ul-clean' },
      D.protect.map(function (p) { return el('li', { class: 'yes', text: p }); }))));

    /* décor playbook */
    wrap.appendChild(UI.panel('The décor playbook', {
      sub: '₹2 lakh across four setups is tight. This is how it is done.'
    }, el('ul', { class: 'ul-clean' }, [
      el('li', { text: 'Spend on ceiling, stage and entry. A camera sees nothing else — the far corners of a lawn are wasted money.' }),
      el('li', { text: 'Marigold runs ₹40–60 a kilo in February; orchids are ₹90 a stem. Go 80% marigold, rose, carnation, rajnigandha and jasmine. Zero imported flowers.' }),
      el('li', { text: 'Use the venue\u2019s in-house or preferred decorator — 20–25% cheaper, no outside-vendor entry fee, and they already know the property\u2019s rigging points.' }),
      el('li', { text: 'Rent, never build: LED wall, moving heads, low seating, cold pyro.' }),
      el('li', { text: 'Reuse across functions. The haldi\u2019s cane and umbrella props become the reception photo corner; the sangeet\u2019s fairy lights become the reception ceiling.' }),
      el('li', { text: 'One palette per day, not one per function. Two setups on the same day sharing a palette halves the flower order.' }),
      el('li', { text: 'Ask for a photograph of a past setup at your exact venue before signing — not a Pinterest mood board. Mood boards are how décor budgets get doubled in January.' })
    ])));

    /* catering strategy */
    wrap.appendChild(UI.panel('How to hit the per-plate targets', {}, [
      el('ul', { class: 'ul-clean' }, [
        el('li', { text: 'All-vegetarian. Non-veg at an Indian wedding raises per-plate 25–35% and complicates the kitchen.' }),
        el('li', { text: 'No seafood, no imported ingredients.' }),
        el('li', { text: 'One live international counter per function — Chinese or Italian, never both. That single rule saves ₹60 a plate.' }),
        el('li', { text: 'Desserts weighted to Indian sweets rather than plated patisserie.' }),
        el('li', { text: 'Two tastings, and get the final menu attached to the contract as an annexure. "Similar quality" is not a menu.' }),
        el('li', { text: 'Jain and no-onion-no-garlic guests need a separate labelled counter. The Guests screen gives you the count to hand over.' })
      ]),
      el('div', { class: 'callout', html:
        '<b>Bar.</b> ₹70,000 buys a two-hour open bar for roughly 105 drinkers — 2 whisky, 1 vodka, 1 gin, 1 rum, beer and 2 wines, all IMFL, no imported labels. ' +
        'Rajasthan requires an <strong>occasional (temporary) bar licence</strong> for serving liquor at a private function; the venue or a licensed vendor must apply about two weeks ahead. ' +
        'Cheaper alternatives: a cash bar, or premium mocktails only.' })
    ]));

    /* risks */
    wrap.appendChild(UI.panel('Risks, and what to do about them', { flush: true }, UI.table([
      { key: 'risk', label: 'Risk', render: function (r) { return el('span', { class: 'nm', text: r.risk }); } },
      { key: 'action', label: 'What to do' }
    ], D.risks)));

    /* assumptions & questions */
    const cols = el('div', { class: 'cols' }, [
      UI.panel('What this plan assumes', {}, el('ul', { class: 'ul-clean' },
        D.assumptions.map(function (a) { return el('li', { text: a }); }))),
      UI.panel('Answer these six things', {
        sub: 'Until these are settled, treat every number here as provisional.'
      }, el('ul', { class: 'ul-clean' },
        D.openQuestions.map(function (q) { return el('li', { class: 'na', text: q }); })))
    ]);
    wrap.appendChild(cols);

    return wrap;
  };

  /* ================= RSVP INBOX ================= */

  W.views.inbox = function () {
    const wrap = el('div');
    const list = S.readRsvps().slice().reverse();

    wrap.appendChild(UI.pageHead('RSVP inbox',
      'Replies submitted through the invitation page. Merge each one into the guest list, then clear the inbox.',
      [
        list.length ? UI.btn('Merge all into guest list', mergeAll) : null,
        list.length ? UI.btn('Clear inbox', function () {
          UI.confirmModal('Clear the inbox',
            'This deletes all ' + list.length + ' reply record' + (list.length === 1 ? '' : 's') + '. Merge them first if you have not already.',
            function () { S.clearRsvps(); U.toast('Inbox cleared.'); W.render(); }, 'Clear');
        }, 'ghost') : null
      ].filter(Boolean)));

    wrap.appendChild(el('div', { class: 'callout', html:
      '<b>How this works right now.</b> The invitation page saves replies in the guest\u2019s own browser, which means you only see ' +
      'them if the guest replied on this device. To collect replies centrally, point <code>submitRsvp()</code> in ' +
      '<code>js/store.js</code> at a Google Form, Google Sheet or Supabase endpoint — it is one function and everything else keeps working. ' +
      'Until then, the practical approach is what most families do anyway: RSVPs come in by phone and WhatsApp, and you enter them on the Guests screen.' }));

    if (!list.length) {
      wrap.appendChild(UI.panel('Inbox', {}, UI.empty('Nothing here yet',
        'Replies submitted through the invitation page on this device will appear here.',
        UI.btn('Open the invitation', function () { window.open('index.html', '_blank'); }, 'ghost'))));
      return wrap;
    }

    wrap.appendChild(UI.panel(list.length + ' repl' + (list.length === 1 ? 'y' : 'ies'), { flush: true }, UI.table([
      {
        key: 'name', label: 'Name', render: function (r) {
          return el('div', {}, [
            el('div', { class: 'nm', text: r.name }),
            el('div', { class: 'sm', text: [r.side, r.city].filter(Boolean).join(' · ') })
          ]);
        }
      },
      {
        key: 'attending', label: 'Attending', render: function (r) {
          return UI.badge(r.attending, /cannot/.test(r.attending) ? 'bad' : (/only for some/.test(r.attending) ? 'warn' : 'ok'));
        }
      },
      { key: 'pax', label: 'Pax', num: true, render: function (r) { return (r.adults || 0) + (r.kids || 0); } },
      {
        key: 'functions', label: 'Functions', render: function (r) {
          return el('span', { class: 'sm', text: (r.functions || []).map(function (id) {
            const f = D.functions.find(function (x) { return x.id === id; });
            return f ? f.name : id;
          }).join(', ') || '—' });
        }
      },
      { key: 'diet', label: 'Diet', render: function (r) { return el('span', { class: 'sm', text: r.diet || '—' }); } },
      {
        key: 'travel', label: 'Travel', render: function (r) {
          return el('span', { class: 'sm', text: [r.arrival ? U.fmtDate(r.arrival) : '', r.mode, r.travelDetail].filter(Boolean).join(' · ') || '—' });
        }
      },
      { key: 'notes', label: 'Notes', render: function (r) { return el('span', { class: 'sm', text: r.notes || '—' }); } },
      {
        key: 'act', label: '', sortable: false, render: function (r) {
          return UI.btn('Add to list', function () { merge(r); U.toast('Added ' + r.name + ' to the guest list.'); }, 'ghost btn--sm');
        }
      }
    ], list)));

    return wrap;

    function toGuest(r) {
      const inv = { haldi: false, sangeet: false, phere: false, reception: false };
      (r.functions || []).forEach(function (id) { if (id in inv) inv[id] = true; });
      return {
        name: r.name, side: r.side || 'Bride', city: r.city || '',
        adults: Math.max(1, Number(r.adults) || 1), kids: Number(r.kids) || 0,
        phone: r.phone || '', diet: r.diet || 'Veg',
        rsvp: /cannot/.test(r.attending || '') ? 'Declined' : 'Confirmed',
        inv: inv,
        arrival: r.arrival || '', mode: r.mode || '',
        notes: [r.travelDetail, r.notes].filter(Boolean).join(' · ')
      };
    }

    function merge(r) { S.addGuest(toGuest(r)); }

    function mergeAll() {
      const existing = S.get().guests.map(function (g) { return g.name.toLowerCase().trim(); });
      let added = 0, dupes = 0;
      list.forEach(function (r) {
        if (existing.indexOf(String(r.name).toLowerCase().trim()) >= 0) { dupes++; return; }
        merge(r); added++;
      });
      U.toast('Merged ' + added + ' repl' + (added === 1 ? 'y' : 'ies') +
        (dupes ? ' · skipped ' + dupes + ' already on the list' : '') + '.');
    }
  };
})(window.W);
