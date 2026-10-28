/* English and Hindi. Interface strings live in DICT; wedding content carries
   its own [english, hindi] pairs in data.js and content.js and goes through
   pick(). Devanagari must never be letter-spaced or split into characters —
   both break the shirorekha — so invite.css and invite.js check the language
   before doing either. A key can have a per-family version, 'key@bride',
   which wins on Mahak's family's card (see side.js). */
window.W = window.W || {};

(function (W) {
  'use strict';

  const STORE = 'vm-lang';

  const DICT = {
    en: {
      'nav.programme': 'Programme', 'nav.venue': 'Venue', 'nav.stay': 'Stay', 'nav.travel': 'Travel',
      'nav.faq': 'Questions', 'nav.help': 'Help', 'nav.rsvp': 'RSVP',
      'nav.me': 'My details', 'nav.menu': 'Menu', 'nav.close': 'Close',
      'lang.switch': 'हिन्दी', 'lang.label': 'हिन्दी में पढ़ें',
      'sound.on': 'Play the shehnai', 'sound.off': 'Pause the shehnai',

      'names.pair': 'Vaibhav & Mahak', 'names.pair@bride': 'Mahak & Vaibhav',
      'gate.sub': 'Udaipur · February 2027',
      'gate.hint': 'Tap the seal to open',
      'gate.aria': 'Break the seal and open the invitation',

      'card.pre': 'With the blessings of our elders, the Bhatnagar family invites you to the wedding of',
      'card.pre@bride': 'With the blessings of our elders, the Kalra family invites you to the wedding of',
      'card.groom': 'Vaibhav', 'card.weds': 'weds', 'card.bride': 'Mahak',
      'card.son': 'Son of', 'card.daughter': 'Daughter of',
      'card.groomParents': 'Kamla Srivastava & Ved Prakash Bhatnagar',
      'card.brideParents': 'Riya Kalra & Kishore Kalra',
      'card.date': 'Monday 1 & Tuesday 2 February 2027',
      'card.muhurat': 'Phere · 2 February · 11:00 am – 1:00 pm',
      'card.place': 'Hotel Khumani · Bhuwana, Udaipur',
      'hero.scroll': 'scroll',
      'btn.programme': 'See the programme', 'btn.ics': 'Add to calendar', 'btn.share': 'Share',

      'cd.d': 'Days', 'cd.h': 'Hours', 'cd.m': 'Minutes', 'cd.s': 'Seconds',
      'cd.to': 'until the pheras begin',

      'now.now': 'Happening now', 'now.next': 'Next', 'now.until': 'until {t}',
      'now.in': 'in {n} min', 'now.at': 'at {t}', 'now.see': 'Programme',

      'prog.eyebrow': 'The celebrations',
      'prog.title': 'Two days, in order',
      'prog.lead': 'Every event at Hotel Khumani, in the order it happens. The paintings mark the moments you will not want to miss; meals and rest are listed too, so you always know where to be.',
      'prog.day.2027-02-01': 'Day one', 'prog.day.2027-02-02': 'Day two', 'prog.day.2027-02-03': 'Farewell morning',
      'prog.sun': 'Sunrise {a} · sunset {b}',
      'prog.seated': 'Please be seated by {t}', 'prog.gather': 'Gather at {t}',
      'prog.where': 'Where', 'prog.ours': 'Our family’s part',
      'duties.title': 'What our family does', 'duties.lead': 'Every moment where our family has a part to play, in order.',
      'prog.cal': 'Put every event in your phone, with a reminder before each one',
      'who.stay': 'For guests staying at the hotel', 'who.bride': 'The bride’s family', 'who.groom': 'The groom’s family',

      'venue.eyebrow': 'The venue',
      'venue.title': 'Hotel Khumani, Udaipur',
      'venue.lead': 'Fly in over the lakes of the old city to Bhuwana, where every function happens under one roof.',
      'venue.scroll': 'Scroll to fly', 'venue.skip': 'Skip the flight',
      'venue.portrait': 'Hotel Khumani, painted in the Mewar style for our invitation',
      'venue.addrLabel': 'Address',
      'venue.addr': 'Plot 2, Bhuwana Bypass, Bhuwana, Udaipur, Rajasthan 313004',
      'venue.maps': 'Open in Google Maps', 'venue.dir': 'Directions', 'venue.call': 'Call the hotel',
      'venue.copy': 'Copy address', 'venue.copied': 'Address copied.',
      'venue.spaces': 'Where things happen', 'venue.far': 'How far',
      'venue.static': 'The flight needs a newer browser — here is the venue instead.',

      'stay.eyebrow': 'Staying with us', 'stay.title': 'Your room is held',
      'stay.lead': 'If you are staying with us, your room is arranged for you, so there is nothing to book.',

      'travel.eyebrow': 'Getting there', 'travel.title': 'Travel & weather',
      'travel.lead': 'Udaipur in early February is warm by day and properly cold after dark. Pickups from the airport and both stations are on us.',
      'wx.title': 'Weather',
      'wx.normal': 'Usual for these dates: days {hi}, nights {lo}. Sunrise {sr}, sunset {ss}.',
      'wx.live': 'Forecast for the hotel', 'wx.rain': '{p}% rain',
      'wx.note': 'The live forecast appears here in the last two weeks before the wedding.',

      'faq.eyebrow': 'Good to know', 'faq.title': 'Your questions, answered',
      'faq.lead': 'If something is not here, call the help desk below and we will sort it out.',
      'faq.search': 'Search — parking, checkout, weather…', 'faq.none': 'Nothing matches. Try another word, or call us.',

      'help.eyebrow': 'Help desk', 'help.title': 'Someone is always on call',
      'help.lead': 'For anything at all — a late train, a lost charger, a room swap.',

      'portal.eyebrow': 'Just for you', 'portal.title': 'Your own invitation',
      'portal.body': 'Enter your mobile number to see your room, your pickup, only the functions you are invited to, and the photo albums as they fill up.',
      'portal.btn': 'Open my details',

      'rsvp.eyebrow': 'Please reply', 'rsvp.title': 'RSVP',
      'rsvp.lead': 'Kindly respond by 20 January 2027. Knowing your numbers early genuinely helps us plan.',
      'rsvp.name': 'Your name (or family name)', 'rsvp.namePh': 'e.g. Sharma Family',
      'rsvp.phone': 'Mobile number', 'rsvp.phonePh': '10 digits',
      'rsvp.city': 'City you travel from', 'rsvp.cityPh': 'e.g. Delhi',
      'rsvp.side': 'Whose side?', 'rsvp.sideBride': 'Bride — Mahak', 'rsvp.sideGroom': 'Groom — Vaibhav',
      'rsvp.attending': 'Will you join us?',
      'rsvp.yes': 'Yes, joyfully', 'rsvp.some': 'Yes, but only for some functions', 'rsvp.no': 'Sadly cannot make it',
      'rsvp.adults': 'Adults attending', 'rsvp.kids': 'Children attending',
      'rsvp.fns': 'Which functions will you attend?',
      'rsvp.diet': 'Food preference', 'rsvp.arrival': 'Arriving in Udaipur on',
      'rsvp.mode': 'Travelling by', 'rsvp.flight': 'Flight', 'rsvp.train': 'Train', 'rsvp.car': 'Car',
      'rsvp.bus': 'Bus', 'rsvp.undecided': 'Not decided',
      'rsvp.detail': 'Flight / train number & arrival time', 'rsvp.detailPh': 'e.g. 6E 6521, 14:30',
      'rsvp.notes': 'Anything we should know?',
      'rsvp.notesPh': 'Arriving on 31 January, mobility needs, allergies, a song for the sangeet…',
      'rsvp.send': 'Send RSVP', 'rsvp.wa': 'Send on WhatsApp',
      'rsvp.hint': 'If you would rather just call, the help-desk numbers are above.',
      'rsvp.thanks': 'Thank you, {n}!',
      'rsvp.missYou': 'We will miss you, truly. Thank you for letting us know — we will raise a glass in your name.',
      'rsvp.got': 'We have your reply. We will be in touch about your room and pickup closer to the date.',
      'rsvp.copy': 'Copy my reply', 'rsvp.mine': 'See my details', 'rsvp.another': 'Add another family',
      'diet.Veg': 'Veg', 'diet.Jain': 'Jain', 'diet.No onion/garlic': 'No onion/garlic', 'diet.Vegan': 'Vegan', 'diet.Non-veg': 'Non-veg',

      'foot.dates': '1 & 2 February 2027 · Hotel Khumani, Udaipur',
      'foot.links': 'My details · Planning console',
      'foot.credits': 'Paintings made for this invitation. Map imagery © Esri, Maxar, Earthstar Geographics; terrain © Mapzen and AWS Open Data. Shehnai: “Traditional wedding ceremonial vibe” by DesiFreeMusic, Pixabay.',

      'toast.ics': 'Calendar file downloaded — open it to add every event, with reminders.',
      'toast.copied': 'Invitation link copied.', 'toast.nocopy': 'Copy the link from the address bar to share.',
      'toast.name': 'Please tell us your name.', 'toast.copiedReply': 'Copied — paste it to us on WhatsApp.',
      'share.text': 'We are getting married in Udaipur! 1 & 2 February 2027. Details and RSVP:'
    },

    hi: {
      'nav.programme': 'कार्यक्रम', 'nav.venue': 'विवाह स्थल', 'nav.stay': 'ठहरना', 'nav.travel': 'यात्रा',
      'nav.faq': 'सवाल-जवाब', 'nav.help': 'सहायता', 'nav.rsvp': 'उपस्थिति',
      'nav.me': 'मेरी जानकारी', 'nav.menu': 'मेन्यू', 'nav.close': 'बंद करें',
      'lang.switch': 'English', 'lang.label': 'Read in English',
      'sound.on': 'शहनाई चलाएँ', 'sound.off': 'शहनाई रोकें',

      'names.pair': 'वैभव और महक', 'names.pair@bride': 'महक और वैभव',
      'gate.sub': 'उदयपुर · फ़रवरी 2027',
      'gate.hint': 'खोलने के लिए मुहर छुएँ',
      'gate.aria': 'मुहर तोड़कर निमंत्रण खोलें',

      'card.pre': 'बड़ों के आशीर्वाद से, भटनागर परिवार आपको इस शुभ विवाह में सादर आमंत्रित करता है',
      'card.pre@bride': 'बड़ों के आशीर्वाद से, कालरा परिवार आपको इस शुभ विवाह में सादर आमंत्रित करता है',
      'card.groom': 'चि. वैभव', 'card.weds': 'संग', 'card.bride': 'सौ.कां. महक',
      'card.son': 'सुपुत्र', 'card.daughter': 'सुपुत्री',
      'card.groomParents': 'श्रीमती कमला श्रीवास्तव एवं श्री वेद प्रकाश भटनागर',
      'card.brideParents': 'श्रीमती रिया कालरा एवं श्री किशोर कालरा',
      'card.date': 'सोमवार 1 एवं मंगलवार 2 फ़रवरी 2027',
      'card.muhurat': 'फेरे · 2 फ़रवरी · सुबह 11:00 से दोपहर 1:00',
      'card.place': 'होटल खुमानी · भुवाणा, उदयपुर',
      'hero.scroll': 'नीचे देखें',
      'btn.programme': 'कार्यक्रम देखें', 'btn.ics': 'कैलेंडर में जोड़ें', 'btn.share': 'साझा करें',

      'cd.d': 'दिन', 'cd.h': 'घंटे', 'cd.m': 'मिनट', 'cd.s': 'सेकंड',
      'cd.to': 'फेरों में बाक़ी',

      'now.now': 'अभी चल रहा है', 'now.next': 'अगला', 'now.until': '{t} तक',
      'now.in': '{n} मिनट में', 'now.at': '{t} पर', 'now.see': 'कार्यक्रम',

      'prog.eyebrow': 'उत्सव',
      'prog.title': 'दो दिन, क्रम से',
      'prog.lead': 'होटल खुमानी में हर कार्यक्रम, उसी क्रम में जिसमें वह होगा। चित्र उन पलों के हैं जिन्हें आप बिल्कुल नहीं छोड़ना चाहेंगे; भोजन और आराम का समय भी दिया है, ताकि आपको हमेशा पता रहे कि कहाँ पहुँचना है।',
      'prog.day.2027-02-01': 'पहला दिन', 'prog.day.2027-02-02': 'दूसरा दिन', 'prog.day.2027-02-03': 'विदा की सुबह',
      'prog.sun': 'सूर्योदय {a} · सूर्यास्त {b}',
      'prog.seated': 'कृपया {t} तक अपना स्थान ग्रहण कर लें', 'prog.gather': '{t} पर इकट्ठा हों',
      'prog.where': 'कहाँ', 'prog.ours': 'हमारे परिवार की भूमिका',
      'duties.title': 'हमारे परिवार की ज़िम्मेदारियाँ', 'duties.lead': 'जिन पलों में हमारे परिवार की भूमिका है, क्रम से।',
      'prog.cal': 'हर कार्यक्रम अपने फ़ोन में जोड़ें — हर एक से पहले याद दिलाने वाली सूचना के साथ',
      'who.stay': 'होटल में ठहरे मेहमानों के लिए', 'who.bride': 'वधू पक्ष', 'who.groom': 'वर पक्ष',

      'venue.eyebrow': 'विवाह स्थल',
      'venue.title': 'होटल खुमानी, उदयपुर',
      'venue.lead': 'पुराने शहर की झीलों के ऊपर से उड़ते हुए भुवाणा चलिए — जहाँ सारे कार्यक्रम एक ही छत के नीचे होंगे।',
      'venue.scroll': 'उड़ने के लिए स्क्रॉल करें', 'venue.skip': 'उड़ान छोड़ें',
      'venue.portrait': 'हमारे निमंत्रण के लिए मेवाड़ शैली में चित्रित होटल खुमानी',
      'venue.addrLabel': 'पता',
      'venue.addr': 'प्लॉट 2, भुवाणा बायपास, भुवाणा, उदयपुर, राजस्थान 313004',
      'venue.maps': 'गूगल मैप्स में खोलें', 'venue.dir': 'रास्ता देखें', 'venue.call': 'होटल को फ़ोन करें',
      'venue.copy': 'पता कॉपी करें', 'venue.copied': 'पता कॉपी हो गया।',
      'venue.spaces': 'कौन-सा कार्यक्रम कहाँ', 'venue.far': 'कितनी दूर',
      'venue.static': 'उड़ान के लिए नया ब्राउज़र चाहिए — तब तक विवाह स्थल यहाँ देखिए।',

      'stay.eyebrow': 'हमारे साथ ठहरना', 'stay.title': 'आपका कमरा आरक्षित है',
      'stay.lead': 'यदि आप हमारे साथ ठहर रहे हैं, तो आपके कमरे की व्यवस्था हमारी ओर से है — आपको कुछ भी बुक नहीं करना है।',

      'travel.eyebrow': 'कैसे पहुँचें', 'travel.title': 'यात्रा और मौसम',
      'travel.lead': 'फ़रवरी की शुरुआत में उदयपुर में दिन गुनगुने और रातें सचमुच ठंडी होती हैं। हवाई अड्डे और दोनों स्टेशनों से पिकअप हमारी ओर से है।',
      'wx.title': 'मौसम',
      'wx.normal': 'इन दिनों का सामान्य मौसम: दिन में {hi}, रात में {lo}। सूर्योदय {sr}, सूर्यास्त {ss}।',
      'wx.live': 'होटल के लिए मौसम का पूर्वानुमान', 'wx.rain': 'बारिश {p}%',
      'wx.note': 'विवाह से पहले के आख़िरी दो हफ़्तों में यहाँ ताज़ा पूर्वानुमान दिखेगा।',

      'faq.eyebrow': 'ज़रूरी बातें', 'faq.title': 'आपके सवाल, हमारे जवाब',
      'faq.lead': 'अगर कोई बात यहाँ नहीं है, तो नीचे दिए नंबर पर फ़ोन कीजिए — हम सँभाल लेंगे।',
      'faq.search': 'खोजें — पार्किंग, चेक-आउट, मौसम…', 'faq.none': 'कुछ नहीं मिला। कोई और शब्द आज़माइए, या हमें फ़ोन कीजिए।',

      'help.eyebrow': 'सहायता', 'help.title': 'हम हमेशा उपलब्ध हैं',
      'help.lead': 'किसी भी बात के लिए — देर से आती ट्रेन, खोया हुआ चार्जर, कमरा बदलना।',

      'portal.eyebrow': 'सिर्फ़ आपके लिए', 'portal.title': 'आपका अपना निमंत्रण',
      'portal.body': 'अपना मोबाइल नंबर डालिए और देखिए — आपका कमरा, आपकी पिकअप, सिर्फ़ वे कार्यक्रम जिनमें आप आमंत्रित हैं, और तस्वीरों के एल्बम।',
      'portal.btn': 'मेरी जानकारी खोलें',

      'rsvp.eyebrow': 'कृपया उत्तर दें', 'rsvp.title': 'उपस्थिति',
      'rsvp.lead': 'कृपया 20 जनवरी 2027 तक उत्तर दें। जल्दी जानकारी मिलने से हमें तैयारी में सचमुच बहुत मदद मिलती है।',
      'rsvp.name': 'आपका नाम (या परिवार का नाम)', 'rsvp.namePh': 'जैसे शर्मा परिवार',
      'rsvp.phone': 'मोबाइल नंबर', 'rsvp.phonePh': '10 अंक',
      'rsvp.city': 'आप किस शहर से आ रहे हैं', 'rsvp.cityPh': 'जैसे दिल्ली',
      'rsvp.side': 'किस पक्ष से?', 'rsvp.sideBride': 'वधू पक्ष — महक', 'rsvp.sideGroom': 'वर पक्ष — वैभव',
      'rsvp.attending': 'क्या आप पधारेंगे?',
      'rsvp.yes': 'हाँ, ख़ुशी से', 'rsvp.some': 'हाँ, पर कुछ ही कार्यक्रमों में', 'rsvp.no': 'खेद है, नहीं आ पाएँगे',
      'rsvp.adults': 'कितने वयस्क', 'rsvp.kids': 'कितने बच्चे',
      'rsvp.fns': 'आप किन कार्यक्रमों में आएँगे?',
      'rsvp.diet': 'भोजन की पसंद', 'rsvp.arrival': 'उदयपुर पहुँचने की तारीख़',
      'rsvp.mode': 'यात्रा का साधन', 'rsvp.flight': 'हवाई जहाज़', 'rsvp.train': 'ट्रेन', 'rsvp.car': 'कार',
      'rsvp.bus': 'बस', 'rsvp.undecided': 'अभी तय नहीं',
      'rsvp.detail': 'फ़्लाइट / ट्रेन नंबर और पहुँचने का समय', 'rsvp.detailPh': 'जैसे 6E 6521, दोपहर 2:30',
      'rsvp.notes': 'कुछ और जो हमें जानना चाहिए?',
      'rsvp.notesPh': '31 जनवरी को आगमन, चलने-फिरने में दिक़्क़त, एलर्जी, संगीत के लिए कोई गाना…',
      'rsvp.send': 'उत्तर भेजें', 'rsvp.wa': 'व्हाट्सऐप पर भेजें',
      'rsvp.hint': 'अगर आप सीधे फ़ोन करना चाहें, तो सहायता के नंबर ऊपर दिए हैं।',
      'rsvp.thanks': 'धन्यवाद, {n}!',
      'rsvp.missYou': 'आपकी कमी सचमुच खलेगी। बताने के लिए धन्यवाद — हम आपको याद करेंगे।',
      'rsvp.got': 'आपका उत्तर मिल गया। तारीख़ के क़रीब हम आपके कमरे और पिकअप के बारे में संपर्क करेंगे।',
      'rsvp.copy': 'मेरा उत्तर कॉपी करें', 'rsvp.mine': 'मेरी जानकारी देखें', 'rsvp.another': 'एक और परिवार जोड़ें',
      'diet.Veg': 'शाकाहारी', 'diet.Jain': 'जैन', 'diet.No onion/garlic': 'बिना प्याज़-लहसुन', 'diet.Vegan': 'वीगन', 'diet.Non-veg': 'मांसाहारी',

      'foot.dates': '1 एवं 2 फ़रवरी 2027 · होटल खुमानी, उदयपुर',
      'foot.links': 'मेरी जानकारी · योजना कक्ष',
      'foot.credits': 'चित्र इसी निमंत्रण के लिए बनाए गए हैं। मानचित्र © Esri, Maxar, Earthstar Geographics; भू-आकृति © Mapzen और AWS Open Data। शहनाई: DesiFreeMusic, Pixabay।',

      'toast.ics': 'कैलेंडर फ़ाइल डाउनलोड हो गई — खोलकर सारे कार्यक्रम रिमाइंडर के साथ जोड़ें।',
      'toast.copied': 'निमंत्रण का लिंक कॉपी हो गया।', 'toast.nocopy': 'साझा करने के लिए ऊपर से लिंक कॉपी करें।',
      'toast.name': 'कृपया अपना नाम बताइए।', 'toast.copiedReply': 'कॉपी हो गया — व्हाट्सऐप पर हमें भेज दीजिए।',
      'share.text': 'हमारा विवाह उदयपुर में है! 1 एवं 2 फ़रवरी 2027। पूरा कार्यक्रम और उत्तर देने के लिए:'
    }
  };

  const MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
  };
  const DAYS = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']
  };

  let lang = 'en';
  try { lang = localStorage.getItem(STORE) || ''; } catch (e) { /* storage blocked */ }
  if (lang !== 'en' && lang !== 'hi') {
    const nav = (window.navigator && (navigator.language || '')) || '';
    lang = /^hi\b/i.test(nav) ? 'hi' : 'en';
  }

  const listeners = [];

  function fill(s, vars) {
    return !vars ? s : String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] === undefined ? m : vars[k];
    });
  }

  function t(key, vars) {
    const mine = key + '@' + (W.side || 'groom');
    const here = DICT[lang] || {};
    const s = here[mine] || here[key] || DICT.en[mine] || DICT.en[key];
    return fill(s === undefined ? key : s, vars);
  }

  /* Content values are either a plain string or an [english, hindi] pair. */
  function pick(v) {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return (lang === 'hi' && v[1]) ? v[1] : (v[0] || '');
    if (typeof v === 'object') return v[lang] || v.en || '';
    return String(v);
  }

  /* "19:30" -> "7:30 pm", or "शाम 7:30". Hindi names the part of the day,
     which is how the time is said aloud, rather than tacking on am/pm. */
  function time(hhmm) {
    const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
    if (!m) return hhmm || '';
    const h = Number(m[1]), mm = m[2];
    const h12 = ((h + 11) % 12) + 1;
    if (lang === 'hi') {
      const part = h >= 4 && h < 12 ? 'सुबह' : h >= 12 && h < 16 ? 'दोपहर' : h >= 16 && h < 20 ? 'शाम' : 'रात';
      return part + ' ' + h12 + ':' + mm;
    }
    return h12 + ':' + mm + ' ' + (h < 12 ? 'am' : 'pm');
  }

  function span(a, b) {
    if (!b) return time(a);
    if (lang === 'hi') {
      // "रात 8:00 – 9:00", not "रात 8:00 – रात 9:00", when both share a part of day.
      const ta = time(a), tb = time(b);
      const pa = ta.split(' ')[0], pb = tb.split(' ')[0];
      return pa === pb ? ta + ' – ' + tb.slice(pb.length + 1) : ta + ' – ' + tb;
    }
    // "11:00 am – 1:30 pm", but "7:00 – 8:00 pm" when both share the half-day.
    const sameHalf = (Number(a.slice(0, 2)) < 12) === (Number(b.slice(0, 2)) < 12) &&
      !(Number(a.slice(0, 2)) >= 20 && Number(b.slice(0, 2)) < 4);
    return sameHalf ? time(a).replace(/ [ap]m$/, '') + ' – ' + time(b) : time(a) + ' – ' + time(b);
  }

  function date(iso, opts) {
    const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!p) return '';
    const d = new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3]));
    const o = opts || {};
    const day = DAYS[lang][d.getDay()];
    const md = d.getDate() + ' ' + MONTHS[lang][d.getMonth()] + (o.year ? ' ' + d.getFullYear() : '');
    if (o.day === false) return md;
    return lang === 'hi' ? day + ', ' + md : day + ' ' + md;
  }

  /* data-i18n="key" sets text; data-i18n-html sets markup;
     data-i18n-attr="placeholder:key;aria-label:key2" sets attributes. */
  function apply(root) {
    const scope = root || document;
    if (!scope.querySelectorAll) return;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n]'), function (el) {
      const text = t(el.getAttribute('data-i18n'));
      if (el.hasAttribute('data-split')) {
        // A split heading is a row of spans; rewrite it whole. Hindi stays one
        // text node — splitting Devanagari into characters breaks its joins.
        el.setAttribute('aria-label', text);
        el.textContent = text;
        if (lang === 'en' && W.motion && el.getAttribute('data-split') === 'chars') {
          el.dataset.splitDone = '';
          W.motion.splitChars(el);
        }
      } else {
        el.textContent = text;
      }
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-html]'), function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-attr]'), function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        const kv = pair.split(':');
        if (kv.length === 2) el.setAttribute(kv[0].trim(), t(kv[1].trim()));
      });
    });
  }

  function mark() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    document.documentElement.setAttribute('lang', lang);
    if (document.documentElement.classList) document.documentElement.classList.toggle('lang-hi', lang === 'hi');
  }

  function set(next) {
    if (next !== 'en' && next !== 'hi') return;
    lang = next;
    try { localStorage.setItem(STORE, lang); } catch (e) { /* storage blocked */ }
    mark();
    apply(document);
    listeners.forEach(function (fn) { fn(lang); });
  }

  function onChange(fn) { listeners.push(fn); }

  mark();

  W.i18n = {
    get lang() { return lang; },
    t: t, pick: pick, time: time, span: span, date: date,
    apply: apply, set: set, onChange: onChange,
    toggle: function () { set(lang === 'hi' ? 'en' : 'hi'); },
    DICT: DICT
  };
})(window.W);
