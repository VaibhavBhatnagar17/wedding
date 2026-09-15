/* Venue — the brief, the shortlist, and the deal you are chasing. */
window.W = window.W || {}; W.views = W.views || {};

W.views.venue = function () {
  'use strict';
  const U = W.util, UI = W.ui, D = W.data, S = W.store, el = U.el;
  const st = S.get();
  const v = st.venueChoice;
  const wrap = el('div');

  wrap.appendChild(UI.pageHead('Venue',
    'Everything waits on this decision. Book it first, then let the rate you negotiate set the ceiling for décor and catering.',
    [UI.btn(v.name ? 'Edit booking' : 'Record the booking', openVenue)]));

  /* current choice */
  if (v.name) {
    const meta = el('dl', { class: 'kv' });
    function kv(k, val) { meta.appendChild(el('dt', { text: k })); meta.appendChild(el('dd', { html: val || '—' })); }
    kv('Property', '<strong>' + v.name + '</strong>');
    kv('Zone', v.zone);
    kv('Contact', v.contact);
    kv('Per plate agreed', v.perPlate ? U.inr(v.perPlate) : 'not recorded');
    kv('Guest block rate', v.blockRate ? U.inr(v.blockRate) + ' per room per night' : 'not recorded');
    kv('Notes', v.notes ? v.notes.replace(/\n/g, '<br>') : '—');

    const cols = el('div', { class: 'cols' }, [
      UI.panel('Booked', { sub: 'Recorded by you' }, meta),
      UI.panel('Sanity check', {}, [
        v.perPlate && v.perPlate > 900
          ? el('div', { class: 'callout callout--warn', html: '<b>That per-plate is above plan.</b> The budget assumes ₹700 at the reception. At ' + U.inr(v.perPlate) + ' × 600, the reception dinner alone becomes ' + U.inr(v.perPlate * 600) + ' — ' + U.inr(v.perPlate * 600 - 420000) + ' over. Either renegotiate, trim the menu, or cut the reception list.' })
          : el('div', { class: 'callout', html: '<b>Per-plate is within plan.</b> Hold the caterer to this in writing, including the number of live counters.' }),
        el('p', { html: 'Now chase the rest of the deal: waived lawn rental, 8–10 complimentary rooms, free use of a second lawn, written indoor backup, and the music-cut-off policy in writing.' })
      ])
    ]);
    wrap.appendChild(cols);
  } else {
    wrap.appendChild(el('div', { class: 'callout callout--warn', html:
      '<b>No venue recorded yet.</b> This is the critical path. Site-visit three properties from the shortlist below, then record what you book so the rest of the console can sanity-check your numbers against it.' }));
  }

  /* the brief */
  wrap.appendChild(UI.panel('What to demand', {
    sub: 'Take this list to every site visit. Ask for each point in writing.'
  }, el('ul', { class: 'ul-clean' }, D.venue.brief.map(function (b) {
    return el('li', { class: 'yes', text: b });
  }))));

  /* target deal */
  wrap.appendChild(UI.panel('The deal to chase', {}, [
    el('p', { html: 'Offer a <strong>food and beverage commitment of about ₹10 lakh</strong> — that is real money to a mid-tier property on a Tuesday in February. In exchange, ask for:' }),
    el('ul', { class: 'ul-clean' }, [
      el('li', { class: 'yes', text: 'Lawn rental waived entirely' }),
      el('li', { class: 'yes', text: '8 to 10 complimentary rooms for two nights' }),
      el('li', { class: 'yes', text: 'Guest block at ₹6,500–8,000 including breakfast, guests paying direct' }),
      el('li', { class: 'yes', text: 'Free use of the second lawn so the mandap and reception do not share a space' }),
      el('li', { class: 'yes', text: 'Breakfast on 2 Feb included in the room tariff, not billed separately' }),
      el('li', { class: 'yes', text: 'No outside-vendor entry fee for photography and entertainment' }),
      el('li', { class: 'yes', text: 'Written indoor backup for 300 at the sangeet and 650 at the reception' }),
      el('li', { class: 'yes', text: 'Written music policy, including what is permitted indoors after 22:00' }),
      el('li', { class: 'na', text: 'Do not accept: a per-plate that floats with the final menu, or a "subject to availability" second lawn' })
    ])
  ]));

  /* shortlist */
  wrap.appendChild(UI.panel('Shortlist', {
    sub: 'The right <em>tier</em> for ₹20 lakh with a 650-guest reception. February 2027 is peak season — treat this as a call list, not a price list, and verify every rate yourself.',
    flush: true
  }, UI.table([
    { key: 'name', label: 'Property', render: function (r) { return el('span', { class: 'nm', text: r.name }); } },
    { key: 'zone', label: 'Zone' },
    { key: 'capacity', label: 'Lawn capacity', num: true },
    { key: 'rooms', label: 'Rooms', num: true },
    { key: 'note', label: 'Why it is on the list', render: function (r) { return el('span', { class: 'sm', text: r.note }); } },
    {
      key: 'pick', label: '', sortable: false, render: function (r) {
        return UI.btn('Use this', function () {
          S.update(function (s) {
            s.venueChoice.name = r.name;
            s.venueChoice.zone = r.zone;
          });
          U.toast('Recorded ' + r.name + ' — now add the rate you negotiated.');
        }, 'ghost btn--sm');
      }
    }
  ], D.venue.shortlist)));

  /* out of range */
  wrap.appendChild(UI.panel('Deliberately not on the shortlist', {}, [
    el('p', { html: 'Being straight with you about what ₹20 lakh cannot buy in Udaipur, so you do not lose weeks discovering it:' }),
    el('ul', { class: 'ul-clean' }, [
      el('li', { class: 'na', html: '<strong>Taj Lake Palace, Oberoi Udaivilas, The Leela, Raffles</strong> — a wedding of this size starts at ₹1 crore and up.' }),
      el('li', { class: 'na', html: '<strong>Trident, Ananta, The Westin, Fateh Garh</strong> — ₹35–70 lakh for 650 guests. Possible only for a single function with no rooms, which defeats the single-venue logic.' }),
      el('li', { class: 'na', html: '<strong>Any hotel banquet at ₹1,400+ per plate</strong> — at 1,445 covers that is ₹20 lakh in food alone.' })
    ]),
    el('p', { style: 'margin-bottom:0', html: 'What you lose is a brand name and room luxury. What you keep is the Aravalli backdrop, the lake light and a garden setting that photographs better than most five-stars anywhere else in the country.' })
  ]));

  /* travel */
  const t = D.venue.travel;
  wrap.appendChild(UI.panel('Travel & conditions', {}, [
    (function () {
      const dl = el('dl', { class: 'kv' });
      [['By air', t.airport], ['By rail', t.rail], ['By road', t.road], ['Weather', t.weather], ['Tell guests', t.pack]]
        .forEach(function (p) { dl.appendChild(el('dt', { text: p[0] })); dl.appendChild(el('dd', { text: p[1] })); });
      return dl;
    })()
  ]));

  return wrap;

  function openVenue() {
    const body = el('div', {}, [
      el('div', { class: 'grid-2' }, [
        UI.field('Property name', UI.input('name', v.name)),
        UI.field('Zone', UI.input('zone', v.zone, { placeholder: 'e.g. Bedla' }))
      ]),
      UI.field('Contact (name and mobile)', UI.input('contact', v.contact)),
      el('div', { class: 'grid-2' }, [
        UI.field('Per plate agreed (₹)', UI.input('perPlate', v.perPlate, { type: 'number', min: '0', step: '25' })),
        UI.field('Guest block rate per night (₹)', UI.input('blockRate', v.blockRate, { type: 'number', min: '0', step: '250' }))
      ]),
      UI.field('Notes — what they agreed to', el('textarea', { name: 'notes', text: v.notes || '' }))
    ]);

    const m = UI.modal('Venue booking', body, {
      confirmLabel: 'Save',
      onConfirm: function () {
        function val(n) { const x = m.box.querySelector('[name="' + n + '"]'); return x ? x.value : ''; }
        S.update(function (s) {
          s.venueChoice = {
            name: val('name').trim(), zone: val('zone').trim(), contact: val('contact').trim(),
            perPlate: Number(val('perPlate')) || 0, blockRate: Number(val('blockRate')) || 0,
            notes: val('notes').trim()
          };
        });
        U.toast('Venue saved.');
      }
    });
  }
};
