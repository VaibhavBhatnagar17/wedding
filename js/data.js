/* All wedding content lives here. Edit this file to change the plan;
   the invitation page and the planner console both read from it. */
window.W = window.W || {};

(function (W) {
  'use strict';

  const couple = {
    groom: {
      name: 'Vaibhav Bhatnagar', short: 'Vaibhav', age: 29, side: 'Groom',
      mother: 'Kamla Srivastava', father: 'Ved Prakash Bhatnagar',
      parents: 'Kamla Srivastava & Ved Prakash Bhatnagar'
    },
    bride: {
      name: 'Mahak Kalra', short: 'Mahak', age: 27, side: 'Bride',
      mother: 'Riya Kalra', father: 'Kishore Kalra',
      parents: 'Riya Kalra & Kishore Kalra'
    },
    hashtag: '#VaibhavWedsMahak',
    city: 'Udaipur, Rajasthan',
    weddingDate: '2027-02-02',
    pheraStart: '11:00',
    pheraEnd: '13:30',
    budgetTotal: 2000000,
    guestCountCore: 300,
    guestCountReception: 650,
    // Catering guarantees — deliberately below invite counts. See PLAN.md §8.
    guaranteeCore: 275,
    guaranteeReception: 600
  };

  /* ---------------- Functions ---------------- */

  /* Schedule rows are [time, guestText, plannerNote].
     guestText === null keeps the row off the invitation — those are pure vendor
     beats (décor builds, makeup call times, lighting tests) that no guest should
     have to read. plannerNote is the operational detail and shows only in the
     private planner console. Write guestText as if a guest is reading it, because
     they are. */

  const functions = [
    {
      id: 'haldi',
      name: 'Haldi',
      tagline: 'Marigold Morning',
      date: '2027-02-01',
      start: '10:00',
      end: '13:30',
      area: 'Garden lawn / poolside',
      guests: 300,
      dressCode: 'Yellow & marigold orange · cottons',
      publicInvite: true,
      decorBudget: 35000,
      perPlate: 475,
      summary:
        'Rooms open at 06:00 so everyone can shift in, eat and dress without rushing — which is why the haldi starts at 10:00 rather than 09:30. It stays a daylight brunch rather than a lunch: daylight means no lighting spend, and a brunch at ₹475 instead of a full lunch at ₹1,100 saves about ₹1.7 lakh on its own.',
      schedule: [
        ['06:00', 'Rooms open — check in, drop your bags, breakfast is already on'],
        ['06:30', 'Chai, poha and breakfast counters on the lawn — open till 09:30'],
        ['07:30', 'Ganesh Puja & Griha Shanti — immediate families, poolside'],
        ['08:00', null, 'Welcome desk hands out keys in arrival order. 2 staff per 100 guests, luggage runners on standby, and a bag-hold counter for anyone whose room is not ready.'],
        ['09:00', 'Time to change — yellows and oranges, and something you do not mind staining'],
        ['10:00', 'Separate haldi for bride and groom'],
        ['11:00', 'Joint haldi · dhol · flower shower · water-splash zone'],
        ['12:00', 'Brunch counters open'],
        ['13:30', 'Close — go rest, the evening is a long one']
      ],
      decor: [
        'Marigold and genda torans throughout',
        'Yellow-orange gota chandeliers',
        'Bamboo and cane props, earthen pots, chatris',
        'Umbrella ceiling over the seating',
        'Tyre swing and dhol corner',
        'Hand-painted "Haldi" board',
        'No lighting rig — it is a morning function'
      ],
      menu: [
        'Kesar lassi, jaljeera, nimbu shikanji',
        'Chaat counter — raj kachori, dahi bhalla, papdi',
        'Live aloo tikki and chole bhature',
        'Poha, upma, medu vada',
        '2 mains + dal + rice + live paratha counter',
        'Live jalebi-rabri, moong dal halwa',
        'Sweet paan'
      ]
    },
    {
      id: 'sangeet',
      name: 'Ring Ceremony & Sangeet',
      tagline: 'Engagement and the big night, together',
      date: '2027-02-01',
      start: '18:30',
      end: '00:30',
      area: 'Main lawn, after-party in the banquet',
      guests: 300,
      dressCode: 'Fuchsia, marigold & gold · indo-western welcome',
      publicInvite: true,
      decorBudget: 45000,
      perPlate: 700,
      summary:
        'The engagement is a 30-minute ring ceremony at 19:00 on the sangeet stage rather than a separate function. That single merge saves roughly ₹2.6 lakh — another dinner for 285, another décor setup, another venue slot — and it paces the evening better. The folk act now runs first, as a warm-up: a Kalbelia troupe that pulls people out of their chairs makes the family performances far easier to follow, because nobody wants to be the first one dancing in front of 300 seated relatives.',
      schedule: [
        ['18:30', 'Guest arrival · welcome drinks'],
        ['19:00', 'RING CEREMONY — couple entry, ring exchange, blessings, cake'],
        ['19:35', 'Kalbelia & Ghoomar folk act — 25 minutes, and they will pull you up to dance'],
        ['20:00', 'Bar opens', 'Bar open 2 hours only. Brief the captain — soft close at 22:00.'],
        ['20:10', 'Sangeet begins — the families, then the cousins, then the siblings'],
        ['21:00', 'The couple perform'],
        ['21:15', 'Dinner opens, in stages'],
        ['21:40', 'Open floor — everybody dances'],
        ['22:00', 'The night moves indoors to the banquet', 'Outdoor sound OFF at 22:00 — legal cut-off, no exceptions. Sound team shifts to the indoor rig by 21:45 so there is no gap.'],
        ['00:30', 'Close']
      ],
      decor: [
        'A lighting function, not a flower function',
        'Mirror-mosaic stage backdrop',
        'Fairy-light canopy over the dance floor',
        '12 uplighters + 2 moving heads',
        '12×8 ft LED wall (~₹18k) — also the video screen and monogram display',
        'Fuchsia, marigold and gold drapes',
        'Low seating with bolsters, mirrored tables, hanging umbrellas',
        'Ring ceremony uses the same stage plus one 4×4 ft floral arch rolled on and off'
      ],
      menu: [
        '6 veg starters, 2 of them live',
        'Soup + 4 salads',
        'Punjabi mains — paneer lababdar, dal makhani',
        'Rajasthani gatte ki sabzi',
        'ONE live international counter — Chinese or Italian, not both (saves ₹60/plate)',
        'Tandoori roti and naan counter · biryani',
        'Gulab jamun, baked rasmalai, live kulfi falooda, ice cream cart',
        'Bar: 2 whisky, 1 vodka, 1 gin, 1 rum, beer, 2 wines — all IMFL'
      ]
    },
    {
      id: 'phere',
      name: 'Baraat, Varmala & Phere',
      tagline: 'The wedding',
      date: '2027-02-02',
      start: '09:30',
      end: '16:00',
      area: 'Lawn A — mandap',
      guests: 300,
      dressCode: 'Traditional · pastels and ivory for the day',
      publicInvite: true,
      decorBudget: 65000,
      perPlate: 550,
      muhurat: '11:00 – 13:30',
      summary:
        'Your muhurat is 11:00–13:30. Brief the pandit for a 90-minute core ceremony with 60 minutes of buffer — rushed pheras photograph badly and upset elders. Lunch afterwards is a curated Rajasthani thali rather than a 14-counter buffet: cheaper, more authentic, and exactly what guests want after 2.5 hours at a mandap.',
      schedule: [
        ['05:00', null, 'Décor team completes the mandap. Structure goes up overnight on 1 Feb while the sangeet after-party is indoors; flowers dressed from 05:00, signed off by 08:00.'],
        ['07:30', null, "Bride's hair and makeup begins — 3 hours, ready by 10:45. Groom from 08:30."],
        ['08:00', 'Breakfast for everyone', 'Negotiate breakfast into the room tariff rather than paying per plate.'],
        ['09:30', 'BARAAT — brass band, 2 dhols, ghodi or vintage car, 300m loop on the property'],
        ['10:15', 'Toran / Dwar Puja + Milni'],
        ['10:35', 'VARMALA on a raised stage — flower shower, 2 cold-pyro bursts'],
        ['11:00', 'Guests seated at the mandap'],
        ['11:00', 'PHERE — Kanyadaan, Granthi Bandhan, Havan, Pheras, Saptapadi, Sindoor & Mangalsutra, Ashirwad. Live shehnai, no DJ.'],
        ['13:30', 'Wedding lunch — Rajasthani thali — plus family portraits'],
        ['16:00', 'Close · rest before the reception']
      ],
      decor: [
        'The hero setup — do not cut this',
        'Four-pillar open mandap, ivory and soft pink',
        'Hanging jasmine and rajnigandha strings',
        'Kalash and banana leaves, fabric canopy',
        'Petal-path aisle with brass urlis',
        '300 chairs, white covers with coloured sashes',
        'Toran gate for the baraat',
        'Raised varmala stage with a flower-shower machine',
        'Daylight again — no lighting rig'
      ],
      menu: [
        'Rajasthani thali, seated service with limited counters',
        'Dal Baati Churma · Gatte ki Sabzi · Ker Sangri · Papad ki Sabzi',
        'Bajra and missi roti · Bajre ki Khichdi · kadhi · rice',
        'Salads and chutneys',
        'Malpua and Ghewar',
        'Buttermilk and jaljeera'
      ]
    },
    {
      id: 'reception',
      name: 'Reception',
      tagline: 'Everyone, all at once',
      date: '2027-02-02',
      start: '19:00',
      end: '23:15',
      area: 'Lawn B / banquet',
      guests: 650,
      dressCode: 'Formal Indian or western black-tie optional',
      publicInvite: true,
      decorBudget: 43000,
      perPlate: 700,
      summary:
        'The largest function and the one most likely to go wrong. 650 guests through a single stage line takes 90–110 minutes and will swallow the evening — run two photo queues, have the anchor call guests table-block by table-block, and put a separate photo booth near the entrance for people who do not need a stage picture.',
      schedule: [
        ['16:00', null, "Bride's reception look — outfit and jewellery change, makeup refresh only. Saves 60 minutes over a full reset."],
        ['17:00', null, 'Lighting test at 17:00, not 19:00. Sunset is 18:10 and you cannot aim a fixture in the dark.'],
        ['19:00', 'Guest arrival · welcome drinks · photo wall'],
        ['19:45', 'Couple entry'],
        ['20:00', 'Dinner opens · greetings on stage in two queues, so the wait is short'],
        ['21:00', 'Cake, then a few short speeches', 'Exactly 3 speeches × 2 minutes. Brief the anchor to close them out — this is where receptions overrun.'],
        ['21:15', 'Live ghazal and semi-classical duo · dinner continues'],
        ['22:45', 'Vidaai', 'Or move vidaai to the morning of 3 Feb — recommended. At 22:45 half the guests have left and everyone is exhausted.'],
        ['23:15', 'Close']
      ],
      decor: [
        'After dark, lighting does all the work',
        "Dramatic backdrop with the couple's monogram (~₹20k)",
        '20 uplighters',
        'Entrance arch + 6 photo-wall panels',
        'Candles and tall centrepieces on 30 cocktail tables',
        "Reuse: haldi's cane props become the photo corner, sangeet's fairy lights become the ceiling",
        '12 patio heaters — nights are 10–12°C'
      ],
      menu: [
        '6 starters, 2 live',
        'Soup and salad bar',
        'North Indian mains ×4 + one Rajasthani signature',
        'Live pasta OR noodle counter',
        'Dal, rice, biryani, live Indian bread counter',
        'Chaat corner',
        '5 desserts including one live · paan counter'
      ]
    }
  ];

  /* ---------------- Budget ---------------- */
  /* Sums to exactly ₹20,00,000 including contingency. */

  const budget = [
    { id: 'b01', head: 'Haldi brunch', cat: 'Food & Beverage', basis: '275 × ₹475', amount: 130625 },
    { id: 'b02', head: 'Ring Ceremony + Sangeet dinner', cat: 'Food & Beverage', basis: '285 × ₹700', amount: 199500 },
    { id: 'b03', head: 'Wedding lunch (Rajasthani thali)', cat: 'Food & Beverage', basis: '285 × ₹550', amount: 156750 },
    { id: 'b04', head: 'Reception dinner', cat: 'Food & Beverage', basis: '600 × ₹700', amount: 420000 },
    { id: 'b05', head: 'Welcome chaat, breakfasts, crew meals', cat: 'Food & Beverage', basis: 'across 3 days', amount: 48000 },
    { id: 'b06', head: 'Bar — 2-hr limited IMFL + excise licence', cat: 'Food & Beverage', basis: '~105 drinkers', amount: 70000 },
    { id: 'b07', head: 'Venue rental, taxes, generator, extra-hour', cat: 'Venue & Stay', basis: '2 lawns + banquet', amount: 75000 },
    { id: 'b08', head: 'Host-side rooms', cat: 'Venue & Stay', basis: '10 net × 2 nights', amount: 60000 },
    { id: 'b09', head: 'Décor — Haldi', cat: 'Décor', basis: 'daylight, marigold-led', amount: 35000 },
    { id: 'b10', head: 'Décor — Ring + Sangeet', cat: 'Décor', basis: 'stage, LED wall, lighting', amount: 45000 },
    { id: 'b11', head: 'Décor — Baraat, Varmala, Mandap', cat: 'Décor', basis: 'the hero setup', amount: 65000 },
    { id: 'b12', head: 'Décor — Reception', cat: 'Décor', basis: 'backdrop, entry, uplights', amount: 43000 },
    { id: 'b13', head: 'Photography + cinematography', cat: 'Photo & Video', basis: '2+2 crew, drone, teaser, albums', amount: 130000 },
    { id: 'b14', head: 'Sound, DJ, dhol ×2, band, shehnai, folk act', cat: 'Entertainment', basis: '3 days', amount: 62000 },
    { id: 'b15', head: 'Sangeet choreographer', cat: 'Entertainment', basis: '6 sessions + rehearsal', amount: 22000 },
    { id: 'b16', head: 'Hair & makeup', cat: 'Personal', basis: 'bride 4 looks, groom 2, 6 family', amount: 62000 },
    { id: 'b17', head: 'Mehndi artists', cat: 'Personal', basis: 'bridal + 4 artists', amount: 26000 },
    { id: 'b18', head: "Bride's outfits", cat: 'Personal', basis: '2 bought, 2 rented', amount: 75000 },
    { id: 'b19', head: "Groom's outfits", cat: 'Personal', basis: 'sherwani bought, 3 rented', amount: 40000 },
    { id: 'b20', head: 'Pandit, samagri, havan, Ganesh puja', cat: 'Rituals', basis: '—', amount: 28000 },
    { id: 'b21', head: 'Invitations — digital + 120 printed + website', cat: 'Invitations & Gifting', basis: '—', amount: 32000 },
    { id: 'b22', head: 'Welcome hampers (120) + favours (400)', cat: 'Invitations & Gifting', basis: '—', amount: 38000 },
    { id: 'b23', head: 'Guest logistics — transfers, shuttle, ghodi/car', cat: 'Logistics', basis: '—', amount: 40000 },
    { id: 'b24', head: 'Signage, seating charts, menu cards, printing', cat: 'Logistics', basis: '—', amount: 15000 },
    { id: 'b25', head: 'Contingency', cat: 'Contingency', basis: '4.1% — hold this back', amount: 82125 }
  ];

  /* ---------------- The cuts ---------------- */

  const cuts = [
    { decision: 'Engagement merged into the Sangeet evening as a 30-min ring ceremony', saving: 260000 },
    { decision: 'Haldi as a brunch (₹475) instead of a full lunch (₹1,100)', saving: 170000 },
    { decision: 'Wedding lunch as a curated Rajasthani thali, not a 14-counter buffet', saving: 150000 },
    { decision: 'Single venue for all four functions — no transport, one décor mobilisation', saving: 140000 },
    { decision: 'Weekday (Mon–Tue) rates on venue, décor and vendors', saving: 120000 },
    { decision: 'Rent 2 of 4 outfits each instead of buying all four', saving: 110000 },
    { decision: 'Digital-first invitations; 120 printed boxes for elders and VIPs only', saving: 90000 },
    { decision: 'Marigold-led palette, zero imported flowers', saving: 85000 },
    { decision: '2-hour limited IMFL bar instead of an all-night open bar', saving: 80000 },
    { decision: 'Haldi and Phere in daylight — zero lighting spend on 2 of 4 setups', saving: 70000 },
    { decision: 'LED wall rented once, used both nights', saving: 18000 }
  ];

  const protect = [
    'Photography and cinematography — the only thing that outlives the day',
    'The mandap and varmala setup — the phere is the wedding',
    'Reception lighting — 650 guests after dark, lighting is the entire look',
    'Sound quality at the sangeet',
    'A day-of coordinator (₹35–50k from contingency) — cheapest insurance on a 650-guest reception'
  ];

  /* ---------------- Venue ---------------- */

  const venue = {
    status: 'Not booked — shortlist below, rates to be verified',
    brief: [
      'Capacity: 700+ seated on the lawn, plus a second lawn or banquet so the mandap and reception do not share a space',
      'Per-plate: ₹650–800 for 600 all-veg on a Tuesday',
      'Rooms: block at ₹6,500–8,000 including breakfast, guest-paid',
      'Complimentary: 8–10 rooms against a ~₹10L F&B commitment, lawn rental waived',
      'Written confirmation of indoor backup for 300 and 650',
      'Written music policy — outdoor sound must stop at 22:00 by law',
      'Décor: in-house or preferred decorator, no outside-vendor entry fee'
    ],
    shortlist: [
      { name: 'Labh Garh Palace Resort', zone: 'Eklingji Road', capacity: '1000+', rooms: '~100', note: 'The classic fit for this exact budget tier' },
      { name: 'Shouryagarh Resort & Spa', zone: 'Sisarma', capacity: '~800', rooms: '82', note: 'Aravalli backdrop' },
      { name: 'Bhairavgarh Palace', zone: 'Ahar', capacity: '~700', rooms: '~45', note: 'Strong heritage look' },
      { name: 'Ramada Udaipur Resort & Spa', zone: 'Kodiyat / Sisarma', capacity: '~800', rooms: '~90', note: 'Reliable banquet operation' },
      { name: 'The Lalit Laxmi Vilas Palace', zone: 'Fateh Sagar', capacity: '~800', rooms: '55', note: 'Heritage — likely top of your range' },
      { name: 'Justa Rajputana Resort', zone: 'Bedla', capacity: '~600', rooms: '65', note: 'Tight for 650, check seated count' },
      { name: 'Chunda Palace / Shikarbadi', zone: 'Bedla / Goverdhan Vilas', capacity: '500–800', rooms: '~60', note: 'Heritage character' },
      { name: 'Vardhman Vatika / Vatika Gardens', zone: 'Bedla', capacity: '1000+', rooms: '—', note: 'Pure garden venue, own caterer allowed — cheapest per-plate route' }
    ],
    travel: {
      airport: 'Maharana Pratap Airport (UDR), Dabok — 22 km, 40 min',
      rail: 'Udaipur City Railway Station (UDZ) — city centre',
      road: 'Neemuch 3 hr · Ahmedabad 4.5 hr (NH-48) · Kota 5 hr · Jaipur 6 hr (NH-58) · Indore 6.5 hr',
      weather: 'Early Feb: days 25–27°C, nights 10–12°C. Sunrise 07:05, sunset 18:10.',
      pack: 'Layers. A shawl or jacket for both evenings is not optional.'
    }
  };

  /* ---------------- Vendors ---------------- */

  const vendors = [
    { id: 'v01', cat: 'Venue', name: '', target: 135000, status: 'To book', by: '2026-10-15', note: 'Rental + taxes + rooms. Site-visit 3 before deciding.' },
    { id: 'v02', cat: 'Catering', name: '', target: 954875, status: 'To book', by: '2026-11-30', note: 'Two tastings. All-veg. One live international counter per function.' },
    { id: 'v03', cat: 'Décor', name: '', target: 188000, status: 'To book', by: '2026-11-15', note: 'Ask for photos of past setups at YOUR venue, not a mood board.' },
    { id: 'v04', cat: 'Photography', name: '', target: 130000, status: 'To book', by: '2026-10-01', note: 'Book first — the good ones go 12+ months out for February.' },
    { id: 'v05', cat: 'Sound & Lights / DJ', name: '', target: 62000, status: 'To book', by: '2026-12-15', note: 'Includes dhol ×2, brass band, shehnai duo, folk act.' },
    { id: 'v06', cat: 'Choreographer', name: '', target: 22000, status: 'To book', by: '2026-11-30', note: '6 sessions + one full rehearsal.' },
    { id: 'v07', cat: 'Hair & Makeup', name: '', target: 62000, status: 'To book', by: '2026-11-15', note: 'Trial before booking. 4 bridal looks.' },
    { id: 'v08', cat: 'Mehndi', name: '', target: 26000, status: 'To book', by: '2026-12-31', note: 'Bridal artist + 4 for guests.' },
    { id: 'v09', cat: 'Pandit', name: '', target: 28000, status: 'To book', by: '2026-11-30', note: 'Brief for a 90-min core ceremony. Confirm 4 vs 7 pheras with both families.' },
    { id: 'v10', cat: 'Invitations', name: '', target: 32000, status: 'To book', by: '2026-12-01', note: 'Digital card + website + 120 printed boxes.' },
    { id: 'v11', cat: 'Transport', name: '', target: 40000, status: 'To book', by: '2027-01-05', note: 'Airport transfers, in-city shuttle, ghodi or vintage car for the baraat.' },
    { id: 'v12', cat: 'Bar & Licence', name: '', target: 70000, status: 'To book', by: '2027-01-15', note: 'Rajasthan occasional bar licence — apply ~2 weeks prior.' }
  ];

  /* ---------------- Checklist ---------------- */

  const checklist = [
    { id: 'c01', phase: 'Sep–Oct 2026', task: 'Site-visit 3 shortlisted venues', owner: 'Both' },
    { id: 'c02', phase: 'Sep–Oct 2026', task: 'Negotiate and book venue with 20% advance', owner: 'Both' },
    { id: 'c03', phase: 'Sep–Oct 2026', task: 'Book photographer + cinematographer', owner: 'Mahak' },
    { id: 'c04', phase: 'Sep–Oct 2026', task: 'Confirm with pandit: muhurat, 4 vs 7 pheras, ritual list', owner: 'Families' },
    { id: 'c05', phase: 'Sep–Oct 2026', task: 'Answer the six open questions in PLAN.md §11', owner: 'Both' },
    { id: 'c06', phase: 'Nov 2026', task: 'Sign décor partner (in-house or preferred)', owner: 'Vaibhav' },
    { id: 'c07', phase: 'Nov 2026', task: 'Caterer tasting #1 and menu shortlist', owner: 'Both' },
    { id: 'c08', phase: 'Nov 2026', task: 'Book sangeet choreographer, plan 8–10 performances', owner: 'Mahak' },
    { id: 'c09', phase: 'Nov 2026', task: 'Hair-and-makeup trial, then book', owner: 'Mahak' },
    { id: 'c10', phase: 'Nov 2026', task: 'Outfit shopping trip — buy 2, identify 2 rentals each', owner: 'Both' },
    { id: 'c11', phase: 'Dec 2026', task: 'Finalise invitation design', owner: 'Both' },
    { id: 'c12', phase: 'Dec 2026', task: 'Wedding website live, send save-the-date', owner: 'Vaibhav' },
    { id: 'c13', phase: 'Dec 2026', task: 'Lock guest list at 300 core / 650 reception', owner: 'Families' },
    { id: 'c14', phase: 'Dec 2026', task: 'Confirm room block and circulate the booking link', owner: 'Vaibhav' },
    { id: 'c15', phase: 'Jan 2027', task: 'Dispatch printed invites by 5 Jan', owner: 'Families' },
    { id: 'c16', phase: 'Jan 2027', task: 'Tasting #2, sign off final menus', owner: 'Both' },
    { id: 'c17', phase: 'Jan 2027', task: 'Approve décor layout and mock-up', owner: 'Mahak' },
    { id: 'c18', phase: 'Jan 2027', task: 'Build travel-desk sheet from RSVP travel data', owner: 'Vaibhav' },
    { id: 'c19', phase: 'Jan 2027', task: 'Room allocation for host-paid and family rooms', owner: 'Both' },
    { id: 'c20', phase: 'Jan 2027', task: 'Apply for the occasional bar licence', owner: 'Venue' },
    { id: 'c21', phase: 'Jan 2027', task: 'Book 12 patio heaters and order shawl favours', owner: 'Vaibhav' },
    { id: 'c22', phase: '20–25 Jan', task: 'RSVP chase calls — every unconfirmed guest', owner: 'Families' },
    { id: 'c23', phase: '20–25 Jan', task: 'Give final catering numbers (275 / 600) with 5% flex', owner: 'Both' },
    { id: 'c24', phase: '20–25 Jan', task: 'Seating plan and printed table charts', owner: 'Mahak' },
    { id: 'c25', phase: '20–25 Jan', task: 'Vendor call-sheet with names and mobile numbers', owner: 'Vaibhav' },
    { id: 'c26', phase: '20–25 Jan', task: 'Emergency kit: safety pins, steamer, meds, spare charger, cash', owner: 'Mahak' },
    { id: 'c27', phase: '29–30 Jan', task: 'Décor load-in begins', owner: 'Décor' },
    { id: 'c28', phase: '29–30 Jan', task: 'Final walkthrough with banquet manager and every vendor lead', owner: 'Both' }
  ];

  /* ---------------- Risks ---------------- */

  const risks = [
    { risk: 'Outdoor loudspeakers must stop at 22:00', action: 'Rajasthan PCB rules following the Supreme Court order. The schedule moves the after-party indoors at 22:00 — get the venue policy in writing.' },
    { risk: 'Night temperatures of 10–12°C', action: '12 patio heaters at ₹800–1,200/day (~₹15k for two nights, from contingency) plus shawl favours. Guests remember being cold.' },
    { risk: 'Sunset at 18:10', action: 'All outdoor daytime functions finish by 17:30. Test reception lighting at 17:00.' },
    { risk: 'Drone airspace near Dabok airport and the lakes', action: 'Confirm a DGCA-compliant registered drone and get written venue clearance.' },
    { risk: 'Unseasonal rain', action: 'Written confirmation the venue can move 300 (sangeet) and 650 (reception) indoors.' },
    { risk: 'Old-city traffic in peak season', action: 'Keep the venue out of the old city, or add 45 minutes to every transfer.' },
    { risk: 'Vendor advances', action: 'Never more than 30% upfront. Hold 30% until after the event. Written cancellation and postponement clause in every contract.' },
    { risk: 'Catering guarantee inflation', action: 'Venues bill max(guarantee, actual). Commit 275 and 600, never the full invite count. Negotiate 5% flex, final numbers 72 hours out.' },
    { risk: 'Feb 2027 muhurat clustering', action: 'Verify against a 2027 panchang whether 1–2 Feb is a heavy vivah date. Basant Panchami is around 11 Feb. Heavy dates mean +15% rates and thin availability.' }
  ];

  const assumptions = [
    'Excluded from the ₹20L: heirloom/investment jewellery, shagun and cash gifts, guests\u2019 airfare and rail fare, guests\u2019 room tariffs, honeymoon.',
    'Included in the ₹20L: all four functions, both wardrobes, hair and makeup, décor, photography, entertainment, logistics.',
    'Guest rooms are blocked at a negotiated rate and paid by guests. The host covers 10 rooms.',
    'All functions at a single property. Food is all-vegetarian.',
    'No planner fee is budgeted — a ₹35–50k day-of coordinator should come from contingency.'
  ];

  const openQuestions = [
    'Is jewellery inside the ₹20L? If yes, the guest count must drop. Biggest unknown in the plan.',
    'Who pays for guest rooms? The plan assumes guests do, with the host covering 10.',
    'Alcohol — 2-hour open bar (budgeted), cash bar, or dry?',
    'Non-veg at any function? It adds 25–35% per plate where served.',
    'Vidaai on 2 Feb night, or 3 Feb morning (recommended)?',
    'How many of the 300 are outstation, and flying vs driving? This sizes the travel desk and room block.'
  ];

  /* ---------------- Guest seed ---------------- */
  /* A starter set that demonstrates every field. Replace via CSV import. */

  const GROUPS = ['Immediate family', 'Extended family', 'Friends', 'Colleagues', 'Neighbours', 'Family friends'];
  const DIETS = ['Veg', 'Jain', 'No onion/garlic', 'Vegan', 'Non-veg'];
  const RSVPS = ['Pending', 'Confirmed', 'Declined', 'Tentative'];

  /* A line written for one specific guest, shown at the top of their portal.
     These are only here so the feature is visible in the sample data. */
  const SAMPLE_MESSAGES = {
    'Shanti Devi Bhatnagar': 'Dadi, your room is on the ground floor and there is a wheelchair reserved at the mandap. Someone will be with you the whole time.',
    'Rohit Sharma': 'Best man duties: baraat energy, one speech, and you are opening the sangeet. No excuses.',
    'Priya Nair': 'Vegan thali arranged for you at every single meal — I checked twice.',
    'Sharma Family': 'So glad you are coming. The children have a play corner during the phere.'
  };

  /* Columns: name, side, group, city, extra adults, kids, diet, RSVP,
     haldi, sangeet, phere, reception, notes. */
  const seedGuests = [
    ['Ved Prakash Bhatnagar', 'Groom', 'Immediate family', 'Jaipur', 4, 0, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Groom\u2019s father · host room'],
    ['Kamla Srivastava', 'Groom', 'Immediate family', 'Jaipur', 0, 0, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Groom\u2019s mother · host room'],
    ['Ananya Bhatnagar', 'Groom', 'Immediate family', 'Bengaluru', 1, 1, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Sister · sangeet performance'],
    ['Kishore Kalra', 'Bride', 'Immediate family', 'Delhi', 3, 0, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Bride\u2019s father · host room'],
    ['Riya Kalra', 'Bride', 'Immediate family', 'Delhi', 0, 0, 'No onion/garlic', 'Confirmed', 1, 1, 1, 1, 'Bride\u2019s mother · host room'],
    ['Aditya Kalra', 'Bride', 'Immediate family', 'Pune', 2, 1, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Brother · handles baraat'],
    ['Shanti Devi Bhatnagar', 'Groom', 'Extended family', 'Jaipur', 1, 0, 'Jain', 'Confirmed', 1, 1, 1, 1, 'Dadi · 82, ground-floor room, wheelchair at mandap'],
    ['Prem Chand Kalra', 'Bride', 'Extended family', 'Ludhiana', 1, 0, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Nana ji · ground-floor room'],
    ['Vikram & Neha Bhatnagar', 'Groom', 'Extended family', 'Kota', 2, 2, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Chacha–chachi · driving down'],
    ['Suresh & Anita Kalra', 'Bride', 'Extended family', 'Neemuch', 2, 0, 'Veg', 'Tentative', 1, 1, 1, 1, 'Mama–mami · driving down'],
    ['Rohit Sharma', 'Groom', 'Friends', 'Mumbai', 2, 0, 'Non-veg', 'Confirmed', 0, 1, 0, 1, 'Best man · sangeet performance'],
    ['Karan Mehta', 'Groom', 'Friends', 'Gurgaon', 1, 0, 'Veg', 'Pending', 0, 1, 0, 1, ''],
    ['Priya Nair', 'Bride', 'Friends', 'Bengaluru', 1, 0, 'Vegan', 'Confirmed', 0, 1, 0, 1, 'Maid of honour'],
    ['Shreya Gupta', 'Bride', 'Friends', 'Delhi', 1, 0, 'Veg', 'Confirmed', 0, 1, 0, 1, 'Sangeet performance'],
    ['Amit Deshpande', 'Groom', 'Colleagues', 'Hyderabad', 2, 0, 'Non-veg', 'Pending', 0, 0, 0, 1, 'Reception only'],
    ['Nikita Rao', 'Bride', 'Colleagues', 'Indore', 1, 0, 'Veg', 'Pending', 0, 0, 0, 1, 'Reception only'],
    ['Sharma Family', 'Bride', 'Neighbours', 'Delhi', 4, 2, 'Veg', 'Pending', 0, 0, 0, 1, 'Reception only'],
    ['Iyer Family', 'Groom', 'Family friends', 'Jaipur', 3, 1, 'Veg', 'Confirmed', 0, 1, 1, 1, ''],
    ['Gulab Singh Rathore', 'Groom', 'Family friends', 'Udaipur', 2, 0, 'Veg', 'Confirmed', 1, 1, 1, 1, 'Local · no room needed'],
    ['Meera Joshi', 'Bride', 'Family friends', 'Udaipur', 2, 1, 'Jain', 'Confirmed', 1, 1, 1, 1, 'Local · no room needed']
  ].map(function (r, i) {
    const local = /Udaipur/.test(r[3]);
    const n = i + 1;
    return {
      id: 'g' + String(n).padStart(3, '0'),
      name: r[0], side: r[1], group: r[2], city: r[3],
      adults: 1 + Number(r[4]), kids: Number(r[5]),
      // Sample numbers so the guest portal can be tried out. Replace these
      // with the real ones before sharing the link.
      phone: String(9876500000 + n), email: '',
      diet: r[6], rsvp: r[7],
      inv: { haldi: !!r[8], sangeet: !!r[9], phere: !!r[10], reception: !!r[11] },
      // Rooms open at 06:00 on 1 Feb, so that is the default arrival.
      arrival: local ? '' : '2027-02-01', arrivalTime: '', departure: local ? '' : '2027-02-03',
      mode: local ? 'Car' : '', travelDetail: '', pickup: '',
      needsRoom: !local,
      hotel: local ? '' : 'Wedding venue — guest room block',
      room: '', checkIn: local ? '' : '2027-02-01', checkOut: local ? '' : '2027-02-03',
      hostPaid: /host room/.test(r[12]),
      table: r[11] ? 'T-' + String(Math.ceil(n / 3)) : '',
      message: SAMPLE_MESSAGES[r[0]] || '',
      giftReceived: false, notes: r[12]
    };
  });

  /* ─────────────────── guest portal content ─────────────────── */

  /* Photo albums. Paste Google Photos / Drive shared album links here, or
     manage them in the Supabase `albums` table once connected. */
  const albums = [
    { title: 'Pre-wedding shoot', functionId: '', url: '', count: 0,
      note: 'Coming in December 2026' },
    { title: 'Mehndi at home', functionId: '', url: '', count: 0,
      note: 'From the days before we travel' },
    { title: 'Haldi & Sangeet', functionId: 'haldi', url: '', count: 0,
      note: 'Live from the evening of 1 February' },
    { title: 'Phere', functionId: 'phere', url: '', count: 0,
      note: 'Uploaded the same evening' },
    { title: 'Reception', functionId: 'reception', url: '', count: 0,
      note: 'Uploaded 3 February' }
  ];

  const announcements = [
    { title: 'Save the date', created_at: '2026-09-01',
      body: 'Haldi and Sangeet on 1 February, Phere on 2 February at 11 am, ' +
            'Reception the same evening at 7 pm — all at one venue in Udaipur.' }
  ];

  /* The wedding guide shown in every guest's portal. */
  const guide = [
    {
      title: 'Arriving on 1 February',
      icon: 'kalash',
      items: [
        ['Rooms open at 6 am', 'Come straight to the venue whenever you land or arrive. You can check in, shower and change before anything starts — no waiting in a lobby.'],
        ['Breakfast from 6:30', 'Chai, poha and hot counters on the lawn until 9:30. Eat first, unpack later.'],
        ['Dress by 9:30', 'The haldi starts at 10. That is deliberate: it gives you three and a half hours between arriving and being needed anywhere.'],
        ['If you arrive the night before', 'Tell us in your RSVP and we will sort a room for the 31st. Do not book anything yourself.'],
        ['Mehndi', 'Happening quietly at home with close family before we all travel, so there is no mehndi function at the venue.']
      ]
    },
    {
      title: 'What to wear',
      icon: 'paisley',
      items: [
        ['Haldi, 1 Feb morning', 'Yellow, marigold orange, white. Cottons you do not mind staining — haldi does not come out.'],
        ['Ring ceremony & Sangeet, 1 Feb evening', 'Fuchsia, marigold, gold. Indo-western is very welcome. Shoes you can dance in.'],
        ['Phere, 2 Feb morning', 'Traditional. Pastels and ivory look wonderful in daylight photographs.'],
        ['Reception, 2 Feb evening', 'Formal Indian, or black-tie if you prefer. It will be cold — plan a shawl or a jacket.']
      ]
    },
    {
      title: 'Weather & packing',
      icon: 'kalash',
      items: [
        ['Days', '25–27°C and sunny. Sunglasses, and sunscreen for the haldi lawn.'],
        ['Nights', '10–12°C. Both evening functions are outdoors. A shawl or jacket is genuinely necessary.'],
        ['Also bring', 'Comfortable shoes for the lawns, any medication you need, and a power bank.']
      ]
    },
    {
      title: 'Good to know',
      icon: 'mandala',
      items: [
        ['Everything is at one venue', 'No travelling between functions. Your room is a short walk from every lawn.'],
        ['Food', 'All functions are pure vegetarian. Jain and no-onion-garlic thalis are arranged — tell us in advance and it will be at your table.'],
        ['Bar', 'At the Sangeet only, from 8 pm. The music moves indoors at 10 and carries on there.'],
        ['The sangeet', 'A Kalbelia folk troupe opens the evening and will pull you up to dance, so nobody has to be the first one on the floor. Family performances follow.'],
        ['Children', 'Very welcome. There is a supervised play corner during the phere.'],
        ['Gifts', 'Your presence is the gift. If you insist, a blessing envelope at the reception is more than enough.'],
        ['Photographs', 'Please stay seated during the phere so everyone can see. Our crew will get the shots, and every album lands in this portal.']
      ]
    },
    {
      title: 'While you are in Udaipur',
      icon: 'feather',
      items: [
        ['City Palace', 'Go early, around 9:30 am, before the crowds. Two hours, three if you add the Crystal Gallery.'],
        ['Lake Pichola at sunset', 'The boat from Rameshwar Ghat around 5 pm. The single best hour in the city.'],
        ['Bagore ki Haveli', '7 pm folk dance show at Gangaur Ghat. Get there by 6:15 — tickets are same-day only and it fills up.'],
        ['Sajjangarh Monsoon Palace', 'Sunset over the Aravallis. Take a taxi, not a scooter.'],
        ['Jagdish Temple', 'Five minutes uphill from the City Palace gate, and free. Worth the detour.'],
        ['A whole spare day', 'Kumbhalgarh Fort with the Ranakpur Jain temples on the way back — two hours each way, so share a cab.'],
        ['Eat', 'Ambrai or Upre for the view across the water, Tribute for thali, Jagdish Chowk for kachori and jalebi.'],
        ['Shop', 'Bandhej and leheriya, Pichwai paintings, Molela clay plaques, juttis and silver. Bada Bazaar and Hathi Pol. Bargain, kindly.'],
        ['Stay an extra day', 'Genuinely worth it. Ask any of us for a plan — half the family has done all of this twice.']
      ]
    }
  ];

  W.data = {
    couple: couple,
    functions: functions,
    budget: budget,
    cuts: cuts,
    protect: protect,
    venue: venue,
    vendors: vendors,
    checklist: checklist,
    risks: risks,
    assumptions: assumptions,
    openQuestions: openQuestions,
    seedGuests: seedGuests,
    albums: albums, announcements: announcements, guide: guide,
    GROUPS: GROUPS, DIETS: DIETS, RSVPS: RSVPS
  };
})(window.W);
