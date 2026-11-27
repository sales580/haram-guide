/* Umrah Companion: every word the pilgrim reads lives in this one file, so a scholar can review it in one place.
   STATUS: DRAFT 1, 26 Nov 2026. NOT yet checked by a scholar.
   Hadith numbers were read at the source (hadithunlocked.com) on 26 Nov 2026, except where a line says otherwise.
   l   = label: must (needed for the Umrah), sunnah (recommended), tip (practical advice), avoid (not allowed in ihram).
         A label can differ by school: { hanafi, maliki, shafii, hanbali, unsure }.
   who = "m" shown to men only, "f" shown to women only.
   sch = a note shown for one school; "all" is shown when the reader chose "Not sure".
   Transliteration: ‘ marks the letter ayn, ’ marks hamza. */
window.UMRAH_CONTENT = {
  version: "Draft 1, 26 November 2026",
  draftNote: "Test version. The wording has not been checked by a scholar yet.",

  labels: { must: "Must do", sunnah: "Sunnah", tip: "Tip", avoid: "Avoid" },
  legend: [
    ["must", "Needed for your Umrah."],
    ["sunnah", "Rewarded. Your Umrah is still valid without it."],
    ["tip", "Practical advice."],
    ["avoid", "Not allowed while you are in ihram."]
  ],
  schools: { hanafi: "Hanafi", maliki: "Maliki", shafii: "Shafi‘i", hanbali: "Hanbali", unsure: "Not sure" },
  routes: { jeddah: "Flying to Jeddah", madinah: "Madinah first", road: "By road", makkah: "Already in Makkah" },

  duas: {
    niyyah: {
      ar: "لَبَّيْكَ عُمْرَةً",
      tr: "Labbayka ‘umrah",
      en: "Here I am, for Umrah.",
      src: "Based on the Prophet’s words in Muslim 1251"
    },
    talbiyah: {
      ar: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
      tr: "Labbayk Allahumma labbayk. Labbayka la sharika laka labbayk. Innal-hamda wan-ni‘mata laka wal-mulk. La sharika lak.",
      en: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. All praise, every blessing and all dominion are Yours. You have no partner.",
      src: "Bukhari 1549, Muslim 1184"
    },
    ishtirat: {
      ar: "اللَّهُمَّ مَحِلِّي حَيْثُ حَبَسْتَنِي",
      tr: "Allahumma mahilli haythu habastani",
      en: "O Allah, my place of release is wherever You hold me back.",
      src: "Bukhari 5089, Muslim 1207"
    },
    enter: {
      ar: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
      tr: "Allahumma-ftah li abwaba rahmatik",
      en: "O Allah, open for me the gates of Your mercy.",
      src: "Muslim 713, Abu Dawud 465"
    },
    start: {
      ar: "بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ",
      tr: "Bismillah, Allahu Akbar",
      en: "In the name of Allah. Allah is the Greatest.",
      src: "Reported from Ibn ‘Umar (al-Bayhaqi). The takbir: Bukhari 1613"
    },
    rabbana: {
      ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      tr: "Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina ‘adhaban-nar",
      en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      src: "Qur’an 2:201; Abu Dawud 1892 (graded hasan)"
    },
    maqam: {
      ar: "وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى",
      tr: "Wattakhidhu min maqami Ibrahima musalla",
      en: "And take the station of Ibrahim as a place of prayer.",
      src: "Qur’an 2:125; Muslim 1218"
    },
    safaVerse: {
      ar: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ. أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ",
      tr: "Innas-Safa wal-Marwata min sha‘a’irillah. Abda’u bima bada’allahu bih.",
      en: "Safa and Marwah are among the symbols of Allah. I begin with what Allah began with.",
      src: "Qur’an 2:158; Muslim 1218"
    },
    safaDhikr: {
      ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ",
      tr: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ‘ala kulli shay’in qadir. La ilaha illallahu wahdah, anjaza wa‘dah, wa nasara ‘abdah, wa hazamal-ahzaba wahdah.",
      en: "There is no god but Allah, alone, with no partner. His is the dominion and His is the praise, and He has power over all things. There is no god but Allah alone. He fulfilled His promise, helped His servant, and defeated the confederates alone.",
      src: "Muslim 1218"
    },
    green: {
      ar: "رَبِّ اغْفِرْ وَارْحَمْ، إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ",
      tr: "Rabbighfir warham, innaka antal-a‘azzul-akram",
      en: "My Lord, forgive and have mercy. You are the Most Mighty, the Most Generous.",
      src: "Reported from Ibn Mas‘ud and Ibn ‘Umar (Ibn Abi Shaybah)"
    }
  },

  stages: [
    {
      id: 1, title: "Get ready", where: "At home, your hotel or the airport",
      summary: "Wash and put on your ihram clothes before you reach the miqat.",
      steps: [
        { l: "sunnah", h: "Tidy up and bathe", t: "Trim your nails and remove unwanted hair if you need to, then take a full bath (ghusl).", src: "Tirmidhi 830" },
        { l: "sunnah", who: "m", h: "Perfume, before the intention only", t: "You may put perfume on your body, not on the ihram cloths, before you make the intention. After the intention, no perfume at all.", src: "Bukhari 1539" },
        { l: "must", who: "m", h: "Wear the two ihram cloths", t: "Wrap one plain cloth around your waist and put the other over your shoulders. No shirt, trousers, underwear, socks or cap. Wear sandals that leave your ankles uncovered. A belt or money pouch is fine.", src: "Bukhari 1542, Muslim 1177" },
        { l: "must", who: "f", h: "Wear your normal modest clothes", t: "Wear your usual loose, modest clothing, in any colour. Do not wear a face veil (niqab) or gloves while you are in ihram.", src: "Bukhari 1838" },
        { l: "sunnah", h: "Pray first", t: "It is recommended to enter ihram after a prayer: an obligatory prayer if it is time, or two rak‘ahs." },
        { l: "tip", onlyRoute: ["jeddah"], h: "Flying?", t: "Put on your ihram clothes before you board, or at your last stop. Save the intention for the miqat." }
      ]
    },
    {
      id: 2, title: "Intention at the miqat", where: "At your miqat",
      summary: "The miqat is the line you must not cross without ihram. Your Umrah begins here.",
      steps: [
        {
          l: "must", h: "Know your miqat",
          route: {
            jeddah: "Your plane crosses the miqat in the air before it lands, and the crew usually announce it. Jeddah is inside the miqat line, so do not wait until you land.",
            madinah: "Your miqat is Dhul-Hulayfah, also called Abyar ‘Ali, on the edge of Madinah on the road to Makkah. Buses and taxis stop at its mosque. If you take the train, wear your ihram before you board and make your intention as the train leaves Madinah.",
            road: "Stop at the miqat on your road: Dhul-Hulayfah (from Madinah), al-Juhfah near Rabigh (from the north-west), Qarn al-Manazil, also called as-Sayl al-Kabir (from Riyadh and the east), Yalamlam (from the south), or Dhat ‘Irq (from Iraq and the north-east).",
            makkah: "You are already inside the Haram, so go out to its edge to enter ihram. The nearest place is Masjid ‘A’ishah at Tan‘im. Taxis and buses go there."
          },
          routeSrc: { jeddah: "Bukhari 1524, Muslim 1181", madinah: "Bukhari 1524, Muslim 1181", road: "Bukhari 1524 and 1531, Muslim 1181", makkah: "Bukhari 1784" }
        },
        { l: "must", h: "Make your intention", t: "In your heart, intend to begin Umrah. The intention is in the heart. It is common to say it once as well:", dua: "niyyah" },
        {
          l: { hanafi: "must", maliki: "must", shafii: "sunnah", hanbali: "sunnah", unsure: "must" },
          h: "Say the Talbiyah", t: "Men say it aloud, women quietly. Keep repeating it on the way to Makkah.", dua: "talbiyah",
          sch: { all: "Every school tells you to say it. They differ on whether it is required or a strong sunnah." }
        },
        {
          l: "tip", h: "If you fear something may stop you", t: "If you are ill, or fear you may not be able to finish, you may add this condition to your intention:", dua: "ishtirat",
          sch: { all: "The schools differ on what this condition changes. Ask your teacher.", hanafi: "The schools differ on what this condition changes. Ask your teacher.", maliki: "The schools differ on what this condition changes. Ask your teacher." }
        }
      ]
    },
    {
      id: 3, title: "In ihram: what to avoid", where: "From your intention until you cut your hair",
      summary: "You are now in ihram. These things are not allowed until your Umrah is finished.",
      steps: [
        { l: "avoid", h: "Cutting hair or nails", t: "Do not cut or pull out any hair, and do not cut your nails." },
        { l: "avoid", h: "Perfume and scented products", t: "No perfume on your body or clothes. Use unscented soap, wipes and creams.", src: "Bukhari 1542" },
        { l: "avoid", who: "m", h: "Covering the head, and fitted clothes", t: "Do not cover your head with a cap or cloth, and do not wear clothes sewn to fit the body. Shade from an umbrella or a roof is fine.", src: "Bukhari 1542" },
        { l: "avoid", who: "f", h: "Face veil and gloves", t: "Do not wear a niqab or gloves.", src: "Bukhari 1838" },
        { l: "avoid", h: "Marriage and intimacy", t: "No marriage contract or proposal, no intimacy between husband and wife, and nothing that leads to it.", src: "Muslim 1409" },
        { l: "avoid", h: "Hunting", t: "Do not hunt or harm wild land animals.", src: "Qur’an 5:95" },
        { l: "avoid", h: "Arguing and bad words", t: "No quarrelling, rude speech or sin. Be patient with the crowd.", src: "Qur’an 2:197" },
        { l: "tip", h: "These are fine", t: "Washing, changing your ihram cloths, a watch, glasses, a belt or money pouch, sandals, a bandage and an umbrella are all allowed." },
        { l: "tip", h: "If you slip", t: "Most mistakes do not cancel your Umrah. Stop as soon as you remember, then open Help." }
      ]
    },
    {
      id: 4, title: "Enter Masjid al-Haram", where: "At the gate of the Masjid", img: "enter",
      cap: "Every gate has its number on a large sign above the doors. Staff may send pilgrims in ihram to a particular gate, so follow their signs. Remember the number of the gate you used: it is how you find your way back.",
      summary: "Go in calmly, with wudu, and agree where your group will meet.",
      steps: [
        { l: "must", h: "Have wudu", t: "You need wudu for tawaf. Make it before you go in to the mataf, the open floor around the Ka‘bah." },
        { l: "tip", h: "Agree a meeting point", t: "Before you go in, agree with your group where to meet if you are separated, and note the number of the gate you used." },
        { l: "sunnah", h: "Enter with your right foot", t: "Send peace on the Prophet ﷺ, then say:", dua: "enter" },
        { l: "tip", h: "When you see the Ka‘bah", t: "There is no fixed dua that you must say. Many pilgrims step to one side and make their own dua." },
        { l: "tip", h: "Stop the Talbiyah", t: "Stop saying the Talbiyah when you begin your tawaf.", sch: { maliki: "Maliki school: stop the Talbiyah when you reach the Haram." } }
      ]
    },
    {
      id: 5, title: "Tawaf", where: "On the mataf, around the Ka‘bah", counter: "tawaf", img: "tawaf",
      cap: "Start level with the Black Stone. Keep the Ka‘bah on your left and go around the outside of the Hijr.",
      summary: "Walk around the Ka‘bah seven times, with the Ka‘bah on your left.",
      steps: [
        { l: "sunnah", who: "m", h: "Uncover your right shoulder", t: "Pass the top cloth under your right arm and over your left shoulder, so that your right shoulder is bare. Keep it like this for all seven rounds.", src: "Abu Dawud 1883 and 1884", sch: { maliki: "Maliki school: this is not counted as a sunnah." } },
        { l: "must", h: "Start at the Black Stone", t: "Stand level with the Black Stone corner, face it and say:", dua: "start" },
        { l: "tip", h: "Do not push to reach the Stone", t: "Touching or kissing the Black Stone is a sunnah. When it is crowded, raise your right hand towards it from where you are. Never push or hurt anyone for it.", src: "Bukhari 1613" },
        { l: "must", h: "Walk seven rounds", t: "Keep the Ka‘bah on your left and walk around it. Go around the outside of the low curved wall, the Hijr. Do not cut through it. Each time you come level with the Black Stone again, one round is done." },
        { l: "sunnah", h: "Each time you pass the Black Stone", t: "Raise your right hand towards it and say “Allahu Akbar”.", src: "Bukhari 1613" },
        { l: "sunnah", who: "m", h: "Brisk walk in rounds 1 to 3", t: "Walk briskly with short steps in the first three rounds, then walk normally in the last four. Leave it if the crowd is tight.", src: "Bukhari 1603, Muslim 1261" },
        { l: "sunnah", h: "At the Yemeni corner", t: "If you can reach the Yemeni corner, touch it with your right hand. If you cannot, walk on without pointing.", src: "Bukhari 1606" },
        { l: "sunnah", h: "Between the Yemeni corner and the Black Stone", t: "Say:", dua: "rabbana" },
        { l: "tip", h: "For the rest of each round", t: "There is no set dua for each round. Remember Allah, recite Qur’an, or ask for anything you need, in any language." }
      ]
    },
    {
      id: 6, title: "Two rak‘ahs", where: "Behind Maqam Ibrahim, or anywhere in the Masjid",
      summary: "After the seventh round, pray two short rak‘ahs.",
      steps: [
        { l: "tip", who: "m", h: "Cover both shoulders", t: "Put the top cloth back over both shoulders before you pray." },
        { l: "sunnah", h: "Walk towards Maqam Ibrahim", t: "As you go, recite:", dua: "maqam" },
        {
          l: { hanafi: "must", maliki: "must", shafii: "sunnah", hanbali: "sunnah", unsure: "must" },
          h: "Pray two rak‘ahs", t: "Pray behind Maqam Ibrahim if there is room. If it is crowded, pray anywhere in the Masjid. Recite Surah al-Kafirun in the first rak‘ah and Surah al-Ikhlas in the second.", src: "Muslim 1218, Tirmidhi 869",
          sch: { all: "The schools differ on whether these two rak‘ahs are required or a strong sunnah. Pray them either way." }
        },
        { l: "tip", h: "Do not block the way", t: "Do not stop to pray in the path of people who are doing tawaf." }
      ]
    },
    {
      id: 7, title: "Zamzam", where: "At the Zamzam taps and coolers in the Masjid",
      summary: "Drink Zamzam water and catch your breath before sa‘i.",
      steps: [
        { l: "sunnah", h: "Drink Zamzam water", t: "Drink your fill and make dua. The Prophet ﷺ said: “The water of Zamzam is for whatever it is drunk for.”", src: "Ibn Majah 3062 (graded hasan); Bukhari 1637" },
        { l: "tip", h: "Rest if you need to", t: "You may sit and rest before sa‘i. There is no need to rush." }
      ]
    },
    {
      id: 8, title: "Sa‘i", where: "In the mas‘a, between Safa and Marwah", counter: "sai", img: "sai",
      cap: "North is at the top, so Safa is at the bottom and Marwah at the top. Safa to Marwah is lap one. Marwah back to Safa is lap two. Lap seven ends at Marwah.",
      summary: "Walk between the hills of Safa and Marwah seven times. You begin at Safa and finish at Marwah.",
      steps: [
        { l: "sunnah", h: "As you come near Safa", t: "The first time only, recite:", dua: "safaVerse" },
        { l: "sunnah", h: "On Safa", t: "Go up a little and face the Ka‘bah. Raise your hands as you do in dua, say “Allahu Akbar” three times, then say the words below. Make your own dua, and repeat until you have said the words three times.", dua: "safaDhikr", src: "Muslim 1218, Nasa’i 2972" },
        { l: "must", h: "Walk to Marwah", t: "Walk the whole way to Marwah. That is lap one." },
        { l: "sunnah", who: "m", h: "Jog between the green lights", t: "Jog between the two green lights, then walk again.", src: "Muslim 1218" },
        { l: "tip", who: "f", h: "Between the green lights", t: "Women walk at a normal pace the whole way." },
        { l: "tip", h: "A dua for the green lights", t: "Reported from the Companions:", dua: "green" },
        { l: "sunnah", h: "On Marwah", t: "Do what you did on Safa: face the Ka‘bah, raise your hands, say the same words three times and make dua. Do not repeat the verse.", src: "Muslim 1218" },
        { l: "must", h: "Complete seven laps", t: "Walk back to Safa for lap two, and carry on. Lap seven ends at Marwah." },
        { l: "tip", h: "Good to know", t: "Wudu is recommended for sa‘i but not required. You may rest, drink water, or use a wheelchair." }
      ]
    },
    {
      id: 9, title: "Cut your hair", where: "After sa‘i, outside the Masjid or at your hotel",
      summary: "Cutting the hair is the last act of Umrah. It ends your ihram.",
      steps: [
        {
          l: "must", who: "m", h: "Shave or shorten", t: "Shave your whole head, which is better, or shorten the hair evenly from all over the head. Barbers are usually found outside the Marwah gate.", src: "Bukhari 1727 and 1728, Muslim 1301",
          sch: {
            hanafi: "Hanafi school: at least a quarter of the head must be shaved or shortened. The whole head is the sunnah.",
            maliki: "Maliki school: the whole head must be shaved or shortened.",
            shafii: "Shafi‘i school: the minimum is three hairs. The whole head is better.",
            hanbali: "Hanbali school: the whole head must be shaved or shortened.",
            all: "The schools differ on the minimum. Shortening from all over the head satisfies every school."
          }
        },
        { l: "must", who: "f", h: "Cut a fingertip’s length", t: "Gather your hair and cut about a fingertip’s length from the ends. Women do not shave. Do this in private, or ask another woman or a mahram to help.", src: "Abu Dawud 1985" }
      ]
    },
    {
      id: 10, title: "Umrah complete", where: "Alhamdulillah",
      summary: "Your Umrah is done. May Allah accept it from you.",
      steps: [
        { l: "tip", h: "Ihram has ended", t: "Everything that was not allowed in ihram is allowed again. You may change into your normal clothes." },
        { l: "tip", h: "Thank Allah", t: "Thank Allah and ask Him to accept your Umrah. The Prophet ﷺ said: “One Umrah to the next is an expiation for what is between them.”", src: "Bukhari 1773, Muslim 1349" },
        { l: "tip", h: "Stay close to the Masjid", t: "The Prophet ﷺ said that a prayer in Masjid al-Haram is better than one hundred thousand prayers elsewhere.", src: "Ibn Majah 1406" }
      ]
    }
  ],

  lessons: {
    intro: {
      title: "What Umrah is",
      blocks: [
        { h: "A visit to the House of Allah", p: ["Umrah is a visit to the Ka‘bah in Makkah to worship Allah. It can be done at any time of the year. It often takes two to four hours, and longer when it is crowded."] },
        { h: "Four acts, always in this order", list: ["Ihram: you make the intention at the miqat.", "Tawaf: you walk around the Ka‘bah seven times.", "Sa‘i: you walk between Safa and Marwah seven times.", "Cutting the hair: men shave or shorten, women cut a small amount."] },
        { h: "Its reward", p: ["The Prophet ﷺ said: “One Umrah to the next is an expiation for what is between them.”"], src: "Bukhari 1773, Muslim 1349" },
        { h: "How to use this guide", p: ["Read the ten stages here at home. On the day, open Perform and follow one stage at a time. If something goes wrong, open Help."] }
      ]
    },
    words: {
      title: "Words to know",
      blocks: [{ h: "The Arabic terms you will hear", p: ["You do not need to memorise these. Come back to this page whenever a word is new to you."] }]
    },
    women: {
      title: "For women",
      blocks: [
        { h: "Clothing", p: ["Your ihram is your normal modest clothing, in any colour. Do not wear a face veil (niqab) or gloves while you are in ihram."], src: "Bukhari 1838" },
        { h: "Talbiyah and pace", p: ["Say the Talbiyah quietly. Walk at a normal pace in tawaf and in sa‘i. The brisk walk and the jog are for men."] },
        { h: "Your period", p: ["If your period starts before or during ihram, you still make your intention at the miqat and you stay in ihram. You may do everything except tawaf. When you are pure, bathe, then do your tawaf and sa‘i.", "The Prophet ﷺ told ‘A’ishah: “Do what the pilgrim does, but do not go around the House until you are pure.”"], src: "Bukhari 305, Muslim 1211" },
        { h: "Cutting the hair", p: ["Gather your hair and cut about a fingertip’s length from the ends. Women do not shave."], src: "Abu Dawud 1985" },
        { h: "In the crowd", p: ["Go at a quieter time if you can, keep to the outer rings of the mataf or the upper floors, and do not push to reach the Black Stone."] }
      ]
    }
  },

  glossary: [
    ["Ihram", "The state you enter for Umrah, and the clothes worn in it."],
    ["Miqat", "The line you must not cross without being in ihram."],
    ["Niyyah", "Intention, made in the heart."],
    ["Talbiyah", "The words that begin “Labbayk Allahumma labbayk”."],
    ["Masjid al-Haram", "The mosque in Makkah that surrounds the Ka‘bah."],
    ["Mataf", "The open floor around the Ka‘bah where tawaf is done."],
    ["Tawaf", "Walking around the Ka‘bah seven times."],
    ["Black Stone", "The stone set in one corner of the Ka‘bah. Every round starts and ends level with it."],
    ["Yemeni corner", "The corner you reach just before the Black Stone corner."],
    ["Hijr (Hatim)", "The low curved wall beside the Ka‘bah. It is part of the Ka‘bah, so you walk around the outside of it."],
    ["Maqam Ibrahim", "The small case near the Ka‘bah that holds the stone Ibrahim, peace be upon him, stood on."],
    ["Idtiba‘", "For men: leaving the right shoulder bare during tawaf."],
    ["Raml", "For men: a brisk walk in the first three rounds of tawaf."],
    ["Zamzam", "The blessed well water of Masjid al-Haram."],
    ["Sa‘i", "Walking between Safa and Marwah seven times."],
    ["Mas‘a", "The long hall where sa‘i is done."],
    ["Safa and Marwah", "The two small hills at each end of the mas‘a."],
    ["Halq", "Shaving the head."],
    ["Taqsir", "Shortening the hair."],
    ["Mahram", "A woman’s husband, or a close male relative she can never marry."],
    ["Fidyah", "A compensation owed for some mistakes made in ihram."]
  ],

  checklist: [
    {
      title: "Papers and bookings", note: "Rules change. Check Nusuk, the official Saudi service, before you travel.", link: ["Open nusuk.sa", "https://www.nusuk.sa"],
      items: [
        { id: "passport", t: "Passport", n: "Valid for at least six months" },
        { id: "visa", t: "Visa for Saudi Arabia", n: "Printed, and saved on your phone" },
        { id: "nusuk", t: "Nusuk app installed", n: "The official app for Umrah permits and for visiting the Rawdah in Madinah" },
        { id: "permit", t: "Umrah permit", n: "Book it in Nusuk if it is required for your dates" },
        { id: "vaccine", t: "Vaccines", n: "Check which ones Saudi Arabia requires. The meningitis vaccine is commonly required." },
        { id: "insurance", t: "Travel insurance", n: "" },
        { id: "bookings", t: "Flight and hotel details", n: "Printed, and saved where you can open them without internet" },
        { id: "copies", t: "Copies of your passport and visa", n: "One on paper, one on your phone, one left with family" }
      ]
    },
    {
      title: "Ihram and clothes",
      items: [
        { id: "ihram", who: "m", t: "Two sets of ihram cloths", n: "One to wear and one spare" },
        { id: "belt", who: "m", t: "Ihram belt or money pouch", n: "" },
        { id: "sandals", who: "m", t: "Sandals that leave the ankles uncovered", n: "" },
        { id: "clothes", who: "f", t: "Loose, modest clothes for ihram", n: "Any colour. No face veil or gloves in ihram." },
        { id: "scarves", who: "f", t: "Spare headscarves", n: "" },
        { id: "shoes", t: "Comfortable shoes for the other days", n: "" },
        { id: "shoebag", t: "A small bag for your shoes", n: "So you can keep them with you inside the Masjid" },
        { id: "scissors", t: "Small scissors", n: "For cutting the hair at the end. Pack them in checked luggage." }
      ]
    },
    {
      title: "Wash bag and health",
      items: [
        { id: "unscented", t: "Unscented soap, shampoo and wipes", n: "Perfumed products are not allowed in ihram" },
        { id: "sunscreen", t: "Unscented sunscreen and lip balm", n: "" },
        { id: "meds", t: "Your regular medicines", n: "With the prescription, in your hand luggage" },
        { id: "plasters", t: "Plasters and pain relief", n: "For blisters and sore feet" },
        { id: "cream", t: "Unscented cream for chafing", n: "" },
        { id: "bottle", t: "Water bottle", n: "" },
        { id: "umbrella", t: "Umbrella for shade", n: "Shade is allowed in ihram" }
      ]
    },
    {
      title: "Phone and money",
      items: [
        { id: "app", t: "Open this guide once before you fly", n: "So it is saved on your phone and works without internet" },
        { id: "card", t: "Fill in your hotel card", n: "In Prepare, under Hotel card" },
        { id: "sim", t: "Phone plan for Saudi Arabia", n: "Roaming, an eSIM or a local SIM" },
        { id: "power", t: "Power bank and charging cable", n: "" },
        { id: "adapter", t: "Plug adapter", n: "Saudi Arabia uses the British three-pin plug (type G)" },
        { id: "cash", t: "Some Saudi riyals in cash", n: "For taxis, barbers and small shops" }
      ]
    },
    {
      title: "Heart and knowledge",
      items: [
        { id: "learn", t: "Read the ten stages", n: "In Learn" },
        { id: "talbiyah", t: "Learn the Talbiyah by heart", n: "" },
        { id: "dualist", t: "Write your dua list", n: "In Prepare, under Dua list" },
        { id: "forgive", t: "Ask forgiveness from family and friends", n: "" },
        { id: "debts", t: "Settle or write down your debts", n: "" },
        { id: "meet", t: "Agree a meeting point with your group", n: "" }
      ]
    }
  ],

  help: [
    {
      id: "count", q: "I lost count of my rounds or laps",
      a: ["Go by the lower number that you are sure of, and carry on from there.", "For example, if you are not sure whether it was three or four, count it as three.", "If someone with you is sure of the count, you may rely on them."],
      src: "The rule of building on what is certain: Muslim 571"
    },
    {
      id: "wudu", q: "My wudu broke during tawaf",
      a: ["Step out of the crowd, make wudu, and come back.", "To be safe in every school, start your tawaf again from round one.", "Sa‘i does not need wudu. If this happens in sa‘i, you may simply continue."],
      sch: {
        hanafi: "Hanafi school: after making wudu you may continue from the round where you stopped.",
        shafii: "Shafi‘i school: after making wudu you may continue from the round where you stopped.",
        maliki: "Maliki school: start the tawaf again from round one.",
        all: "Some schools allow you to continue from the round where you stopped, especially after a short break. Ask your teacher which applies to you."
      }
    },
    {
      id: "prayer", q: "The prayer started during my tawaf or sa‘i",
      a: ["Stop where you are and pray with the congregation.", "After the prayer, carry on from where you stopped. You do not start again.", "Some scholars say to begin the interrupted round again from the Black Stone. That is the safer choice if it is easy for you."]
    },
    {
      id: "rest", q: "I am tired and need to rest",
      a: ["You may stop to rest, drink water or use the toilet during tawaf, during sa‘i, or between them.", "A short break does not spoil what you have done. Carry on from where you stopped.", "If you used the toilet, make wudu again before you continue tawaf."]
    },
    {
      id: "walk", q: "I cannot walk the whole way",
      a: ["You may do tawaf and sa‘i in a wheelchair or on an electric cart. Your Umrah is complete and valid.", "Ask the staff at the gates where wheelchairs and carts are kept.", "The Prophet ﷺ performed tawaf riding a camel."],
      src: "Bukhari 1607, Muslim 1272"
    },
    {
      id: "group", q: "I lost my group", card: true,
      a: ["Stay calm and step out of the flow of people.", "Do not search through the crowd. Go to the meeting point you agreed.", "Show your hotel card to a guard or a member of staff. They help lost pilgrims every day.", "Call your group leader if your phone works."]
    },
    {
      id: "period", q: "My period started",
      a: ["You stay in ihram. Your Umrah is not cancelled.", "You may do everything except tawaf and the prayer. Wait until you are pure, bathe, then do your tawaf and sa‘i.", "If it started after you had finished tawaf, you may go on to do sa‘i.", "If you must travel before you are pure, speak to a scholar before you do anything."],
      src: "Bukhari 305, Muslim 1211"
    },
    {
      id: "slip", q: "I did something that is not allowed in ihram",
      a: ["Stop as soon as you remember.", "Most mistakes do not cancel your Umrah. Some need a compensation called fidyah, and the schools differ about mistakes made by forgetting.", "Note what happened and ask a scholar. Do not let it take away your peace."]
    },
    {
      id: "stone", q: "I could not reach the Black Stone",
      a: ["That is fine. Touching and kissing it are a sunnah, not a requirement.", "From where you are, raise your right hand towards it and say “Allahu Akbar”.", "Pushing or hurting someone to reach it is a sin."],
      src: "Bukhari 1613"
    },
    {
      id: "maqam", q: "There was no room behind Maqam Ibrahim",
      a: ["Pray your two rak‘ahs anywhere in the Masjid. They count in full."]
    },
    {
      id: "words", q: "I forgot the words of a dua",
      a: ["No fixed dua is required in tawaf or sa‘i.", "Remember Allah and ask Him in your own words, in any language.", "You may read from this guide as you walk."]
    },
    {
      id: "touch", q: "A man or woman brushed against me",
      a: ["In a crowd this can be hard to avoid.", "In the Hanafi, Maliki and Hanbali schools, an accidental touch without desire does not break wudu.", "In the Shafi‘i school, skin contact between a man and a woman who could marry each other breaks wudu. Many Shafi‘i scholars allow following another school on this point during tawaf, because of the crowd. Ask your teacher before you travel."]
    }
  ],

  numbers: [
    ["911", "Emergencies in the Makkah and Madinah regions"],
    ["997", "Ambulance"],
    ["937", "Health advice line, Ministry of Health"],
    ["1966", "Pilgrim help line, Ministry of Hajj and Umrah"]
  ],
  numbersNote: "Checked on 26 November 2026. Confirm them before you travel.",

  card: {
    helpAr: "من فضلك ساعدني في الوصول إلى فندقي",
    helpEn: "Please help me get to my hotel",
    callAr: "من فضلك اتصل بهذا الرقم",
    callEn: "Please call this number",
    fields: [
      ["hotel", "Hotel name", "text", "الفندق"],
      ["hotelAr", "Hotel name in Arabic, if you have it", "text", ""],
      ["area", "Street or area", "text", "العنوان"],
      ["room", "Room number", "text", "الغرفة"],
      ["leader", "Group leader’s name", "text", "المسؤول"],
      ["leaderPhone", "Group leader’s phone", "tel", "الهاتف"],
      ["meet", "Our meeting point", "text", "نقطة اللقاء"],
      ["name", "My name", "text", "الاسم"],
      ["family", "A family phone number", "tel", "هاتف العائلة"]
    ]
  }
};
