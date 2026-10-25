/* Everything the invitation explains beyond the programme, in English and
   Hindi. Pairs are [english, hindi]. Facts here must agree with data.js —
   the smoke test checks the ones that can drift (times, rooms, distances). */
window.W = window.W || {};

(function (W) {
  'use strict';

  const V = W.data.venue.booked;

  /* The flight, from the old city to the hotel. Camera values are MapLibre's:
     lon/lat centre, zoom, pitch (tilt from straight down) and bearing (compass
     direction the camera faces). `at` is where the leg ends along the scroll. */
  const flight = [
    { id: 'udaipur', at: 0, center: [73.6905, 24.5795], zoom: 12.7, pitch: 38, bearing: -18,
      cap: ['Udaipur — the City of Lakes', 'उदयपुर — झीलों की नगरी'],
      sub: ['Seat of the House of Mewar since 1559', '1559 से मेवाड़ राजघराने की राजधानी'] },
    { id: 'palace', at: 0.24, center: [73.6834, 24.5762], zoom: 15.4, pitch: 64, bearing: 28,
      cap: ['The City Palace on Lake Pichola', 'पिछोला झील के किनारे सिटी पैलेस'],
      sub: ['9 km from the venue', 'विवाह स्थल से 9 किमी'] },
    { id: 'fateh', at: 0.48, center: [73.6752, 24.6008], zoom: 14.3, pitch: 60, bearing: 70,
      cap: ['Fateh Sagar, under the Aravallis', 'अरावली की गोद में फ़तेह सागर'],
      sub: ['7 km from the venue', 'विवाह स्थल से 7 किमी'] },
    { id: 'east', at: 0.72, center: [73.6990, 24.6190], zoom: 13.6, pitch: 70, bearing: 80,
      cap: ['East across the city to Bhuwana', 'शहर के ऊपर से पूर्व में भुवाणा की ओर'],
      sub: ['Where the Aravalli hills close in', 'जहाँ अरावली की पहाड़ियाँ पास आ जाती हैं'] },
    { id: 'khumani', at: 0.94, center: [V.lon, V.lat], zoom: 17.1, pitch: 62, bearing: 152,
      cap: ['Hotel Khumani', 'होटल खुमानी'],
      sub: ['Where we celebrate — 1 & 2 February 2027', 'जहाँ हमारा उत्सव होगा — 1 एवं 2 फ़रवरी 2027'] }
  ];

  const landmarks = [
    { id: 'palace', lon: 73.6834, lat: 24.5762, name: ['City Palace', 'सिटी पैलेस'] },
    { id: 'pichola', lon: 73.6790, lat: 24.5720, name: ['Lake Pichola', 'पिछोला झील'] },
    { id: 'fateh', lon: 73.6752, lat: 24.6008, name: ['Fateh Sagar', 'फ़तेह सागर'] },
    { id: 'khumani', lon: V.lon, lat: V.lat, name: ['Hotel Khumani', 'होटल खुमानी'], home: true }
  ];

  const spaces = [
    { where: ['The lawn', 'लॉन'], what: ['Haldi, folk evening, sagaai, sangeet, phere and the reception', 'हल्दी, लोक संध्या, सगाई, संगीत, फेरे और रिसेप्शन'] },
    { where: ['The banquet hall', 'बैंक्वेट हॉल'], what: ['The cocktail after-party on 1 February', '1 फ़रवरी की कॉकटेल आफ़्टर-पार्टी'] },
    { where: ['The hotel porch', 'होटल का पोर्च'], what: ['Where the baraat sets off, and the vidaai', 'जहाँ से बारात निकलेगी, और विदाई'] },
    { where: ['The restaurant', 'रेस्तराँ'], what: ['Breakfast every morning', 'हर सुबह का नाश्ता'] },
    { where: ['The rooftop pool', 'छत का स्विमिंग पूल'], what: ['For the afternoon rests', 'दोपहर के आराम के लिए'] }
  ];

  const distances = [
    [['Maharana Pratap Airport', 'महाराणा प्रताप हवाई अड्डा'], ['18 km · about 35 min', '18 किमी · लगभग 35 मिनट']],
    [['Udaipur City station', 'उदयपुर सिटी स्टेशन'], ['7 km', '7 किमी']],
    [['Rana Pratap Nagar station', 'राणा प्रताप नगर स्टेशन'], ['5 km', '5 किमी']],
    [['City Palace', 'सिटी पैलेस'], ['9 km', '9 किमी']],
    [['Fateh Sagar', 'फ़तेह सागर'], ['7 km', '7 किमी']]
  ];

  const stay = [
    { t: ['Arriving on 1 February', '1 फ़रवरी को आगमन'],
      b: ['The hotel opens to our guests at 8 am. Come straight there, check in and have breakfast — the haldi begins at 11.',
        'होटल सुबह 8 बजे से हमारे मेहमानों के लिए खुला रहेगा। सीधे वहीं आइए, चेक-इन कीजिए और नाश्ता कीजिए — हल्दी 11 बजे शुरू होगी।'] },
    { t: ['Arriving on 31 January?', '31 जनवरी को पहुँच रहे हैं?'],
      b: ['A few rooms are held from the night of 31 January for family arriving early. Tell us in your RSVP and we will keep one for you.',
        '31 जनवरी की रात से कुछ कमरे जल्दी पहुँचने वाले परिवारजनों के लिए रखे गए हैं। उपस्थिति फ़ॉर्म में बताइए, हम आपके लिए एक कमरा रख देंगे।'] },
    { t: ['Checking out', 'चेक-आउट'],
      b: ['Checkout is at 10 am on Wednesday 3 February, after breakfast. Drops to the airport and both stations are arranged.',
        'चेक-आउट बुधवार 3 फ़रवरी को सुबह 10 बजे, नाश्ते के बाद। हवाई अड्डे और दोनों स्टेशनों तक छोड़ने की व्यवस्था रहेगी।'] },
    { t: ['Every meal is with us', 'हर भोजन हमारे साथ'],
      b: ['From breakfast on 1 February to breakfast on 3 February. All the food is pure vegetarian; Jain and no-onion-garlic food on request.',
        '1 फ़रवरी के नाश्ते से 3 फ़रवरी के नाश्ते तक। सारा भोजन शुद्ध शाकाहारी है; जैन और बिना प्याज़-लहसुन का भोजन अनुरोध पर।'] },
    { t: ['In the hotel', 'होटल में'],
      b: ['50 rooms, free Wi-Fi, a rooftop pool, a restaurant and parking. Elders get rooms close to the lift — tell us in your RSVP.',
        '50 कमरे, मुफ़्त वाई-फ़ाई, छत पर स्विमिंग पूल, रेस्तराँ और पार्किंग। बुज़ुर्गों को लिफ़्ट के पास कमरे मिलेंगे — उपस्थिति फ़ॉर्म में बताइए।'] },
    { t: ['Your room number', 'आपका कमरा नंबर'],
      b: ['It appears on your own guest page once rooms are allotted in January.',
        'जनवरी में कमरे तय होते ही यह आपके अपने गेस्ट पेज पर दिख जाएगा।'] }
  ];

  const travel = [
    { t: ['By air', 'हवाई जहाज़ से'],
      b: ['Maharana Pratap Airport (UDR), Dabok — 18 km, about 35 minutes. Share your flight in the RSVP and we will send a car.',
        'महाराणा प्रताप हवाई अड्डा (UDR), डबोक — 18 किमी, लगभग 35 मिनट। उपस्थिति फ़ॉर्म में अपनी फ़्लाइट बताइए, हम गाड़ी भेज देंगे।'] },
    { t: ['By train', 'ट्रेन से'],
      b: ['Udaipur City (UDZ) is 7 km away and Rana Pratap Nagar (RPZ) 5 km. Tell us your train and arrival time for a pickup.',
        'उदयपुर सिटी (UDZ) स्टेशन 7 किमी और राणा प्रताप नगर (RPZ) 5 किमी दूर है। पिकअप के लिए अपनी ट्रेन और पहुँचने का समय बताइए।'] },
    { t: ['By road', 'सड़क से'],
      b: ['Neemuch 3 hr · Ahmedabad 4.5 hr (NH-48) · Kota 5 hr · Jaipur 6 hr · Indore 6.5 hr. The hotel is on the Bhuwana Bypass, with parking.',
        'नीमच 3 घंटे · अहमदाबाद 4.5 घंटे (NH-48) · कोटा 5 घंटे · जयपुर 6 घंटे · इंदौर 6.5 घंटे। होटल भुवाणा बायपास पर है, पार्किंग उपलब्ध है।'] },
    { t: ['What to pack', 'क्या साथ लाएँ'],
      b: ['A shawl or jacket for both evenings, comfortable shoes for the lawn, sunglasses for the haldi, your medicines and a power bank.',
        'दोनों शामों के लिए शॉल या जैकेट, लॉन के लिए आरामदायक जूते, हल्दी के लिए धूप का चश्मा, अपनी दवाइयाँ और पावर बैंक।'] }
  ];

  /* Climate normals for the dates; replaced by a live forecast inside 16 days. */
  const weather = {
    lat: V.lat, lon: V.lon,
    dayHigh: '24–27°C', nightLow: '9–12°C', sunrise: '07:16', sunset: '18:19'
  };

  /* Every question a guest has asked us, or will. `k` words feed the search
     box, in both scripts, so "parking" and "पार्किंग" both find the answer. */
  const faq = [
    { q: ['When should I arrive?', 'मुझे कब पहुँचना चाहिए?'],
      a: ['Any time from 8 am on Monday 1 February — the haldi is at 11. If you are family arriving the night before, a few rooms are held from 31 January: tell us in your RSVP.',
        'सोमवार 1 फ़रवरी को सुबह 8 बजे से कभी भी — हल्दी 11 बजे है। अगर आप परिवार से हैं और एक रात पहले पहुँच रहे हैं, तो 31 जनवरी से कुछ कमरे रखे गए हैं — उपस्थिति फ़ॉर्म में बताइए।'],
      k: 'arrive arrival 31 january early पहुँचना आगमन' },
    { q: ['Do I need to book a room?', 'क्या मुझे कमरा बुक करना है?'],
      a: ['No. If you are staying with us, your room is held for you, and its details appear on your guest page in January.',
        'नहीं। अगर आप हमारे साथ ठहर रहे हैं, तो आपका कमरा आरक्षित है — उसकी जानकारी जनवरी में आपके गेस्ट पेज पर दिखेगी।'],
      k: 'room book hotel stay कमरा बुक होटल' },
    { q: ['What are the check-in and checkout times?', 'चेक-इन और चेक-आउट का समय क्या है?'],
      a: ['Rooms are ready from 8 am on 1 February. Checkout is at 10 am on 3 February, after breakfast.',
        'कमरे 1 फ़रवरी को सुबह 8 बजे से तैयार रहेंगे। चेक-आउट 3 फ़रवरी को सुबह 10 बजे, नाश्ते के बाद।'],
      k: 'check-in checkin checkout check-out time चेक-इन चेक-आउट' },
    { q: ['Will there be drinks?', 'क्या ड्रिंक्स होंगी?'],
      a: ['Yes — at the cocktail after-party on the night of 1 February, from 11 pm in the banquet hall.',
        'जी हाँ — 1 फ़रवरी की रात 11 बजे से बैंक्वेट हॉल में कॉकटेल आफ़्टर-पार्टी में।'],
      k: 'drinks bar alcohol cocktail party ड्रिंक्स बार पार्टी' },
    { q: ['What if I am running late?', 'अगर मुझे देर हो जाए तो?'],
      a: ['The folk evening at 7 pm and the baraat at 9:30 am are the easy starts. The sagaai at 8 pm, the varmala at 10:30 am and the pheras at 11 begin on time — the pheras follow the muhurat. The calendar file reminds you before each one.',
        'शाम 7 बजे की लोक संध्या और सुबह 9:30 की बारात में थोड़ी ढील है। रात 8 बजे की सगाई, सुबह 10:30 की वरमाला और 11 बजे के फेरे समय पर शुरू होंगे — फेरे मुहूर्त के अनुसार होते हैं। कैलेंडर फ़ाइल हर कार्यक्रम से पहले आपको याद दिलाएगी।'],
      k: 'late time punctual reminder देर समय याद' },
    { q: ['I am travelling with elders. What should I tell you?', 'मेरे साथ बुज़ुर्ग हैं। आपको क्या बताऊँ?'],
      a: ['Tell us about any mobility needs in your RSVP. We will give you a room close to the lift and keep seats for elders at every function.',
        'उपस्थिति फ़ॉर्म में चलने-फिरने की किसी भी ज़रूरत के बारे में बताइए। हम आपको लिफ़्ट के पास कमरा देंगे और हर कार्यक्रम में बुज़ुर्गों के लिए सीटें रखेंगे।'],
      k: 'elders senior wheelchair mobility lift बुज़ुर्ग व्हीलचेयर लिफ़्ट' },
    { q: ['What will the weather be like?', 'मौसम कैसा रहेगा?'],
      a: ['Warm days of 24–27°C and cold nights of 9–12°C. Sunrise is at 7:16 and sunset at 6:19. The live forecast appears on this page two weeks before.',
        'दिन में 24–27°C की गुनगुनी धूप और रात में 9–12°C की ठंड। सूर्योदय 7:16 पर और सूर्यास्त 6:19 पर। विवाह से दो हफ़्ते पहले ताज़ा पूर्वानुमान यहीं दिखेगा।'],
      k: 'weather cold temperature rain sunset मौसम ठंड बारिश' },
    { q: ['Is there Wi-Fi and parking?', 'क्या वाई-फ़ाई और पार्किंग है?'],
      a: ['Yes, free Wi-Fi throughout the hotel and a parking area on site. For the reception, follow the signs and the valets.',
        'जी हाँ, पूरे होटल में मुफ़्त वाई-फ़ाई और परिसर में पार्किंग। रिसेप्शन के दिन संकेतों और वैले के निर्देशों का पालन करें।'],
      k: 'wifi wi-fi internet parking car वाई-फ़ाई पार्किंग' },
    { q: ['Is there a hospital nearby?', 'क्या पास में कोई अस्पताल है?'],
      a: ['Apex Hospital is about 500 m away on Bhuwana Bypass Circle and is open 24 hours: +91 73748 00991. For any emergency, dial 112.',
        'एपेक्स हॉस्पिटल लगभग 500 मीटर दूर भुवाणा बायपास सर्कल पर है और 24 घंटे खुला रहता है: +91 73748 00991। किसी भी आपात स्थिति में 112 डायल करें।'],
      k: 'hospital doctor medical emergency pharmacy अस्पताल डॉक्टर आपात' },
    { q: ['Who do I call?', 'मैं किसे फ़ोन करूँ?'],
      a: ['The Hotel Khumani reception, any time: +91 76651 78660 or +91 90018 30714.',
        'होटल खुमानी का रिसेप्शन, कभी भी: +91 76651 78660 या +91 90018 30714।'],
      k: 'call phone contact help number फ़ोन संपर्क सहायता नंबर' }
  ];

  const help = [
    { kind: 'hotel', t: ['Hotel Khumani reception', 'होटल खुमानी रिसेप्शन'], b: ['Day and night', 'दिन-रात'],
      tel: V.phones[0], tel2: V.phones[1] },
    { kind: 'mail', t: ['Email the hotel', 'होटल को ईमेल'], b: ['For room questions before you travel', 'यात्रा से पहले कमरे से जुड़े सवालों के लिए'],
      mail: V.email },
    { kind: 'hospital', t: ['Apex Hospital', 'एपेक्स हॉस्पिटल'], b: ['About 500 m away · open 24 hours', 'लगभग 500 मीटर दूर · 24 घंटे खुला'],
      tel: '+91 73748 00991' },
    { kind: 'sos', t: ['Emergency', 'आपातकाल'], b: ['Police, fire and ambulance', 'पुलिस, फ़ायर और एम्बुलेंस'],
      tel: '112' }
  ];

  const whileHere = [
    { t: ['A spare morning', 'एक ख़ाली सुबह'],
      b: ['City Palace and its Crystal Gallery · Jagdish Temple, five minutes uphill · Bagore ki Haveli, then its 7 pm folk show — buy tickets by 6:15.',
        'सिटी पैलेस और उसकी क्रिस्टल गैलरी · पाँच मिनट की चढ़ाई पर जगदीश मंदिर · बागोर की हवेली और वहाँ शाम 7 बजे का लोक नृत्य — टिकट 6:15 तक ले लें।'] },
    { t: ['A spare evening', 'एक ख़ाली शाम'],
      b: ['A Lake Pichola boat from Rameshwar Ghat around 5 pm · sunset from Sajjangarh, the Monsoon Palace · dinner across the water at Ambrai or Upre.',
        'शाम 5 बजे के आसपास रामेश्वर घाट से पिछोला झील की नाव · सज्जनगढ़ (मानसून पैलेस) से सूर्यास्त · झील के उस पार अम्बराई या उपरे में रात का खाना।'] },
    { t: ['A whole spare day', 'एक पूरा ख़ाली दिन'],
      b: ['Kumbhalgarh Fort, with the Ranakpur Jain temples on the way back — two hours each way, so share a cab · Eklingji and Nagda, 14 km from the hotel.',
        'कुंभलगढ़ क़िला, और लौटते हुए रणकपुर के जैन मंदिर — दोनों ओर दो-दो घंटे, तो टैक्सी साझा करें · होटल से 14 किमी पर एकलिंगजी और नागदा।'] },
    { t: ['To bring home', 'घर ले जाने के लिए'],
      b: ['Pichwai and miniature painting, bandhej and leheriya, Molela clay plaques, juttis and silver — Bada Bazaar and Hathi Pol. Bargain, kindly.',
        'पिछवाई और लघु चित्र, बंधेज और लहरिया, मोलेला की मिट्टी की कलाकृतियाँ, जूतियाँ और चाँदी — बड़ा बाज़ार और हाथी पोल। मोल-भाव कीजिए, पर प्यार से।'] }
  ];

  const map = {
    query: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Hotel Khumani By Hills N Dunes Hotels, Bhuwana, Udaipur'),
    directions: 'https://www.google.com/maps/dir/?api=1&destination=' + V.lat + ',' + V.lon
  };

  W.content = {
    flight: flight, landmarks: landmarks, spaces: spaces, distances: distances,
    stay: stay, travel: travel, weather: weather, faq: faq,
    help: help, whileHere: whileHere, map: map
  };
})(window.W);
