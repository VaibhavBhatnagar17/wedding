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
    pheraEnd: '13:00',
    budgetTotal: 2000000,
    guestCountCore: 180,
    guestCountReception: 650,
    // Aggregate catering commitment, deliberately below the invite counts. Each
    // function carries its own `guarantee` too — the haldi runs lighter than the
    // evening functions because guests are still arriving. See PLAN.md §8.
    guaranteeCore: 180,
    guaranteeReception: 600
  };

  /* Each family sends its own card from its own address. The card names its
     own child first, shows that family's part in each ceremony, and sends
     replies to that family. js/side.js decides which card a visitor sees.
     rsvpWhatsapp: country code and number, no + or spaces; blank hides the
     WhatsApp button. */
  const sides = {
    groom: { family: 'Bhatnagar', domain: 'vaibhavwedsmahak.in', page: 'index.html', rsvpWhatsapp: '' },
    bride: { family: 'Kalra', domain: 'mahakwedsvaibhav.in', page: 'mahak.html', rsvpWhatsapp: '' }
  };

  /* ---------------- Functions ---------------- */

  /* Four invitation groups. A guest is invited to a group (inv.haldi and so
     on), and every programme event below that names the group belongs to it.
     Pairs are [english, hindi]. `ops` rows are vendor beats no guest should
     read; they only appear in the planner's run sheet, which is built from the
     programme plus these rows at the bottom of this file. */

  const functions = [
    {
      id: 'haldi',
      name: 'Haldi', nameHi: 'हल्दी',
      tagline: 'Marigold Morning', taglineHi: 'गेंदे की सुबह',
      blurb: 'A haldi for each of us, then one together, with dhol and a shower of flowers. Lunch is served right beside it, so come as you are.',
      blurbHi: 'पहले हम दोनों की अलग-अलग हल्दी, फिर एक साथ — ढोल और फूलों की बौछार के साथ। भोजन वहीं पास में परोसा जाएगा, तो जैसे हैं वैसे ही आइए।',
      date: '2027-02-01',
      start: '11:00',
      end: '15:30',
      area: 'The lawn, Hotel Khumani', areaHi: 'लॉन, होटल खुमानी',
      guests: 180,
      dressCode: 'Yellow & marigold orange · cottons', dressHi: 'पीला और गेंदा-नारंगी · सूती कपड़े',
      publicInvite: true,
      decorBudget: 35000,
      perPlate: 475,
      guarantee: 170,
      summary:
        'The hotel opens to our guests at 08:00, ten rooms are held from the night of 31 January for early arrivals, and the haldi starts at 11:00 so everyone can check in, eat and dress without rushing. Lunch is served beside the haldi lawn from 13:30, so nobody has to change first. The budget line still assumes a ₹475 brunch; a full lunch will cost more — re-cost it with the caterer.',
      ops: [
        ['08:00', 'Welcome desk hands out keys in arrival order. 2 staff per 100 guests, luggage runners on standby, and a bag-hold counter for anyone whose room is not ready.'],
        ['15:30', 'Lawn reset for the evening: strip the haldi décor, build the stage, the folk-act floor and the dinner counters by 18:30.']
      ],
      decor: [
        'Marigold and genda torans throughout',
        'Yellow-orange gota chandeliers',
        'Bamboo and cane props, earthen pots, chatris',
        'Umbrella ceiling over the seating',
        'Tyre swing and dhol corner',
        'Hand-painted "Haldi" board',
        'No lighting rig — it is a daylight function'
      ],
      menu: [
        'Kesar lassi, jaljeera, nimbu shikanji',
        'Chaat counter — raj kachori, dahi bhalla, papdi',
        'Live aloo tikki and chole bhature',
        '2 mains + dal + rice + live paratha counter',
        'Live jalebi-rabri, moong dal halwa',
        'Sweet paan'
      ]
    },
    {
      id: 'sangeet',
      name: 'Sagaai, Sangeet & After-party', nameHi: 'सगाई, संगीत और आफ़्टर-पार्टी',
      tagline: 'One long, glorious night', taglineHi: 'एक लंबी, शानदार रात',
      blurb: 'Kalbeliya and Ghoomar dancers open the evening, at eight we dance our way into the rings, the families take the floor at nine, and at eleven the party moves into the banquet hall until one.',
      blurbHi: 'कालबेलिया और घूमर से शाम की शुरुआत, आठ बजे नाचते हुए हमारी सगाई, नौ बजे परिवारों का संगीत — और रात 11 से 1 बजे तक बैंक्वेट हॉल में पार्टी।',
      date: '2027-02-01',
      start: '19:00',
      end: '01:00',
      area: 'The lawn · banquet hall', areaHi: 'लॉन · बैंक्वेट हॉल',
      guests: 180,
      dressCode: 'Fuchsia, marigold & gold · party wear after 11', dressHi: 'फ़ुशिया, गेंदा और सुनहरा · रात 11 के बाद पार्टी वियर',
      publicInvite: true,
      decorBudget: 45000,
      perPlate: 700,
      guarantee: 180,
      summary:
        'The folk act runs first, as a warm-up and as the buffer for anyone arriving late: a Kalbeliya troupe that pulls people out of their chairs makes the family performances far easier to follow. At 20:00 the sagaai is the couple\u2019s own performance with their friends, ending in the rings, with a live singer beside the stage; dinner opens alongside. The families perform from 21:00, and at 23:00 the party moves indoors to the banquet hall until 01:00. There is no bar: the evening is dry.',
      ops: [
        ['17:00', 'Lighting test at 17:00 — sunset is 18:19, and you cannot aim a fixture in the dark.'],
        ['19:30', 'Live singer\u2019s sound check beside the stage; the couple\u2019s dance group in place by 19:50, rings and shagun trays on stage.'],
        ['22:45', 'DJ and late-night snacks ready in the banquet hall. Outdoor sound off at 23:00, when the last family performance ends.']
      ],
      decor: [
        'A lighting function, not a flower function',
        'Mirror-mosaic stage backdrop',
        'Fairy-light canopy over the dance floor',
        '12 uplighters + 2 moving heads',
        '12×8 ft LED wall (~₹18k) — also the video screen and monogram display',
        'Fuchsia, marigold and gold drapes',
        'Low seating with bolsters, mirrored tables, hanging umbrellas',
        'Sagaai uses the same stage plus one 4×4 ft floral arch rolled on and off',
        'After-party: the banquet hall, lanterns and a dance floor'
      ],
      menu: [
        '6 veg starters, 2 of them live',
        'Soup + 4 salads',
        'Punjabi mains — paneer lababdar, dal makhani',
        'Rajasthani gatte ki sabzi',
        'ONE live international counter — Chinese or Italian, not both (saves ₹60/plate)',
        'Tandoori roti and naan counter · biryani',
        'Gulab jamun, baked rasmalai, live kulfi falooda, ice cream cart',
        'After-party: late-night snacks, tea and coffee'
      ]
    },
    {
      id: 'phere',
      name: 'Baraat, Varmala & Phere', nameHi: 'बारात, वरमाला और फेरे',
      tagline: 'The wedding', taglineHi: 'विवाह',
      blurb: 'The baraat sets off at half past nine, the varmala is at half past ten, and the pheras begin at eleven. Vidaai follows lunch, in the afternoon light.',
      blurbHi: 'साढ़े नौ बजे बारात, साढ़े दस बजे वरमाला और ग्यारह बजे से फेरे। दोपहर के भोजन के बाद, दिन की रोशनी में विदाई।',
      date: '2027-02-02',
      start: '09:30',
      end: '15:00',
      area: 'The lawn — mandap', areaHi: 'लॉन — मंडप',
      guests: 180,
      dressCode: 'Traditional · pastels and ivory for the day', dressHi: 'पारंपरिक · दिन के लिए पेस्टल और आइवरी',
      publicInvite: true,
      decorBudget: 110000,
      perPlate: 550,
      guarantee: 180,
      muhurat: '11:00 – 13:00',
      summary:
        'The bride\u2019s family begin with Ganesh puja at 07:00 and the tel ceremony at 07:30, which is why the varmala is 10:30 rather than 10:00: bridal hair and makeup needs about three hours, plus a hair wash after the oil. Ask the pandit to confirm the muhurat in writing — published panchangs list the 2 February vivah muhurat from 17:47 (Delhi), and Abhijit muhurat in Udaipur is about 12:26–13:10. Vidaai follows lunch at 14:30, the traditional order: wedding, vidaai, then a reception hosted by the groom\u2019s family.',
      ops: [
        ['05:00', 'Décor team completes the mandap. The structure goes up overnight while the after-party is in the banquet hall; flowers dressed from 05:00, signed off by 08:00.'],
        ['07:45', 'Bride\u2019s hair and makeup 07:45–10:30, straight after the tel and a hair wash. Groom ready by 09:00, sehra by 09:10.'],
        ['15:00', 'Lawn reset from mandap to reception — 650 seated — finished by 18:30.']
      ],
      decor: [
        'The hero setup — do not cut this',
        'Four-pillar open mandap, ivory and soft pink',
        'Hanging jasmine and rajnigandha strings',
        'Kalash and banana leaves, fabric canopy',
        'Petal-path aisle with brass urlis',
        '180 chairs, white covers with coloured sashes',
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
      name: 'Reception', nameHi: 'रिसेप्शन',
      tagline: 'Everyone, all at once', taglineHi: 'सब एक साथ',
      blurb: 'Everyone we know, in one evening. The couple arrive at quarter to eight, dinner opens at eight, and greetings on stage run as two queues so nobody waits long.',
      blurbHi: 'हमारे सभी परिचित, एक ही शाम। पौने आठ बजे नवदंपति का आगमन, आठ बजे से भोजन, और मंच पर बधाई के लिए दो कतारें, ताकि किसी को देर तक इंतज़ार न करना पड़े।',
      date: '2027-02-02',
      start: '19:00',
      end: '23:00',
      area: 'The lawn', areaHi: 'लॉन',
      guests: 650,
      dressCode: 'Formal Indian or western black-tie optional', dressHi: 'औपचारिक भारतीय पोशाक या ब्लैक-टाई',
      publicInvite: true,
      decorBudget: 43000,
      perPlate: 700,
      guarantee: 600,
      summary:
        'The largest function and the one most likely to go wrong. 650 guests through a single stage line takes 90–110 minutes and will swallow the evening — run two photo queues, have the anchor call guests table-block by table-block, and put a photo booth near the entrance for people who do not need a stage picture. One listing gives Khumani parking for about 30 cars: agree overflow parking and valets with the hotel.',
      ops: [
        ['16:00', 'Bride\u2019s reception look — outfit and jewellery change, makeup refresh only. Saves 60 minutes over a full reset.'],
        ['17:00', 'Lighting test at 17:00, not 19:00. Sunset is 18:20 and you cannot aim a fixture in the dark.'],
        ['21:00', 'Cake, then exactly 3 speeches × 2 minutes. Brief the anchor to close them out — this is where receptions overrun.'],
        ['22:00', 'The legal cut-off for outdoor amplified sound is 22:00. Keep the music low after that.']
      ],
      decor: [
        'After dark, lighting does all the work',
        "Dramatic backdrop with the couple's monogram (~₹20k)",
        '20 uplighters',
        'Entrance arch + 6 photo-wall panels',
        'Candles and tall centrepieces on 30 high tables',
        "Reuse: haldi's cane props become the photo corner, sangeet's fairy lights become the ceiling",
        '12 patio heaters — nights are 9–12°C'
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

  /* ---------------- The programme ---------------- */

  /* Every event a guest might need to be at, in order. This is the one source
     of truth for times: the invitation, the guest portal, the calendar file and
     the planner's run sheet all read it.

     fn      invitation group the event belongs to (who can see it in the portal)
     sheet   for events open to every staying guest (meals, rest), the run sheet
             it is filed under
     who     'stay' hotel guests · 'bride' the bride's family · 'adults'
     key     a moment people are turning up for
     art     painting in assets/art/art-<art>.webp
     seated  "be seated by" / "gather at" time, published to guests
     seatedFor  only that family is asked to be there by `seated`
     side    'groom' or 'bride': on that family's card only (see side.js)
     role    { groom, bride }: that family's part, shown on its own card
     alarm   minutes before start for the calendar reminder
     ops     a planner-only note on the same beat

     Published times never overlap the next thing guests must be at. Where a
     breakfast quietly runs longer for late risers, that is in `ops`, not here. */

  const programme = [
    { id: 'rooms', date: '2027-02-01', start: '08:00', sheet: 'haldi', who: 'stay',
      t: ['Rooms open · check in', 'कमरे तैयार · चेक-इन'],
      where: ['Hotel Khumani reception', 'होटल खुमानी का रिसेप्शन'],
      note: ['Come straight to the hotel whenever you arrive — your room is ready from 8 am.',
        'पहुँचते ही सीधे होटल आइए — सुबह 8 बजे से आपका कमरा तैयार रहेगा।'] },
    { id: 'bf1', date: '2027-02-01', start: '08:00', end: '10:30', sheet: 'haldi', who: 'stay', meal: true,
      t: ['Breakfast', 'नाश्ता'],
      where: ['The hotel restaurant', 'होटल का रेस्तराँ'],
      note: ['Eat before you change for the haldi.', 'हल्दी के कपड़े पहनने से पहले नाश्ता कर लीजिए।'],
      ops: 'Published as closing at 10:30. Keep it open quietly until 11:30 for late arrivals — do not announce it.' },
    { id: 'haldi', fn: 'haldi', date: '2027-02-01', start: '11:00', end: '13:30', key: true, art: 'haldi', alarm: 30,
      t: ['Haldi', 'हल्दी'],
      where: ['The lawn', 'लॉन'],
      note: ['A haldi for each of us, then one together — dhol, a shower of flowers and a great deal of yellow.',
        'पहले हम दोनों की अलग-अलग हल्दी, फिर एक साथ — ढोल, फूलों की बौछार और ढेर सारा पीला रंग।'],
      role: {
        groom: ['Our family does Vaibhav’s haldi first, then joins Mahak’s family for one together.', 'पहले हमारा परिवार वैभव को हल्दी लगाएगा, फिर महक के परिवार के साथ मिलकर एक साथ हल्दी।'],
        bride: ['Our family does Mahak’s haldi first, then joins Vaibhav’s family for one together.', 'पहले हमारा परिवार महक को हल्दी लगाएगा, फिर वैभव के परिवार के साथ मिलकर एक साथ हल्दी।']
      } },
    { id: 'lunch1', fn: 'haldi', date: '2027-02-01', start: '13:30', end: '15:30', meal: true,
      t: ['Lunch', 'दोपहर का भोजन'],
      where: ['Beside the haldi lawn', 'हल्दी वाले लॉन के पास'],
      note: ['Served right there, so nobody has to change first.', 'वहीं परोसा जाएगा — पहले कपड़े बदलने की ज़रूरत नहीं।'],
      ops: 'Towels and a wash station at the lawn edge.' },
    { id: 'rest1', date: '2027-02-01', start: '15:30', end: '19:00', sheet: 'haldi', who: 'stay',
      t: ['Rest', 'विश्राम'],
      where: ['Your room · the rooftop pool', 'आपका कमरा · छत का स्विमिंग पूल'],
      note: ['Wash off the haldi, rest, and dress for the evening. Sunset is at 6:19.',
        'हल्दी धोइए, आराम कीजिए और शाम के लिए तैयार हो जाइए। सूर्यास्त 6:19 बजे।'] },
    { id: 'folk', fn: 'sangeet', date: '2027-02-01', start: '19:00', end: '20:00', key: true, art: 'folk', alarm: 15,
      t: ['A Rajasthani folk evening', 'राजस्थानी लोक संध्या'],
      where: ['The lawn', 'लॉन'],
      note: ['Kalbeliya and Ghoomar dancers open the night — and they will pull you in to dance.',
        'कालबेलिया और घूमर नृत्य से शाम की शुरुआत — और वे आपको भी नचाएँगे।'] },
    { id: 'sagaai', fn: 'sangeet', date: '2027-02-01', start: '20:00', end: '21:00', key: true, art: 'sagaai', alarm: 20, seated: '19:50',
      t: ['Sagaai', 'सगाई'],
      where: ['The lawn — the stage', 'लॉन — मंच'],
      note: ['We dance our way to the rings — the two of us with our friends, and a live singer beside the stage.',
        'हम दोनों अपने दोस्तों के साथ नाचते हुए अँगूठी की रस्म तक पहुँचेंगे — मंच के पास लाइव गायक के साथ।'],
      role: {
        groom: ['After the rings, our family blesses Mahak with the shagun.', 'अँगूठी के बाद हमारा परिवार महक को शगुन देकर आशीर्वाद देगा।'],
        bride: ['After the rings, our family blesses Vaibhav with the shagun.', 'अँगूठी के बाद हमारा परिवार वैभव को शगुन देकर आशीर्वाद देगा।']
      },
      ops: 'The couple\u2019s dance runs about 40 minutes and ends on the rings. Book the singer early and rehearse the last song with them.' },
    { id: 'dinner1', fn: 'sangeet', date: '2027-02-01', start: '20:00', end: '23:00', meal: true,
      t: ['Dinner', 'रात्रि भोज'],
      where: ['The lawn', 'लॉन'],
      note: ['Snacks and a full wedding dinner, open from the sagaai right through the sangeet.',
        'सगाई से लेकर संगीत तक — स्नैक्स और पूरा शादी का भोजन।'] },
    { id: 'sangeet', fn: 'sangeet', date: '2027-02-01', start: '21:00', end: '23:00', key: true, art: 'sangeet', alarm: 10,
      t: ['Sangeet', 'संगीत'],
      where: ['The lawn', 'लॉन'],
      note: ['The families perform, then the cousins. At 11 the dancing moves into the banquet hall.',
        'पहले परिवार, फिर कज़िन्स की प्रस्तुतियाँ। रात 11 बजे से नाच-गाना बैंक्वेट हॉल में।'],
      role: {
        groom: ['Our family performs too — if you are in it, tell the choreographer.', 'हमारे परिवार की प्रस्तुति भी है — अगर आप उसमें हैं, तो कोरियोग्राफ़र को बता दीजिए।'],
        bride: ['Our family performs too — if you are in it, tell the choreographer.', 'हमारे परिवार की प्रस्तुति भी है — अगर आप उसमें हैं, तो कोरियोग्राफ़र को बता दीजिए।']
      },
      ops: 'You are running the sangeet outdoors to about 23:00. The legal cut-off for outdoor sound is 22:00 (Noise Rules 2000, rule 5(2)) and Udaipur police have seized equipment at weddings — keep the volume down after 22:00 and the indoor rig ready.' },
    { id: 'afterparty', fn: 'sangeet', date: '2027-02-01', start: '23:00', end: '01:00', key: true, art: 'afterparty',
      t: ['After-party', 'आफ़्टर-पार्टी'],
      where: ['The banquet hall', 'बैंक्वेट हॉल'],
      note: ['Once the family performances are done, the dancing moves indoors — a DJ and late-night snacks until 1 am.',
        'परिवारों की प्रस्तुतियों के बाद नाच-गाना अंदर — डीजे और देर रात के स्नैक्स, रात 1 बजे तक।'],
      ops: 'No bar. The DJ moves from the lawn rig to the banquet hall; tea, coffee and late-night snacks from 22:45.' },

    { id: 'ganesh', fn: 'phere', date: '2027-02-02', start: '07:00', end: '07:30', art: 'ganesh', who: 'bride', side: 'bride',
      t: ['Ganesh Puja', 'गणेश पूजा'],
      where: ['With the bride’s family', 'वधू पक्ष के साथ'],
      note: ['The wedding day begins with Ganesh ji’s blessings.', 'विवाह के दिन की शुरुआत गणेश जी के आशीर्वाद से।'] },
    { id: 'tel', fn: 'phere', date: '2027-02-02', start: '07:30', end: '08:00', who: 'bride', side: 'bride',
      t: ['Tel ceremony', 'तेल की रस्म'],
      where: ['With the bride’s family', 'वधू पक्ष के साथ'],
      note: ['Elders bless the bride with oil in her hair before she gets ready.',
        'तैयार होने से पहले बड़े-बुज़ुर्ग वधू के बालों में तेल लगाकर आशीर्वाद देते हैं।'] },
    { id: 'bf2', date: '2027-02-02', start: '07:30', end: '09:00', sheet: 'phere', who: 'stay', meal: true,
      t: ['Breakfast', 'नाश्ता'],
      where: ['The hotel restaurant', 'होटल का रेस्तराँ'],
      note: ['Closes at 9 — the baraat gathers at 9:15.', '9 बजे बंद — बारात 9:15 पर इकट्ठा होगी।'],
      ops: 'Published as closing at 9:00. Keep it open quietly until 10:00 — do not announce it.' },
    { id: 'sehra', fn: 'phere', date: '2027-02-02', start: '08:45', end: '09:15', who: 'groom', side: 'groom',
      t: ['Sehra bandi', 'सेहराबंदी'],
      where: ['With the groom’s family', 'वर पक्ष के साथ'],
      note: ['The family ties Vaibhav’s sehra before he rides out with the baraat.', 'बारात निकलने से पहले परिवार वैभव को सेहरा बाँधेगा।'] },
    { id: 'baraat', fn: 'phere', date: '2027-02-02', start: '09:30', end: '10:15', key: true, art: 'baraat', alarm: 30, seated: '09:15', gather: true, seatedFor: 'groom',
      t: ['Baraat', 'बारात'],
      where: ['From the hotel porch to the lawn gate', 'होटल के पोर्च से लॉन के द्वार तक'],
      note: ['The groom’s side gathers at the porch; dhol, band and ghodi set off at 9:30. The bride’s side waits at the gate to welcome them.',
        'वर पक्ष पोर्च पर इकट्ठा होगा; ढोल, बैंड और घोड़ी 9:30 पर रवाना होंगे। वधू पक्ष द्वार पर स्वागत करेगा।'],
      role: {
        groom: ['Gather at the hotel porch by 9:15, and dance the baraat all the way to the lawn gate.', 'सुबह 9:15 तक होटल के पोर्च पर पहुँचिए, और लॉन के द्वार तक नाचते हुए बारात लेकर चलिए।'],
        bride: ['Be at the lawn gate by 10 to welcome the baraat.', 'बारात के स्वागत के लिए सुबह 10 बजे तक लॉन के द्वार पर पहुँचिए।']
      } },
    { id: 'milni', fn: 'phere', date: '2027-02-02', start: '10:15', end: '10:30',
      t: ['Milni & dwar puja', 'मिलनी और द्वार पूजा'],
      where: ['The lawn gate', 'लॉन का द्वार'],
      note: ['The two families meet and embrace at the gate.', 'दोनों परिवार द्वार पर एक-दूसरे से गले मिलते हैं।'],
      role: {
        groom: ['Mahak’s family welcomes our elders, each by their counterpart, with a garland and an embrace.', 'महक का परिवार हमारे बड़ों का स्वागत करेगा — हर रिश्ते का उसके समकक्ष से, माला पहनाकर और गले मिलकर।'],
        bride: ['Our elders welcome Vaibhav’s family, each meeting their counterpart with a garland and an embrace.', 'हमारे बड़े वैभव के परिवार का स्वागत करेंगे — हर रिश्ते का उसके समकक्ष से, माला पहनाकर और गले मिलकर।']
      } },
    { id: 'varmala', fn: 'phere', date: '2027-02-02', start: '10:30', end: '11:00', key: true, art: 'varmala', alarm: 15,
      t: ['Varmala', 'वरमाला'],
      where: ['The lawn — the stage', 'लॉन — मंच'],
      note: ['Garlands, a shower of petals — and a great deal of cheering.', 'वरमाला, फूलों की बौछार — और ख़ूब तालियाँ।'] },
    { id: 'phere', fn: 'phere', date: '2027-02-02', start: '11:00', end: '13:00', key: true, art: 'phere', alarm: 20, seated: '10:55',
      t: ['Phere', 'फेरे'],
      where: ['The mandap, on the lawn', 'लॉन पर सजा मंडप'],
      note: ['Kanyadaan, the seven pheras and saptapadi, sindoor and mangalsutra. The muhurat does not wait, so please be in your seat on time.',
        'कन्यादान, सात फेरे और सप्तपदी, सिंदूर और मंगलसूत्र। मुहूर्त किसी की प्रतीक्षा नहीं करता, इसलिए कृपया समय पर अपना स्थान ग्रहण करें।'],
      role: { bride: ['Mahak’s parents perform the kanyadaan.', 'महक के माता-पिता कन्यादान करेंगे।'] },
      ops: 'Pandit to confirm the muhurat in writing. Published panchangs list the 2 Feb vivah muhurat from 17:47 (Delhi); Abhijit muhurat in Udaipur is about 12:26–13:10. Time the pheras themselves inside the window he gives.' },
    { id: 'lunch2', fn: 'phere', date: '2027-02-02', start: '13:00', end: '14:30', meal: true,
      t: ['Wedding lunch', 'विवाह का भोज'],
      where: ['Beside the mandap', 'मंडप के पास'],
      note: ['Served as the pheras close.', 'फेरे संपन्न होते ही भोजन।'] },
    { id: 'vidaai', fn: 'phere', date: '2027-02-02', start: '14:30', end: '15:00', key: true, art: 'vidaai', alarm: 15,
      t: ['Vidaai', 'विदाई'],
      where: ['The hotel porch', 'होटल का पोर्च'],
      note: ['Mahak says goodbye to her family — and the Bhatnagars welcome her home.',
        'महक की अपने परिवार से विदाई — और भटनागर परिवार में उसका स्वागत।'],
      role: {
        groom: ['Vaibhav’s mother welcomes Mahak home with the griha pravesh, at the family suite.', 'वैभव की माँ परिवार के सुइट में गृह प्रवेश कराकर महक का स्वागत करेंगी।'],
        bride: ['We say goodbye to Mahak at the porch.', 'होटल के पोर्च पर हम महक को विदा करेंगे।']
      },
      ops: 'Decorated car or doli at the porch by 14:15; a thali of rice for the bride; the groom\u2019s mother ready for griha pravesh at the family suite.' },
    { id: 'rest2', date: '2027-02-02', start: '15:00', end: '19:00', sheet: 'phere', who: 'stay',
      t: ['Rest', 'विश्राम'],
      where: ['Your room', 'आपका कमरा'],
      note: ['Rest before the reception. It turns cold after dark — bring a shawl.',
        'रिसेप्शन से पहले आराम कीजिए। अँधेरा होते ही ठंड बढ़ जाती है — शॉल साथ रखें।'] },
    { id: 'reception', fn: 'reception', date: '2027-02-02', start: '19:00', end: '23:00', key: true, art: 'reception', alarm: 30,
      t: ['Reception', 'रिसेप्शन'],
      where: ['The lawn', 'लॉन'],
      note: ['Everyone we love, in one evening. The couple arrive at 7:45 and dinner opens at 8.',
        'हमारे सभी प्रियजन, एक ही शाम। नवदंपति 7:45 पर आएँगे और भोजन 8 बजे से।'],
      role: { groom: ['Our family hosts the reception — please come a little early to welcome everyone.', 'रिसेप्शन हमारे परिवार की ओर से है — सबके स्वागत के लिए थोड़ा पहले पहुँचिए।'] } },

    { id: 'bf3', date: '2027-02-03', start: '07:30', end: '10:00', sheet: 'reception', who: 'stay', meal: true,
      t: ['Breakfast & checkout', 'नाश्ता और चेक-आउट'],
      where: ['The hotel restaurant', 'होटल का रेस्तराँ'],
      note: ['Checkout is at 10 am. Tell us your train or flight and we will arrange your drop.',
        'चेक-आउट सुबह 10 बजे। अपनी ट्रेन या फ़्लाइट बता दीजिए, आपको छोड़ने की व्यवस्था हम करेंगे।'] }
  ];

  /* ---------------- Budget ---------------- */
  /* Sums to exactly ₹20,00,000 including contingency. */

  const budget = [
    { id: 'b01', head: 'Haldi brunch', cat: 'Food & Beverage', basis: '170 × ₹475', amount: 80750 },
    { id: 'b02', head: 'Ring Ceremony + Sangeet dinner', cat: 'Food & Beverage', basis: '180 × ₹700', amount: 126000 },
    { id: 'b03', head: 'Wedding lunch (Rajasthani thali)', cat: 'Food & Beverage', basis: '180 × ₹550', amount: 99000 },
    { id: 'b04', head: 'Reception dinner', cat: 'Food & Beverage', basis: '600 × ₹700', amount: 420000 },
    { id: 'b05', head: 'Welcome chaat, breakfasts, crew meals', cat: 'Food & Beverage', basis: 'across 3 days', amount: 38000 },
    { id: 'b06', head: 'Live singer + musicians for the sagaai', cat: 'Entertainment', basis: 'one hour beside the stage — placeholder until quotes', amount: 30000 },
    { id: 'b07', head: 'Venue rental, taxes, generator, extra-hour', cat: 'Venue & Stay', basis: '2 lawns + banquet', amount: 75000 },
    { id: 'b08', head: 'Host-side rooms', cat: 'Venue & Stay', basis: '10 net × 2 nights', amount: 60000 },
    { id: 'b09', head: 'Décor — Haldi', cat: 'Décor', basis: 'daylight, marigold-led', amount: 35000 },
    { id: 'b10', head: 'Décor — Ring + Sangeet', cat: 'Décor', basis: 'stage, LED wall, lighting', amount: 45000 },
    { id: 'b11', head: 'Décor — Baraat, Varmala, Mandap', cat: 'Décor', basis: 'the hero setup', amount: 110000 },
    { id: 'b12', head: 'Décor — Reception', cat: 'Décor', basis: 'backdrop, entry, uplights', amount: 43000 },
    { id: 'b13', head: 'Photography + cinematography', cat: 'Photo & Video', basis: '2+2 crew, drone, teaser, albums', amount: 190000 },
    { id: 'b14', head: 'Sound, DJ, dhol ×2, band, shehnai, folk act', cat: 'Entertainment', basis: '3 days', amount: 62000 },
    { id: 'b15', head: 'Sangeet choreographer', cat: 'Entertainment', basis: '6 sessions + rehearsal', amount: 22000 },
    { id: 'b16', head: 'Hair & makeup', cat: 'Personal', basis: 'bride 4 looks, groom 2, 6 family', amount: 62000 },
    { id: 'b17', head: 'Mehndi artists', cat: 'Personal', basis: 'bridal + 4 artists', amount: 26000 },
    { id: 'b18', head: "Bride's outfits", cat: 'Personal', basis: '2 bought, 2 rented', amount: 75000 },
    { id: 'b19', head: "Groom's outfits", cat: 'Personal', basis: 'sherwani bought, 3 rented', amount: 40000 },
    { id: 'b20', head: 'Pandit, samagri, havan, Ganesh puja', cat: 'Rituals', basis: '—', amount: 28000 },
    { id: 'b21', head: 'Invitations — digital + 120 printed + website', cat: 'Invitations & Gifting', basis: '—', amount: 32000 },
    { id: 'b22', head: 'Welcome hampers (60) + favours (400)', cat: 'Invitations & Gifting', basis: 'one per room', amount: 30000 },
    { id: 'b23', head: 'Guest logistics — transfers, shuttle, ghodi/car', cat: 'Logistics', basis: '—', amount: 34000 },
    { id: 'b24', head: 'Signage, seating charts, menu cards, printing', cat: 'Logistics', basis: '—', amount: 12000 },
    { id: 'b25', head: 'Day-of coordinator', cat: 'Logistics', basis: 'both days, own line — not from contingency', amount: 50000 },
    { id: 'b26', head: 'Contingency', cat: 'Contingency', basis: '8.8% — hold this back', amount: 175250 }
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
    { decision: 'No bar — a dry evening, with the party moving indoors at 11', saving: 125000 },
    { decision: 'Haldi and Phere in daylight — zero lighting spend on 2 of 4 setups', saving: 70000 },
    { decision: 'LED wall rented once, used both nights', saving: 18000 }
  ];

  const protect = [
    'Photography and cinematography — the only thing that outlives the day',
    'The mandap and varmala setup — the phere is the wedding',
    'Reception lighting — 650 guests after dark, lighting is the entire look',
    'Sound quality at the sangeet',
    'A day-of coordinator — now its own ₹50k budget line, not raided from contingency'
  ];

  /* ---------------- Venue ---------------- */

  const venue = {
    status: 'Booked — Hotel Khumani by Hills N Dunes, Bhuwana Bypass',
    /* The booked property. Facts are from the hotel's own site unless marked as
       a listing; the coordinates are the rooftop, read off satellite imagery,
       not the road junction a map search returns. */
    booked: {
      name: 'Hotel Khumani by Hills N Dunes Hotels',
      short: 'Hotel Khumani',
      zone: 'Bhuwana Bypass, Sukher',
      address: 'Plot 2, Bhuwana Bypass, Bhuwana, Udaipur, Rajasthan 313004',
      lat: 24.6263, lon: 73.7139,
      phones: ['+91 76651 78660', '+91 90018 30714'],
      email: 'reservation@hillsnduneshotels.com',
      web: 'https://hillsnduneshotels.com/',
      rooms: 50,
      staysUpTo: 170,           // heads the 50 rooms hold; past this, a second hotel
      earlyRooms: 10,           // held from the night of 31 Jan for early arrivals
      opensForGuests: '08:00',  // on 1 Feb, as agreed with the hotel
      checkout: '10:00',        // on 3 Feb — the hotel's standard checkout
      spaces: [
        'Lawn — 700 seated, 800 floating (listing)',
        'Banquet hall — 300 seated, 350 floating (listing)',
        'Rooftop pool, restaurant, meeting room, parking (hotel)'
      ],
      distances: {
        airport: 17.8, udaipurCity: 6.7, ranaPratapNagar: 5.1, cityPalace: 9.2, fatehSagar: 7.4, pichola: 10
      },
      policies: [
        'Outside catering only — the caterer is ours (listing)',
        'No in-house bar; outside alcohol permitted (listing)',
        'Outside decorators permitted (listing)',
        'Parking for about 30 cars on one listing — agree overflow parking and valets for the reception'
      ]
    },
    brief: [
      'Capacity: 700+ seated on the lawn, plus a second lawn or banquet so the mandap and reception do not share a space',
      'Per-plate: ₹650–800 for 600 all-veg on a Tuesday',
      'Rooms: block at ₹6,500–8,000 including breakfast, guest-paid',
      'Complimentary: 8–10 rooms against a ~₹10L F&B commitment, lawn rental waived',
      'Written confirmation of indoor backup for 180 and 650',
      'Written music policy — outdoor sound must stop at 22:00 by law',
      'Décor: in-house or preferred decorator, no outside-vendor entry fee'
    ],
    shortlist: [
      { name: 'jüSTa Rajputana Resort', zone: 'Hiran Magri', capacity: 'Amber Lawn 22,000 sq ft; Darbar Hall 250 round-table', rooms: '54', note: 'Affordable: 4-star, rooms ₹3,500–5,200 online. Five lawns, and the hotel says select outside vendors are allowed.' },
      { name: 'Padmini Bagh Resort', zone: 'Airport road', capacity: 'Lawn 21,000 sq ft; 3 halls, largest 13,000 sq ft', rooms: '57', note: 'Affordable: 4-star, rooms ₹5,000–5,500 for February dates. The hotel gives two different lawn capacities — ask.' },
      { name: 'Rupis Resort', zone: 'Dabok, by the airport', capacity: 'Two lawns, 1,000+ seated each (listings); halls about 200', rooms: '70', note: 'Affordable: 3-star, standard room ₹2,000 + tax. Publishes 3- and 4-sharing rooms, which suits the room plan.' },
      { name: 'Labh Garh Palace Resort', zone: 'Eklingji Road', capacity: 'Labh Vatika 1,000; Helipad Garden 2,500; Darbar Hall 350', rooms: '80', note: 'Affordable: 4-star, rooms ₹2,800–5,000 online. Hotel venue figures. TA 4.6.' },
      { name: 'Oriental Palace Resort', zone: 'Subhash Nagar', capacity: 'Three lawns, 64,000 sq ft; two halls', rooms: '48', note: 'Affordable: 3-star, deluxe ₹3,999 with breakfast. In the city.' },
      { name: 'jüSTa Ssatva Resort', zone: 'Savina', capacity: 'Urja Lawn 20,020 sq ft; Utsav Banquet 350', rooms: '50', note: 'Affordable: 4-star, ₹4,744 with tax on its site. Four family rooms.' },
      { name: 'The Fern Residency Udaipur', zone: 'Hiran Magri', capacity: 'Lawn listed for 2,000; halls 100–150', rooms: '55', note: 'Affordable: 4-star tier, rooms ₹3,300–5,600. TA 4.7. Indoor space is small.' },
      { name: 'Spectrum Resort', zone: 'NH-76, Kavita', capacity: 'Aravali Bagh 750 at banquet rounds; ballroom 350', rooms: '180', note: 'Affordable on rate (₹3,500–6,100), though one site sells it as 5-star. The only published seated-dinner figure above 650.' },
      { name: 'Amargarh Resort', zone: 'NH-8, Sethji Ki Kundal', capacity: 'Ambar lawn 40,000 sq ft; Antilia hall up to 800', rooms: '53', note: 'Mid-range: 4-star but rooms ₹5,000–10,000. The hall for 800 is the most credible indoor rain plan for 650.' },
      { name: 'The Royal Retreat Resort', zone: 'Badi Hawala Road', capacity: 'Queen\u2019s Garden and others; hall 550 round-table', rooms: '100+', note: 'Mid-range: 5-star, rooms ₹5,900–8,300, January its dearest month. The hall nearly covers a rainy reception.' }
    ],
    travel: {
      airport: 'Maharana Pratap Airport (UDR), Dabok — 18 km from Hotel Khumani, about 35 min',
      rail: 'Udaipur City (UDZ) — 7 km · Rana Pratap Nagar (RPZ) — 5 km',
      road: 'Neemuch 3 hr · Ahmedabad 4.5 hr (NH-48) · Kota 5 hr · Jaipur 6 hr (NH-58) · Indore 6.5 hr',
      weather: 'Early Feb: days 24–27°C, nights 9–12°C. Sunrise 07:16, sunset 18:19.',
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
    { id: 'v12', cat: 'Live singer', name: '', target: 30000, status: 'To book', by: '2026-12-15', note: 'For the sagaai: an hour beside the stage while the couple and their friends dance into the rings. Rehearse the last song together.' }
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
    { id: 'c13', phase: 'Dec 2026', task: 'Lock guest list at 180 core / 650 reception', owner: 'Families' },
    { id: 'c14', phase: 'Dec 2026', task: 'Confirm room block and circulate the booking link', owner: 'Vaibhav' },
    { id: 'c15', phase: 'Jan 2027', task: 'Dispatch printed invites by 5 Jan', owner: 'Families' },
    { id: 'c16', phase: 'Jan 2027', task: 'Tasting #2, sign off final menus', owner: 'Both' },
    { id: 'c17', phase: 'Jan 2027', task: 'Approve décor layout and mock-up', owner: 'Mahak' },
    { id: 'c18', phase: 'Jan 2027', task: 'Build travel-desk sheet from RSVP travel data', owner: 'Vaibhav' },
    { id: 'c19', phase: 'Jan 2027', task: 'Room allocation for host-paid and family rooms', owner: 'Both' },
    { id: 'c20', phase: 'Jan 2027', task: 'Rehearse the sagaai dance with the live singer', owner: 'Both' },
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
    { risk: 'Outdoor loudspeakers must stop at 22:00', action: 'Noise Rules 2000, rule 5(2): after 22:00 amplified sound only in closed premises such as a banquet hall. You are running the sangeet outdoors to about 23:00 and managing it yourselves; the after-party is already indoors in the banquet hall. Udaipur police have seized equipment at weddings, so keep the volume down after 22:00.' },
    { risk: 'Night temperatures of 9–12°C', action: '12 patio heaters at ₹800–1,200/day (~₹15k for two nights, from contingency) plus shawl favours. Guests remember being cold.' },
    { risk: 'Sunset at 18:19', action: 'All outdoor daytime functions finish well before dark. Test the evening lighting at 17:00.' },
    { risk: 'The phere muhurat', action: 'Published panchangs give the 2 Feb 2027 vivah muhurat as 17:47 onwards (Delhi). The 11:00–13:00 phere relies on the pandit — get the exact window in writing. Abhijit muhurat in Udaipur is about 12:26–13:10.' },
    { risk: 'Guests late to the moments that cannot move', action: 'Published times never overlap; breakfasts close before the next event on paper and stay open quietly. The folk evening and the baraat are deliberate soft starts. Calendar reminders go out 15–30 minutes before each key event.' },
    { risk: 'Drone airspace near Dabok airport and the lakes', action: 'Confirm a DGCA-compliant registered drone and get written venue clearance.' },
    { risk: 'Unseasonal rain', action: 'Written confirmation the venue can move 180 (sangeet) and 650 (reception) indoors.' },
    { risk: 'Old-city traffic in peak season', action: 'Keep the venue out of the old city, or add 45 minutes to every transfer.' },
    { risk: 'Vendor advances', action: 'Never more than 30% upfront. Hold 30% until after the event. Written cancellation and postponement clause in every contract.' },
    { risk: 'Catering guarantee inflation', action: 'Venues bill max(guarantee, actual). Commit 180 and 600, never the full invite count. Negotiate 5% flex, final numbers 72 hours out.' },
    { risk: 'Feb 2027 muhurat clustering', action: 'Verify against a 2027 panchang whether 1–2 Feb is a heavy vivah date. Basant Panchami is around 11 Feb. Heavy dates mean +15% rates and thin availability.' }
  ];

  const assumptions = [
    'Excluded from the ₹20L: heirloom/investment jewellery, shagun and cash gifts, guests\u2019 airfare and rail fare, guests\u2019 room tariffs, honeymoon.',
    'Included in the ₹20L: all four functions, both wardrobes, hair and makeup, décor, photography, entertainment, logistics.',
    'Guest rooms are blocked at a negotiated rate and paid by guests. The host covers 10 rooms. The block is ~52 rooms — see PLAN.md §9a.',
    'All functions at a single property — Hotel Khumani, Bhuwana Bypass. Food is all-vegetarian.',
    'No full planner fee is budgeted. A ₹50k day-of coordinator is its own line; contingency stays at 8% and untouched.'
  ];

  const openQuestions = [
    'Is jewellery inside the ₹20L? If yes, the guest count must drop. Biggest unknown in the plan.',
    'Who pays for guest rooms? The plan assumes guests do, with the host covering 10.',
    'Non-veg at any function? It adds 25–35% per plate where served.',
    'How many of the 180 are outstation, and flying vs driving? This sizes the travel desk and room block.'
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
      // The hotel opens to guests at 08:00 on 1 Feb, so that is the default arrival.
      arrival: local ? '' : '2027-02-01', arrivalTime: '', departure: local ? '' : '2027-02-03',
      mode: local ? 'Car' : '', travelDetail: '', pickup: '',
      needsRoom: !local,
      hotel: local ? '' : 'Hotel Khumani — guest room block',
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
    { title: 'The venue is Hotel Khumani', created_at: '2026-10-25',
      body: 'Everything happens at Hotel Khumani on the Bhuwana Bypass, Udaipur. Haldi, sagaai, sangeet ' +
            'and the after-party on 1 February; baraat, varmala, phere, vidaai and the reception on 2 February.' }
  ];

  /* The wedding guide shown in every guest's portal. The invitation page has
     the full bilingual version in content.js; this is the short English one. */
  const guide = [
    {
      title: 'Arriving on 1 February',
      icon: 'kalash',
      items: [
        ['The hotel opens at 8 am', 'Come straight to Hotel Khumani whenever you land or arrive. You can check in, shower and change before anything starts.'],
        ['Breakfast until 10:30', 'In the hotel restaurant. Eat first, unpack later.'],
        ['Haldi at 11', 'That is deliberate: three hours between the hotel opening and anyone being needed anywhere.'],
        ['If you arrive the night before', 'Ten rooms are held from the night of 31 January for family arriving early. Tell us in your RSVP — do not book anything yourself.']
      ]
    },
    {
      title: 'Weather & packing',
      icon: 'kalash',
      items: [
        ['Days', '24–27°C and sunny. Sunglasses, and sunscreen for the haldi lawn.'],
        ['Nights', '9–12°C. The evening functions are outdoors. A shawl or jacket is genuinely necessary.'],
        ['Also bring', 'Comfortable shoes for the lawn, any medication you need, and a power bank.']
      ]
    },
    {
      title: 'Good to know',
      icon: 'mandala',
      items: [
        ['Everything is at one venue', 'Hotel Khumani, Bhuwana Bypass. No travelling between functions.'],
        ['The folk evening', 'Kalbeliya and Ghoomar dancers open the evening of 1 February and will pull you up to dance.'],
        ['Help', 'Hotel Khumani reception: +91 76651 78660 or +91 90018 30714.']
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

  /* ---------------- Still to confirm ---------------- */

  /* Everything the website publishes but the families have not yet settled.
     The planner dashboard lists these and the smoke test counts them, so a
     guess cannot quietly become a fact. Remove a line once it is confirmed. */
  const toConfirm = [
    { what: 'Phere muhurat', detail: 'Pandit to confirm 11:00–13:00 on 2 Feb for Udaipur in writing. Published panchangs list the vivah muhurat from 17:47; Abhijit muhurat is about 12:26–13:10.' },
    { what: 'Family help-desk numbers', detail: 'The site shows the hotel reception for now. Add one number per side.' },
    { what: 'Where each event happens inside Khumani', detail: 'Fixed: the haldi, sagaai and sangeet on the lawn, and the after-party in the banquet hall from 23:00. Not decided: the phere, on the rooftop or in the garden; the site says "the lawn" until then. Confirm the reception, the lunches and the vidaai at the porch with the hotel.' },
    { what: 'A second hotel past 170 staying guests', detail: 'Khumani\u2019s 50 rooms hold about 170 people. If more need a room, book a hotel near the Bhuwana Bypass for the overflow and set each moved party\u2019s Hotel in their guest record, so their guest page shows it. The invitation does not mention a second hotel.' },
    { what: 'Reception parking', detail: 'One listing gives parking for about 30 cars. Agree overflow parking and valets for 650 guests.' },
    { what: 'Caterer', detail: 'Khumani is outside-catering only. Book the caterer for every meal, and the late-night snacks at the after-party.' },
    { what: 'Budget lines that moved', detail: 'The haldi meal is now a full lunch (budget assumes a ₹475 brunch) — re-cost it. The old bar line now pays for the sagaai\u2019s live singer; ₹30,000 is a placeholder until you have quotes.' },
    { what: 'Each family\u2019s part, on its card', detail: 'The \u201cour family\u2019s part\u201d lines on both cards are a first draft. Each family should read its own card and correct them in the programme (the role field).' },
    { what: 'An RSVP WhatsApp number for each family', detail: 'Each card can send replies to its own family. Add one number per side in sides, near the top of data.js; until then the WhatsApp button stays hidden.' },
    { what: 'The two addresses', detail: 'Buy vaibhavwedsmahak.in and mahakwedsvaibhav.in and point both at the site (README: \u201cTwo cards, two addresses\u201d). Until then, Mahak\u2019s card is mahak.html on the current address.' },
    { what: 'Vidaai at 14:30', detail: 'Placed after the wedding lunch, before the reception. Confirm with both families.' },
    { what: 'Permission for the venue painting', detail: 'The Mewar-style painting is made from the hotel\u2019s own photograph. Tell the hotel and get a yes.' }
  ];

  /* ---------------- Run sheets ---------------- */

  /* The planner reads fn.schedule as [time, guestText, plannerNote] rows. Build
     them from the programme so a time can only ever be changed in one place.
     Rows after midnight sort to the end of the evening; a beat on a later date
     (the 3 Feb checkout, filed under the reception) sorts after everything. */
  (function buildRunSheets() {
    function key(e, base) {
      const p = String(e.time).split(':');
      let m = Number(p[0]) * 60 + Number(p[1] || 0);
      if (m < 240) m += 1440;
      if (e.date && e.date > base) m += 2880;
      return m;
    }
    functions.forEach(function (f) {
      const rows = programme
        .filter(function (e) { return (e.fn || e.sheet) === f.id; })
        .map(function (e) {
          const when = e.date !== f.date ? e.start + ' (' + Number(e.date.slice(8)) + ' Feb)' : e.start;
          const guest = e.t[0] + (e.end ? ' ' + e.start + '–' + e.end : '') + ' · ' + e.where[0];
          return { time: e.start, date: e.date, row: [when, guest, e.ops || ''] };
        });
      (f.ops || []).forEach(function (o) {
        rows.push({ time: o[0], date: f.date, row: [o[0], null, o[1]] });
      });
      rows.sort(function (a, b) { return key(a, f.date) - key(b, f.date); });
      f.schedule = rows.map(function (r) { return r.row; });
    });
  })();

  W.data = {
    couple: couple,
    sides: sides,
    functions: functions,
    programme: programme,
    toConfirm: toConfirm,
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
