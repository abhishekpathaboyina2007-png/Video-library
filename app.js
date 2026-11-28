/* ==========================================
   SHALOM TABERNACLE - OPTIMIZED PUBLIC WEBSITE
   Google Sheets + Horizontal Home Rows
   + Performance-Optimized Thumbnails,
     Pagination, Favorites, Share, PWA Install,
     Continue Watching, Advanced Search,
     Daily Bible Verse, Events & Theme Switcher
========================================== */

const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0X0bDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

let libraryData = null;
let currentCategory = "All";
let currentPlaylistCategory = "All";

const CACHE_KEY = "shalomLibraryCache";
const MIN_REVALIDATE_MS = 60 * 1000;
const CACHE_TIME = 5 * 60 * 1000;
const FAVORITES_KEY = "shalomFavorites";
const THEME_KEY = "shalomTheme";
const LANG_KEY = "shalomLanguage";
const INSTALL_DISMISS_KEY = "shalomPwaInstallDismissedAt";
const INSTALL_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

let currentLanguage = "en";

const HOME_ROW_LIMIT = 10;
const VIDEOS_PAGE_SIZE = 12;
const PLAYLISTS_PAGE_SIZE = 12;

let videosLimit = VIDEOS_PAGE_SIZE;
let playlistsLimit = PLAYLISTS_PAGE_SIZE;
let requestTimeout = null;
let isFetchingLibrary = false;
let toastTimer = null;
let deferredInstallPrompt = null;

const libraryItemMap = new Map();
const resolvedThumbMap = new Map();
const failedThumbUrls = new Set();
const probedMaxResIds = new Set();


/* ==========================================
   MANUALLY MAINTAINED DAILY BIBLE VERSES
========================================== */

const DAILY_VERSES = [
  {
    reference: "Psalm 119:105",
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
    note: "Let God's Word guide every step and decision before you today."
  },
  {
    reference: "John 14:6",
    text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    note: "Christ Himself is our creed, our direction, and our peace."
  },
  {
    reference: "Isaiah 40:31",
    text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.",
    note: "Wait patiently on the Lord; His strength rises above every trial."
  },
  {
    reference: "Hebrews 13:8",
    text: "Jesus Christ the same yesterday, and to day, and for ever.",
    note: "In an ever-changing world, His faithfulness and power never change."
  },
  {
    reference: "Romans 8:28",
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    note: "Trust His sovereign hand even when the path is still unfolding."
  },
  {
    reference: "Psalm 23:1",
    text: "The LORD is my shepherd; I shall want.",
    note: "You are watched over, provided for, and led by the Good Shepherd."
  },
  {
    reference: "Proverbs 3:5–6",
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    note: "Acknowledge Him in quiet prayer and watch Him make your way clear."
  },
  {
    reference: "Philippians 4:6–7",
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    note: "Trade every worry for thankful prayer and receive His guarding peace."
  },
  {
    reference: "Matthew 11:28",
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    note: "Lay down your burdens at Jesus' feet and find true rest for your soul."
  },
  {
    reference: "Joshua 1:9",
    text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    note: "Step forward with confidence knowing the Lord walks right beside you."
  },
  {
    reference: "Psalm 46:1",
    text: "God is our refuge and strength, a very present help in trouble.",
    note: "He is not distant—He is a present help in every moment of need."
  },
  {
    reference: "2 Corinthians 5:7",
    text: "For we walk by faith, not by sight.",
    note: "Hold fast to God's promise even before you see the outcome."
  },
  {
    reference: "John 8:32",
    text: "And ye shall know the truth, and the truth shall make you free.",
    note: "Standing in the truth of Scripture brings lasting freedom and clarity."
  },
  {
    reference: "Lamentations 3:22–23",
    text: "It is of the LORD'S mercies that we are not consumed, because his compassions fail not. They are new every morning.",
    note: "Today carries fresh grace and new mercy straight from heaven."
  },
  {
    reference: "1 Corinthians 16:14",
    text: "Let all your things be done with charity.",
    note: "Let Christ's love shape your words, patience, and service today."
  },
  {
    reference: "Psalm 27:1",
    text: "The LORD is my light and my salvation; whom shall I fear?",
    note: "When the Lord shines over your life, fear loses its hold."
  },
  {
    reference: "Romans 10:17",
    text: "So then faith cometh by hearing, and hearing by the word of God.",
    note: "Make time today to hear and meditate on the living Word."
  },
  {
    reference: "Ephesians 2:8",
    text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.",
    note: "Rest in the finished grace of Jesus Christ, freely given."
  },
  {
    reference: "Psalm 34:8",
    text: "O taste and see that the LORD is good: blessed is the man that trusteth in him.",
    note: "Experience His goodness firsthand as you place your trust in Him."
  },
  {
    reference: "Isaiah 26:3",
    text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.",
    note: "Fix your thoughts on the Lord and guard your heart in peace."
  },
  {
    reference: "Colossians 3:23",
    text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.",
    note: "Every faithful act done for Christ carries eternal worth."
  },
  {
    reference: "John 16:33",
    text: "In the world ye shall have tribulation: but be of good cheer; I have overcome the world.",
    note: "Take heart today—our Savior has already won the victory."
  },
  {
    reference: "Psalm 91:1–2",
    text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
    note: "Remain close to God in prayer; there is safety under His shadow."
  },
  {
    reference: "Matthew 6:33",
    text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
    note: "Put God's kingdom first and trust Him with every daily provision."
  },
  {
    reference: "1 Peter 5:7",
    text: "Casting all your care upon him; for he careth for you.",
    note: "You were never meant to carry tomorrow's worries alone."
  },
  {
    reference: "Psalm 100:5",
    text: "For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.",
    note: "Praise Him today for mercy that never runs out."
  },
  {
    reference: "John 1:5",
    text: "And the light shineth in darkness; and the darkness comprehended it not.",
    note: "Christ's light overcomes every shadow—walk in His hope."
  },
  {
    reference: "2 Timothy 1:7",
    text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    note: "Receive God's spirit of courage, love, and steady clarity today."
  },
  {
    reference: "Psalm 121:1–2",
    text: "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD.",
    note: "Look up in expectation—your help comes from the Maker of heaven and earth."
  },
  {
    reference: "Galatians 6:9",
    text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
    note: "Stay faithful in small things; God honors steady perseverance."
  },
  {
    reference: "Revelation 22:20",
    text: "He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus.",
    note: "Live ready, hopeful, and anchored in the blessed hope of Christ's return."
  }
];


const DAILY_VERSES_TE = [
  {
    reference: "కీర్తనలు 119:105",
    text: "నీ వాక్యము నా పాదములకు దీపమును నా త్రోవకు వెలుగునై యున్నది.",
    note: "ఈ రోజు మీరు తీసుకునే ప్రతి నిర్ణయంలో దేవుని వాక్యం మీకు మార్గదర్శిగా ఉండనివ్వండి."
  },
  {
    reference: "యోహాను 14:6",
    text: "యేసు నేనే మార్గమును, సత్యమును, జీవమును; నా ద్వారానే తప్ప యెవడును తండ్రి యొద్దకు రాడు అని చెప్పెను.",
    note: "క్రీస్తే మన విశ్వాస సూత్రం, మన దిశానిర్దేశం, మన సమాధానం."
  },
  {
    reference: "యెషయా 40:31",
    text: "యెహోవా కొరకు ఎదురు చూచువారు నూతన బలము పొందుదురు; వారు పక్షిరాజులవలె రెక్కలు చాపి పైకి ఎగురుదురు.",
    note: "ప్రభువు కొరకు సహనంతో ఎదురుచూడండి; ఆయన బలం ప్రతి శ్రమను అధిగమిస్తుంది."
  },
  {
    reference: "హెబ్రీయులకు 13:8",
    text: "యేసుక్రీస్తు నిన్న, నేడు, ఎల్లప్పుడు ఏకరీతిగా ఉన్నాడు.",
    note: "మారిపోయే ఈ లోకంలో ఆయన నమ్మకత్వం మరియు శక్తి ఎన్నడూ మారదు."
  },
  {
    reference: "రోమీయులకు 8:28",
    text: "దేవుని ప్రేమించువారికి, అనగా ఆయన సంకల్పము చొప్పున పిలువబడినవారికి, మేలు కలుగుటకై సమస్తమును సమకూడి జరుగుచున్నవని యెరుగుదుము.",
    note: "మార్గం ఇంకా స్పష్టంగా కనిపించకపోయినా ఆయన సర్వాధికార హస్తాన్ని నమ్మండి."
  },
  {
    reference: "కీర్తనలు 23:1",
    text: "యెహోవా నా కాపరి; నాకు లేమి కలుగదు.",
    note: "మంచి కాపరియైన ప్రభువు మిమ్మల్ని కాపాడుతూ, పోషిస్తూ నడిపిస్తున్నారు."
  },
  {
    reference: "సామెతలు 3:5–6",
    text: "నీ స్వబుద్ధిని ఆధారము చేసికొనక నీ పూర్ణహృదయముతో యెహోవాయందు నమ్మకముంచుము. నీ ప్రవర్తన అంతటియందు ఆయన అధికారమునకు ఒప్పుకొనుము; అప్పుడు ఆయన నీ త్రోవలను సరాళము చేయును.",
    note: "ప్రార్థనలో ఆయనను గుర్తించండి; ఆయన మీ మార్గాన్ని స్పష్టంగా నడిపిస్తారు."
  },
  {
    reference: "ఫిలిప్పీయులకు 4:6–7",
    text: "దేనిని గూర్చియు చింతపడకుడి గాని ప్రతి విషయములోను ప్రార్థన విజ్ఞాపనములచేత కృతజ్ఞతాపూర్వకముగా మీ విన్నపములు దేవునికి తెలియజేయుడి.",
    note: "ప్రతి చింతను కృతజ్ఞతతో కూడిన ప్రార్థనగా మార్చి ఆయన సమాధానాన్ని పొందండి."
  },
  {
    reference: "మత్తయి 11:28",
    text: "ప్రయాసపడి భారము మోసికొనుచున్న సమస్త జనులారా, నా యొద్దకు రండి; నేను మీకు విశ్రాంతి కలుగజేతును.",
    note: "యేసు పాదాల వద్ద మీ భారాలను దించి ఆత్మకు నిజమైన విశ్రాంతిని పొందండి."
  },
  {
    reference: "యెహోషువ 1:9",
    text: "నిబ్బరము కలిగి ధైర్యముగా నుండుము; దిగులుపడకుము జడియకుము; నీవు నడుచు మార్గమంతటిలో నీ దేవుడైన యెహోవా నీకు తోడైయుండును.",
    note: "ప్రభువు మీతోనే నడుస్తున్నారనే ధైర్యంతో ముందుకు సాగండి."
  },
  {
    reference: "కీర్తనలు 46:1",
    text: "దేవుడు మనకు ఆశ్రయమును దుర్గమునై యున్నాడు; ఆపత్కాలములో ఆయన నమ్ముకొనదగిన సహాయకుడు.",
    note: "ఆయన దూరంగా లేరు—ప్రతి అవసరంలోనూ సమీప సహాయకుడిగా ఉన్నారు."
  },
  {
    reference: "2 కొరింథీయులకు 5:7",
    text: "వెలుపటి చూపువలన కాక విశ్వాసమువలననే నడుచుకొనుచున్నాము.",
    note: "ఫలితాన్ని చూడకముందే దేవుని వాగ్దానాన్ని గట్టిగా పట్టుకోండి."
  },
  {
    reference: "యోహాను 8:32",
    text: "అప్పుడు మీరు సత్యమును గ్రహించెదరు; మరియు ఆ సత్యము మిమ్మును స్వతంత్రులనుగా చేయును.",
    note: "లేఖన సత్యంలో నిలబడటం శాశ్వతమైన స్వాతంత్ర్యాన్ని మరియు స్పష్టతను ఇస్తుంది."
  },
  {
    reference: "విలాపవాక్యములు 3:22–23",
    text: "యెహోవా కృప ఎడతెగకయుండును; ఆయన వాత్సల్యమునకు అంతము లేదు. అనుదినము నూతనముగా అది పుట్టుచుండును.",
    note: "ఈ రోజు పరలోకం నుండి నూతన కృప మరియు దయ మీకు అనుగ్రహించబడింది."
  },
  {
    reference: "1 కొరింథీయులకు 16:14",
    text: "మీ కార్యములన్నియు ప్రేమతో జరిగించుడి.",
    note: "ఈ రోజు మీ మాటలలో, సహనంలో, సేవలో క్రీస్తు ప్రేమ ప్రతిఫలించనివ్వండి."
  },
  {
    reference: "కీర్తనలు 27:1",
    text: "యెహోవా నాకు వెలుగును రక్షణయునై యున్నాడు; నేను ఎవరికి భయపడుదును?",
    note: "ప్రభువు మీ జీవితంపై ప్రకాశించినప్పుడు భయానికి చోటు ఉండదు."
  },
  {
    reference: "రోమీయులకు 10:17",
    text: "కాగా వినుట వలన విశ్వాసము కలుగును; వినుట క్రీస్తును గూర్చిన మాట వలన కలుగును.",
    note: "జీవముగల దేవుని వాక్యాన్ని వినడానికి మరియు ధ్యానించడానికి సమయం కేటాయించండి."
  },
  {
    reference: "ఎఫెసీయులకు 2:8",
    text: "మీరు విశ్వాసము ద్వారా కృపచేతనే రక్షింపబడియున్నారు; ఇది మీవలన కలిగినది కాదు, దేవుని వరమే.",
    note: "యేసుక్రీస్తు ఉచితంగా ఇచ్చిన పరిపూర్ణ కృపలో విశ్రమించండి."
  },
  {
    reference: "కీర్తనలు 34:8",
    text: "యెహోవా ఉత్తముడని రుచి చూచి తెలిసికొనుడి; ఆయనను ఆశ్రయించు నరుడు ధన్యుడు.",
    note: "ఆయనపై నమ్మకం ఉంచి ఆయన మంచితనాన్ని అనుభవపూర్వకంగా చూడండి."
  },
  {
    reference: "యెషయా 26:3",
    text: "ఎవని మనస్సు నీమీద ఆనుకొనునో వానిని నీవు పూర్ణశాంతిగలవానిగా కాపాడుదువు; ఏలయనగా వాడు నీయందు విశ్వాసముంచియున్నాడు.",
    note: "మీ ఆలోచనలను ప్రభువుపై నిలిపి మీ హృదయాన్ని సమాధానంలో కాపాడుకోండి."
  },
  {
    reference: "కొలొస్సయులకు 3:23",
    text: "మీరేమి చేసినను అది మనుష్యుల నిమిత్తము కాక ప్రభువు నిమిత్తమని మనస్ఫూర్తిగా చేయుడి.",
    note: "క్రీస్తు కొరకు విశ్వాసంతో చేసే ప్రతి పనికి నిత్యమైన విలువ ఉంది."
  },
  {
    reference: "యోహాను 16:33",
    text: "లోకములో మీకు శ్రమ కలుగును; అయినను ధైర్యము తెచ్చుకొనుడి, నేను లోకమును జయించియున్నాను.",
    note: "ఈ రోజు ధైర్యంగా ఉండండి—మన రక్షకుడు ఇప్పటికే విజయం సాధించారు."
  },
  {
    reference: "కీర్తనలు 91:1–2",
    text: "మహోన్నతుని చాటున నివసించువాడే సర్వశక్తుని నీడను విశ్రమించువాడు.",
    note: "ప్రార్థనలో దేవునికి సమీపంగా ఉండండి; ఆయన నీడలో భద్రత ఉంది."
  },
  {
    reference: "మత్తయి 6:33",
    text: "కాబట్టి మీరు ఆయన రాజ్యమును నీతిని మొదట వెదకుడి; అప్పుడవన్నియు మీకు అనుగ్రహింపబడును.",
    note: "దేవుని రాజ్యానికి మొదటి స్థానం ఇచ్చి ప్రతి అవసరాన్ని ఆయన చేతికి అప్పగించండి."
  },
  {
    reference: "1 పేతురు 5:7",
    text: "ఆయన మిమ్మును గూర్చి చింతించుచున్నాడు గనుక మీ చింత యావత్తు ఆయనమీద వేయుడి.",
    note: "రేపటి చింతలను మీరు ఒంటరిగా మోయాల్సిన అవసరం లేదు."
  },
  {
    reference: "కీర్తనలు 100:5",
    text: "యెహోవా దయాళుడు; ఆయన కృప నిత్యముండును; ఆయన సత్యము తరతరములకు ఉండును.",
    note: "ఎన్నటికీ తరగని ఆయన కృపకై ఈ రోజు ఆయనను స్తుతించండి."
  },
  {
    reference: "యోహాను 1:5",
    text: "ఆ వెలుగు చీకటిలో ప్రకాశించుచున్నది గాని చీకటి దానిని గ్రహింపకుండెను.",
    note: "క్రీస్తు వెలుగు ప్రతి చీకటిని జయిస్తుంది—ఆయన నిరీక్షణలో నడవండి."
  },
  {
    reference: "2 తిమోతి 1:7",
    text: "దేవుడు మనకు శక్తియు ప్రేమయు ఇంద్రియనిగ్రహమును గల ఆత్మనే ఇచ్చెను గాని పిరికితనము గల ఆత్మను ఇయ్యలేదు.",
    note: "ఈ రోజు ధైర్యం, ప్రేమ మరియు స్థిరమైన మనస్సును దేవుని నుండి పొందండి."
  },
  {
    reference: "కీర్తనలు 121:1–2",
    text: "కొండలతట్టు నా కన్నులెత్తుచున్నాను; నాకు సహాయము ఎక్కడనుండి వచ్చును? భూమ్యాకాశములను సృజించిన యెహోవా వలననే నాకు సహాయము కలుగును.",
    note: "విశ్వాసంతో పైకి చూడండి—భూమ్యాకాశాలను సృష్టించిన దేవుని నుండే మీకు సహాయం వస్తుంది."
  },
  {
    reference: "గలతీయులకు 6:9",
    text: "మనము మేలుచేయుటయందు విసుకక యుందము; మనము అలయక యుంటిమేని తగిన కాలమందు పంట కోతుము.",
    note: "చిన్న విషయాలలో నమ్మకంగా ఉండండి; సహనంతో కూడిన విశ్వాసాన్ని దేవుడు ఘనపరుస్తారు."
  },
  {
    reference: "ప్రకటన 22:20",
    text: "ఈ సంగతులను గూర్చి సాక్ష్యమిచ్చుచున్నవాడు—అవును, త్వరగా వచ్చుచున్నాను అనుచున్నాడు. ఆమేన్; ప్రభువైన యేసూ రమ్ము.",
    note: "క్రీస్తు రాకడపై ఆశతో సిద్ధంగా మరియు స్థిరంగా జీవించండి."
  }
];


/* ==========================================
   BILINGUAL DICTIONARY (ENGLISH / TELUGU)
========================================== */

const I18N = {
  en: {
    pageTitle: "Shalom Tabernacle | Visakhapatnam",
    orgName: "Shalom Tabernacle",
    brandTitle: "SHALOM TABERNACLE",
    brandNameHtml: "SHALOM\n<span>TABERNACLE</span>",
    locationText: "Visakhapatnam",
    locationUpper: "VISAKHAPATNAM",
    footerCopy: "© 2026 Shalom Tabernacle. All rights reserved.",
    langSwitchLabel: "తెలుగు",
    langAboutBtn: "తెలుగులో చూడండి (Telugu)",
    langSwitchedToast: "Language switched to English",
    navHome: "Home",
    navVideos: "Videos",
    navPlaylists: "Playlists",
    navFavorites: "Favorites",
    navHistory: "History",
    navAbout: "About",
    lightModeShort: "Light Mode",
    darkModeShort: "Dark Mode",
    switchToLightBtn: "Switch to Light Mode",
    switchToDarkBtn: "Switch to Dark Mode",
    lightThemeToast: "Light theme enabled",
    darkThemeToast: "Dark theme enabled",
    offlineBanner: "You are currently offline. Showing previously loaded messages, saved favorites, and local history.",
    heroEyebrow: "WELCOME TO SHALOM TABERNACLE",
    heroTitleHtml: "Faith. Truth.\n<span>The Word of God.</span>",
    heroQuote: "🕊️ And in here, we don’t have no creed but Christ, that’s the creed; and no law but love; no book but the Bible. And Christ is the Head; and the Bible is our textbook; the world is my parish. So I like to just preach the way that I feel led to preach, and just the way that I see it. 🦅",
    heroAttributionHtml: "PAS. JOEL. P\n<span>Visakhapatnam</span>",
    continueEyebrow: "PICK UP WHERE YOU LEFT OFF",
    continueTitle: "Continue Watching",
    clearBtn: "CLEAR",
    viewAllBtn: "VIEW ALL →",
    verseEyebrow: "DAILY WORD",
    verseTitle: "Daily Bible Verse",
    copyVerseBtn: "Copy Verse",
    shareVerseBtn: "Share Verse",
    verseCopiedToast: "Bible verse copied!",
    verseCopiedShareToast: "Bible verse copied for sharing!",
    verseCopyErrorToast: "Could not copy verse.",
    dailyVerseShareTitle: "Daily Bible Verse",
    recentEyebrow: "FRESH UPLOADS",
    recentTitle: "Recently Added",
    browseLibraryBtn: "BROWSE LIBRARY →",
    loadingRecent: "Loading recent additions...",
    swipeRecentHint: "← Swipe to explore recent videos & playlists →",
    latestEyebrow: "WATCH AND GROW",
    latestTitle: "Latest Messages",
    loadingVideos: "Loading videos...",
    swipeVideosHint: "← Swipe to explore more videos →",
    playlistsEyebrow: "EXPLORE OUR COLLECTIONS",
    playlistsTitle: "Featured Playlists",
    loadingPlaylists: "Loading playlists...",
    swipePlaylistsHint: "← Swipe to explore more playlists →",
    videosHeadingHtml: "Latest <span>Messages.</span>",
    videosSubtitle: "Search by title, preacher, description or category, and sort messages below.",
    searchVideosPlaceholder: "Search by title, preacher, description or category...",
    searchVideosAria: "Search videos",
    sortVideosAria: "Sort videos",
    playlistsHeadingHtml: "Featured <span>Playlists.</span>",
    playlistsSubtitle: "Find collections of messages and worship videos.",
    searchPlaylistsPlaceholder: "Search playlists by title, preacher, description or category...",
    searchPlaylistsAria: "Search playlists",
    sortPlaylistsAria: "Sort playlists",
    sortDefault: "Sort: Default Order",
    sortNewest: "Sort: Newest First",
    sortOldest: "Sort: Oldest First",
    sortTitle: "Sort: Title (A–Z)",
    filterAll: "All",
    loadMoreVideosDefault: "Load More Messages",
    loadMoreVideosRemaining: "Load More Messages ({n} remaining)",
    loadMorePlaylistsDefault: "Load More Playlists",
    loadMorePlaylistsRemaining: "Load More Playlists ({n} remaining)",
    noVideosFound: "No videos found. Try another search or category.",
    noPlaylistsYet: "Playlists will appear here once added.",
    favoritesEyebrow: "SAVED MESSAGES & PLAYLISTS",
    favoritesHeadingHtml: "Your <span>Favorites.</span>",
    favoritesSubtitle: "Messages and playlists saved on this device.",
    noFavoritesCount: "No saved favorites yet",
    clearFavoritesBtn: "CLEAR FAVORITES",
    emptyFavoritesText: "You haven't saved any favorites yet. Tap the heart icon on any video or playlist.",
    historyEyebrow: "YOUR WATCHING ACTIVITY",
    historyHeadingHtml: "Watch <span>Again.</span>",
    historySubtitle: "Find videos you opened recently.",
    noHistoryCount: "No videos in your history",
    clearHistoryBtn: "CLEAR HISTORY",
    emptyHistoryText: "You haven't opened any videos yet.",
    aboutEyebrow: "GET TO KNOW US",
    aboutHeadingHtml: "About <span>Us.</span>",
    aboutSubtitle: "Welcome to Shalom Tabernacle.",
    aboutPanelTitle: "Shalom Tabernacle",
    aboutPara1: "Welcome to Shalom Tabernacle, Visakhapatnam. This website is a place to explore our messages, teachings and worship collections.",
    aboutPara2: "Watch, revisit and share the messages that inspire your faith and help you grow in the Word of God.",
    prefsTitle: "Display & App Preferences",
    prefsDesc: "Customize your reading theme, switch language, install the Shalom Tabernacle app for offline browsing, or share this library with others.",
    installAppBtn: "Install App",
    howToInstallBtn: "How to Install",
    shareWebsiteBtn: "Share Website",
    installTitle: "Install Shalom Tabernacle",
    installBannerSub: "Add to your home screen for quick access to messages & playlists.",
    installBannerSubIos: "Tap below for Safari Add to Home Screen steps.",
    notNowBtn: "Not now",
    gotItBtn: "Got It",
    installGuideIosHtml: "<p>Install <strong>Shalom Tabernacle</strong> directly to your iPhone or iPad home screen:</p><ol><li>Tap the <strong>Share</strong> icon in Safari's toolbar.</li><li>Scroll down and tap <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong> in the top-right corner.</li></ol>",
    installGuideOtherHtml: "<p>Your browser does not show an automatic install prompt right now. You can still install or pin <strong>Shalom Tabernacle</strong>:</p><ol><li>Open your browser's menu (<strong>⋮</strong> or <strong>⋯</strong>) or address bar install icon.</li><li>Choose <strong>Install App</strong>, <strong>Add to Home Screen</strong>, or <strong>Create Shortcut</strong>.</li></ol>",
    installingToast: "Installing Shalom Tabernacle...",
    installedToast: "Shalom Tabernacle app installed!",
    watchVideoBtn: "▶ WATCH VIDEO",
    openPlaylistBtn: "▶ OPEN PLAYLIST",
    watchAgainBtn: "▶ WATCH AGAIN",
    removeHistoryBtn: "Remove from history ×",
    continueLabel: "Continue Watching",
    videoTag: "Video",
    playlistTag: "Playlist",
    playlistCollectionSub: "Shalom Tabernacle Collection",
    addFavAria: "Add to favorites",
    removeFavAria: "Remove from favorites",
    saveFavTitle: "Save to favorites",
    shareTitle: "Share",
    addedFavToast: "Added to Favorites",
    removedFavToast: "Removed from Favorites",
    clearedFavToast: "Favorites cleared",
    clearedHistoryToast: "Viewing history cleared",
    confirmClearFavorites: "Remove all saved favorites?",
    confirmClearHistory: "Clear all your recently watched videos?",
    shareUnavailableToast: "Unable to share this link.",
    websiteCopiedToast: "Website link copied to clipboard!",
    linkCopiedToast: "Link copied to clipboard!",
    copyManualToast: "Copy unavailable. Long-press the link to copy.",
    shareTextTemplate: "Watch \"{title}\" from Shalom Tabernacle ({type})",
    typeMessage: "message",
    typePlaylist: "playlist",
    websiteShareText: "Watch messages and explore playlists from Shalom Tabernacle, Visakhapatnam.",
    offlineNoCacheError: "You are offline and no previously loaded library is cached yet.",
    connectError: "Unable to connect. Please check your internet and refresh.",
    timeoutError: "Connection is taking too long. Please refresh the page.",
    libraryError: "Unable to load the video library.",
    noRecentUploads: "No recent uploads available yet.",
    noVideosAvailable: "No videos available yet.",
    noPlaylistsAvailable: "No playlists available yet."
  },
  te: {
    pageTitle: "షాలోమ్ టబర్నికల్ | విశాఖపట్నం",
    orgName: "షాలోమ్ టబర్నికల్",
    brandTitle: "షాలోమ్ టబర్నికల్",
    brandNameHtml: "షాలోమ్\n<span>టబర్నికల్</span>",
    locationText: "విశాఖపట్నం",
    locationUpper: "విశాఖపట్నం",
    footerCopy: "© 2026 షాలోమ్ టబర్నికల్. సర్వ హక్కులు ప్రత్యేకించబడినవి.",
    langSwitchLabel: "English",
    langAboutBtn: "Switch to English",
    langSwitchedToast: "భాష తెలుగులోకి మార్చబడింది",
    navHome: "హోమ్",
    navVideos: "వీడియోలు",
    navPlaylists: "ప్లేలిస్ట్‌లు",
    navFavorites: "ఇష్టమైనవి",
    navHistory: "చరిత్ర",
    navAbout: "గురించి",
    lightModeShort: "లైట్ మోడ్",
    darkModeShort: "డార్క్ మోడ్",
    switchToLightBtn: "లైట్ మోడ్‌కు మార్చండి",
    switchToDarkBtn: "డార్క్ మోడ్‌కు మార్చండి",
    lightThemeToast: "లైట్ థీమ్ ఆన్ చేయబడింది",
    darkThemeToast: "డార్క్ థీమ్ ఆన్ చేయబడింది",
    offlineBanner: "మీరు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు. గతంలో లోడ్ చేసిన సందేశాలు, సేవ్ చేసిన ఇష్టమైనవి మరియు స్థానిక చరిత్ర చూపబడుతున్నాయి.",
    heroEyebrow: "షాలోమ్ టబర్నికల్‌కు స్వాగతం",
    heroTitleHtml: "విశ్వాసం. సత్యం.\n<span>దేవుని వాక్యం.</span>",
    heroQuote: "🕊️ ఇక్కడ మాకు క్రీస్తు తప్ప మరే విశ్వాస సూత్రం లేదు, అదే మా విశ్వాసం; ప్రేమ తప్ప మరే చట్టం లేదు; బైబిల్ తప్ప మరే గ్రంథం లేదు. క్రీస్తే శిరస్సు; బైబిలే మా పాఠ్యపుస్తకం; లోకమే నా పరిచర్య క్షేత్రం. కాబట్టి నాకు ప్రేరేపించబడిన రీతిలో, నేను చూసిన విధంగానే వాక్యాన్ని ప్రకటించడం నాకు ఇష్టం. 🦅",
    heroAttributionHtml: "పాస్టర్ జోయెల్. పి\n<span>విశాఖపట్నం</span>",
    continueEyebrow: "మీరు ఆపిన చోటు నుండి కొనసాగించండి",
    continueTitle: "చూడటం కొనసాగించండి",
    clearBtn: "క్లియర్",
    viewAllBtn: "అన్నీ చూడండి →",
    verseEyebrow: "దినసరి వాక్యం",
    verseTitle: "నేటి బైబిల్ వాక్యం",
    copyVerseBtn: "వాక్యం కాపీ చేయండి",
    shareVerseBtn: "వాక్యం షేర్ చేయండి",
    verseCopiedToast: "బైబిల్ వాక్యం కాపీ చేయబడింది!",
    verseCopiedShareToast: "షేర్ చేయడానికి బైబిల్ వాక్యం కాపీ చేయబడింది!",
    verseCopyErrorToast: "వాక్యాన్ని కాపీ చేయలేకపోయాము.",
    dailyVerseShareTitle: "నేటి బైబిల్ వాక్యం",
    recentEyebrow: "కొత్తగా చేర్చబడినవి",
    recentTitle: "ఇటీవల చేర్చబడినవి",
    browseLibraryBtn: "లైబ్రరీ చూడండి →",
    loadingRecent: "ఇటీవలి అప్‌లోడ్‌లు లోడ్ అవుతున్నాయి...",
    swipeRecentHint: "← ఇటీవలి వీడియోలు & ప్లేలిస్ట్‌ల కోసం స్వైప్ చేయండి →",
    latestEyebrow: "చూడండి మరియు ఎదగండి",
    latestTitle: "తాజా సందేశాలు",
    loadingVideos: "వీడియోలు లోడ్ అవుతున్నాయి...",
    swipeVideosHint: "← మరిన్ని వీడియోల కోసం స్వైప్ చేయండి →",
    playlistsEyebrow: "మా సేకరణలను చూడండి",
    playlistsTitle: "ప్రత్యేక ప్లేలిస్ట్‌లు",
    loadingPlaylists: "ప్లేలిస్ట్‌లు లోడ్ అవుతున్నాయి...",
    swipePlaylistsHint: "← మరిన్ని ప్లేలిస్ట్‌ల కోసం స్వైప్ చేయండి →",
    videosHeadingHtml: "తాజా <span>సందేశాలు.</span>",
    videosSubtitle: "శీర్షిక, బోధకుడు, వివరణ లేదా వర్గం ద్వారా వెతకండి మరియు సందేశాలను క్రమబద్ధీకరించండి.",
    searchVideosPlaceholder: "శీర్షిక, బోధకుడు, వివరణ లేదా వర్గం ద్వారా వెతకండి...",
    searchVideosAria: "వీడియోలు వెతకండి",
    sortVideosAria: "వీడియోలను క్రమబద్ధీకరించండి",
    playlistsHeadingHtml: "ప్రత్యేక <span>ప్లేలిస్ట్‌లు.</span>",
    playlistsSubtitle: "సందేశాలు మరియు ఆరాధన వీడియోల సేకరణలను కనుగొనండి.",
    searchPlaylistsPlaceholder: "శీర్షిక, బోధకుడు, వివరణ లేదా వర్గం ద్వారా ప్లేలిస్ట్‌లను వెతకండి...",
    searchPlaylistsAria: "ప్లేలిస్ట్‌లు వెతకండి",
    sortPlaylistsAria: "ప్లేలిస్ట్‌లను క్రమబద్ధీకరించండి",
    sortDefault: "క్రమం: సాధారణ క్రమం",
    sortNewest: "క్రమం: కొత్తవి ముందుగా",
    sortOldest: "క్రమం: పాతవి ముందుగా",
    sortTitle: "క్రమం: శీర్షిక (A–Z)",
    filterAll: "అన్నీ",
    loadMoreVideosDefault: "మరిన్ని సందేశాలు లోడ్ చేయండి",
    loadMoreVideosRemaining: "మరిన్ని సందేశాలు లోడ్ చేయండి ({n} మిగిలాయి)",
    loadMorePlaylistsDefault: "మరిన్ని ప్లేలిస్ట్‌లు లోడ్ చేయండి",
    loadMorePlaylistsRemaining: "మరిన్ని ప్లేలిస్ట్‌లు లోడ్ చేయండి ({n} మిగిలాయి)",
    noVideosFound: "వీడియోలు కనుగొనబడలేదు. మరొక శోధన లేదా వర్గాన్ని ప్రయత్నించండి.",
    noPlaylistsYet: "ప్లేలిస్ట్‌లు జోడించబడిన తర్వాత ఇక్కడ కనిపిస్తాయి.",
    favoritesEyebrow: "సేవ్ చేసిన సందేశాలు & ప్లేలిస్ట్‌లు",
    favoritesHeadingHtml: "మీ <span>ఇష్టమైనవి.</span>",
    favoritesSubtitle: "ఈ పరికరంలో సేవ్ చేయబడిన సందేశాలు మరియు ప్లేలిస్ట్‌లు.",
    noFavoritesCount: "ఇంకా ఇష్టమైనవి సేవ్ చేయబడలేదు",
    clearFavoritesBtn: "ఇష్టమైనవి క్లియర్ చేయండి",
    emptyFavoritesText: "మీరు ఇంకా ఏవీ ఇష్టమైన వాటిలో సేవ్ చేయలేదు. ఏదైనా వీడియో లేదా ప్లేలిస్ట్‌పై హార్ట్ చిహ్నాన్ని నొక్కండి.",
    historyEyebrow: "మీరు చూసిన వీడియోల వివరాలు",
    historyHeadingHtml: "మళ్లీ <span>చూడండి.</span>",
    historySubtitle: "మీరు ఇటీవల తెరిచిన వీడియోలను చూడండి.",
    noHistoryCount: "మీ చరిత్రలో వీడియోలు లేవు",
    clearHistoryBtn: "చరిత్రను క్లియర్ చేయండి",
    emptyHistoryText: "మీరు ఇంకా ఏ వీడియోలను తెరవలేదు.",
    aboutEyebrow: "మా గురించి తెలుసుకోండి",
    aboutHeadingHtml: "మా <span>గురించి.</span>",
    aboutSubtitle: "షాలోమ్ టబర్నికల్‌కు స్వాగతం.",
    aboutPanelTitle: "షాలోమ్ టబర్నికల్",
    aboutPara1: "విశాఖపట్నంలోని షాలోమ్ టబర్నికల్‌కు స్వాగతం. ఈ వెబ్‌సైట్ మా సందేశాలు, బోధనలు మరియు ఆరాధన సేకరణలను అన్వేషించడానికి ఒక వేదిక.",
    aboutPara2: "మీ విశ్వాసాన్ని ప్రేరేపించే మరియు దేవుని వాక్యంలో ఎదగడానికి సహాయపడే సందేశాలను చూడండి, మళ్లీ వీక్షించండి మరియు షేర్ చేయండి.",
    prefsTitle: "డిస్‌ప్లే & యాప్ ప్రాధాన్యతలు",
    prefsDesc: "మీ థీమ్ మరియు భాషను మార్చుకోండి, ఆఫ్‌లైన్ బ్రౌజింగ్ కోసం షాలోమ్ టబర్నికల్ యాప్‌ను ఇన్‌స్టాల్ చేయండి లేదా ఈ లైబ్రరీని ఇతరులతో షేర్ చేయండి.",
    installAppBtn: "యాప్ ఇన్‌స్టాల్ చేయండి",
    howToInstallBtn: "ఇన్‌స్టాల్ చేయడం ఎలా",
    shareWebsiteBtn: "వెబ్‌సైట్ షేర్ చేయండి",
    installTitle: "షాలోమ్ టబర్నికల్ ఇన్‌స్టాల్ చేయండి",
    installBannerSub: "సందేశాలు & ప్లేలిస్ట్‌లను త్వరగా చూడటానికి మీ హోమ్ స్క్రీన్‌కు జోడించండి.",
    installBannerSubIos: "సఫారిలో హోమ్ స్క్రీన్‌కు జోడించే దశల కోసం క్రింద నొక్కండి.",
    notNowBtn: "ఇప్పుడు కాదు",
    gotItBtn: "అర్థమైంది",
    installGuideIosHtml: "<p>మీ iPhone లేదా iPad హోమ్ స్క్రీన్‌పై నేరుగా <strong>షాలోమ్ టబర్నికల్</strong> ఇన్‌స్టాల్ చేయండి:</p><ol><li>సఫారి టూల్‌బార్‌లోని <strong>Share</strong> చిహ్నాన్ని నొక్కండి.</li><li>క్రిందికి స్క్రోల్ చేసి <strong>Add to Home Screen</strong> నొక్కండి.</li><li>పై కుడి మూలలో ఉన్న <strong>Add</strong> నొక్కండి.</li></ol>",
    installGuideOtherHtml: "<p>మీ బ్రౌజర్ ప్రస్తుతం ఆటోమేటిక్ ఇన్‌స్టాల్ ప్రాంప్ట్ చూపడం లేదు. అయినా మీరు <strong>షాలోమ్ టబర్నికల్</strong> ఇన్‌స్టాల్ చేయవచ్చు:</p><ol><li>మీ బ్రౌజర్ మెను (<strong>⋮</strong> లేదా <strong>⋯</strong>) లేదా అడ్రస్ బార్ ఇన్‌స్టాల్ చిహ్నాన్ని తెరవండి.</li><li><strong>Install App</strong>, <strong>Add to Home Screen</strong>, లేదా <strong>Create Shortcut</strong> ఎంచుకోండి.</li></ol>",
    installingToast: "షాలోమ్ టబర్నికల్ ఇన్‌స్టాల్ అవుతోంది...",
    installedToast: "షాలోమ్ టబర్నికల్ యాప్ ఇన్‌స్టాల్ చేయబడింది!",
    watchVideoBtn: "▶ వీడియో చూడండి",
    openPlaylistBtn: "▶ ప్లేలిస్ట్ తెరవండి",
    watchAgainBtn: "▶ మళ్లీ చూడండి",
    removeHistoryBtn: "చరిత్ర నుండి తీసివేయండి ×",
    continueLabel: "చూడటం కొనసాగించండి",
    videoTag: "వీడియో",
    playlistTag: "ప్లేలిస్ట్",
    playlistCollectionSub: "షాలోమ్ టబర్నికల్ సేకరణ",
    addFavAria: "ఇష్టమైన వాటిలో చేర్చండి",
    removeFavAria: "ఇష్టమైన వాటి నుండి తీసివేయండి",
    saveFavTitle: "ఇష్టమైన వాటిలో సేవ్ చేయండి",
    shareTitle: "షేర్ చేయండి",
    addedFavToast: "ఇష్టమైన వాటిలో చేర్చబడింది",
    removedFavToast: "ఇష్టమైన వాటి నుండి తీసివేయబడింది",
    clearedFavToast: "ఇష్టమైనవి క్లియర్ చేయబడ్డాయి",
    clearedHistoryToast: "వీక్షణ చరిత్ర క్లియర్ చేయబడింది",
    confirmClearFavorites: "సేవ్ చేసిన అన్ని ఇష్టమైన వాటిని తీసివేయాలా?",
    confirmClearHistory: "మీరు ఇటీవల చూసిన అన్ని వీడియోలను క్లియర్ చేయాలా?",
    shareUnavailableToast: "ఈ లింక్‌ను షేర్ చేయడం సాధ్యం కాలేదు.",
    websiteCopiedToast: "వెబ్‌సైట్ లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది!",
    linkCopiedToast: "లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది!",
    copyManualToast: "కాపీ అందుబాటులో లేదు. కాపీ చేయడానికి లింక్‌ను నొక్కి ఉంచండి.",
    shareTextTemplate: "షాలోమ్ టబర్నికల్ నుండి \"{title}\" ({type}) చూడండి",
    typeMessage: "సందేశం",
    typePlaylist: "ప్లేలిస్ట్",
    websiteShareText: "విశాఖపట్నం షాలోమ్ టబర్నికల్ నుండి సందేశాలు మరియు ప్లేలిస్ట్‌లను చూడండి.",
    offlineNoCacheError: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు మరియు గతంలో లోడ్ చేసిన లైబ్రరీ ఇంకా సేవ్ చేయబడలేదు.",
    connectError: "కనెక్ట్ చేయడం సాధ్యం కాలేదు. దయచేసి మీ ఇంటర్నెట్ తనిఖీ చేసి రిఫ్రెష్ చేయండి.",
    timeoutError: "కనెక్షన్ చాలా సమయం తీసుకుంటోంది. దయచేసి పేజీని రిఫ్రెష్ చేయండి.",
    libraryError: "వీడియో లైబ్రరీని లోడ్ చేయడం సాధ్యం కాలేదు.",
    noRecentUploads: "ఇంకా ఇటీవలి అప్‌లోడ్‌లు అందుబాటులో లేవు.",
    noVideosAvailable: "ఇంకా వీడియోలు అందుబాటులో లేవు.",
    noPlaylistsAvailable: "ఇంకా ప్లేలిస్ట్‌లు అందుబాటులో లేవు."
  }
};

function getPreferredLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "te" || saved === "en") return saved;
  } catch {}
  return "en";
}

function t(key, vars) {
  const dict = I18N[currentLanguage] || I18N.en;
  let text = dict[key] ?? I18N.en[key] ?? key;
  if (vars && typeof vars === "object") {
    Object.keys(vars).forEach((k) => {
      text = text.replaceAll(`{${k}}`, String(vars[k]));
    });
  }
  return text;
}

function formatFavoritesCount(count) {
  if (!count) return t("noFavoritesCount");
  if (currentLanguage === "te") {
    return `${count} సేవ్ చేసిన${count === 1 ? "ది" : "వి"}`;
  }
  return `${count} saved favorite${count === 1 ? "" : "s"}`;
}

function formatHistoryCount(count) {
  if (!count) return t("noHistoryCount");
  if (currentLanguage === "te") {
    return `ఇటీవల తెరిచిన ${count} వీడియో${count === 1 ? "" : "లు"}`;
  }
  return `${count} recently opened video${count === 1 ? "" : "s"}`;
}

function applyLanguage(lang, { rerenderDynamic = true } = {}) {
  currentLanguage = lang === "te" ? "te" : "en";
  document.documentElement.setAttribute("lang", currentLanguage);
  document.title = t("pageTitle");

  try {
    localStorage.setItem(LANG_KEY, currentLanguage);
  } catch {}

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (key) el.innerHTML = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.setAttribute("placeholder", t(key));
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (key) el.setAttribute("aria-label", t(key));
  });

  const langToggleLabel = document.getElementById("langToggleLabel");
  if (langToggleLabel) langToggleLabel.textContent = t("langSwitchLabel");

  const aboutLangBtn = document.getElementById("aboutLangBtn");
  if (aboutLangBtn) aboutLangBtn.textContent = t("langAboutBtn");

  applyTheme(getPreferredTheme());
  syncInstallUI();

  if (rerenderDynamic) {
    renderDailyBibleVerse();
    if (typeof renderHistory === "function") renderHistory();
    renderContinueWatching();
    if (libraryData) {
      renderLibrary(libraryData);
    } else {
      renderFavorites();
    }
  }
}

function initLanguageSwitcher() {
  applyLanguage(getPreferredLanguage(), { rerenderDynamic: false });

  const toggleLanguage = () => {
    const next = currentLanguage === "te" ? "en" : "te";
    applyLanguage(next, { rerenderDynamic: true });
    showToast(t("langSwitchedToast"));
  };

  document.getElementById("langToggleBtn")?.addEventListener("click", toggleLanguage);
  document.getElementById("aboutLangBtn")?.addEventListener("click", toggleLanguage);
}


/* ==========================================
   TOAST CONFIRMATION
========================================== */

function showToast(message) {
  const toast = document.getElementById("appToast");
  if (!toast) return;

  toast.textContent = String(message || "");
  toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}


/* ==========================================
   THEME SWITCHER (DARK DEFAULT / LIGHT)
========================================== */

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

function applyTheme(theme) {
  const mode = theme === "light" ? "light" : "dark";
  const root = document.documentElement;
  const metaTheme = document.getElementById("metaThemeColor");
  const toggleLabel = document.getElementById("themeToggleLabel");
  const toggleIcon = document.getElementById("themeToggleIcon");
  const aboutThemeBtn = document.getElementById("aboutThemeBtn");

  if (mode === "light") {
    root.setAttribute("data-theme", "light");
    if (metaTheme) metaTheme.setAttribute("content", "#F8F5EE");
    if (toggleLabel) toggleLabel.textContent = t("darkModeShort");
    if (aboutThemeBtn) aboutThemeBtn.textContent = t("switchToDarkBtn");
    if (toggleIcon) {
      toggleIcon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
  } else {
    root.removeAttribute("data-theme");
    if (metaTheme) metaTheme.setAttribute("content", "#090909");
    if (toggleLabel) toggleLabel.textContent = t("lightModeShort");
    if (aboutThemeBtn) aboutThemeBtn.textContent = t("switchToLightBtn");
    if (toggleIcon) {
      toggleIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"/>' +
        '<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
  }

  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {}
}

function initThemeSwitcher() {
  applyTheme(getPreferredTheme());

  const toggleHandler = () => {
    const next = getPreferredTheme() === "light" ? "dark" : "light";
    applyTheme(next);
    showToast(next === "light" ? t("lightThemeToast") : t("darkThemeToast"));
  };

  document.getElementById("themeToggleBtn")?.addEventListener("click", toggleHandler);
  document.getElementById("aboutThemeBtn")?.addEventListener("click", toggleHandler);
}


/* ==========================================
   OFFLINE STATUS INDICATOR
========================================== */

function updateOfflineBanner() {
  const banner = document.getElementById("offlineBanner");
  if (!banner) return;
  banner.hidden = navigator.onLine !== false;
}

function initOfflineIndicator() {
  updateOfflineBanner();
  window.addEventListener("online", () => {
    updateOfflineBanner();
    loadLibrary(true);
  });
  window.addEventListener("offline", updateOfflineBanner);
}


/* ==========================================
   COMPACT CACHING & GOOGLE SHEETS DATA LOADING
========================================== */

function compactLibraryForCache(data) {
  const trimVideo = v => ({
    Title: v.Title || "",
    YouTube_ID: v.YouTube_ID || "",
    YouTube_URL: v.YouTube_URL || "",
    Category: v.Category || "",
    Preacher: v.Preacher || v.Speaker || v.Pastor || "",
    Description: String(v.Description || "").slice(0, 240),
    Date: v.Date || v.Published_At || v.PublishedAt || v.Created_At || v.Timestamp || "",
    Featured: v.Featured ?? false,
    Visible: v.Visible ?? true
  });

  const trimPlaylist = p => ({
    Title: p.Title || "",
    YouTube_URL: p.YouTube_URL || "",
    Thumbnail_URL: p.Thumbnail_URL || "",
    First_Video_ID: p.First_Video_ID || "",
    Category: p.Category || "",
    Preacher: p.Preacher || p.Speaker || p.Pastor || "",
    Description: String(p.Description || "").slice(0, 240),
    Date: p.Date || p.Published_At || p.PublishedAt || p.Created_At || p.Timestamp || "",
    Visible: p.Visible ?? true
  });

  return {
    success: true,
    videos: Array.isArray(data.videos) ? data.videos.map(trimVideo) : [],
    playlists: Array.isArray(data.playlists) ? data.playlists.map(trimPlaylist) : []
  };
}

function getCacheAgeMs() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return Infinity;
    const parsed = JSON.parse(cached);
    if (!parsed.time) return Infinity;
    return Date.now() - Number(parsed.time);
  } catch {
    return Infinity;
  }
}

function loadCachedLibrary() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return { loaded: false, ageMs: Infinity };

    const parsed = JSON.parse(cached);
    if (!parsed.data || !parsed.time) return { loaded: false, ageMs: Infinity };

    libraryData = parsed.data;
    renderLibrary(libraryData);

    return { loaded: true, ageMs: Date.now() - Number(parsed.time) };
  } catch (error) {
    console.warn("Library cache unavailable:", error);
    return { loaded: false, ageMs: Infinity };
  }
}

function loadLibrary(forceRefresh = false) {
  const cacheStatus = libraryData
    ? { loaded: true, ageMs: getCacheAgeMs() }
    : loadCachedLibrary();

  if (navigator.onLine === false) {
    if (!libraryData) {
      showError(t("offlineNoCacheError"));
    }
    return;
  }

  // Skip redundant API request when cached public data was refreshed very recently.
  if (!forceRefresh && cacheStatus.loaded && cacheStatus.ageMs < MIN_REVALIDATE_MS) {
    return;
  }

  if (isFetchingLibrary) return;
  isFetchingLibrary = true;

  const oldScript = document.getElementById("library-api-script");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = "library-api-script";
  script.src =
    API_URL +
    "?action=publicData&callback=window.videoLibraryCallback&t=" +
    Date.now();
  script.async = true;

  script.onerror = () => {
    isFetchingLibrary = false;
    clearTimeout(requestTimeout);

    if (!libraryData) {
      showError(t("connectError"));
    }

    console.warn("Google Sheets connection failed.");
  };

  document.body.appendChild(script);

  clearTimeout(requestTimeout);
  requestTimeout = setTimeout(() => {
    isFetchingLibrary = false;
    if (!libraryData && !cacheStatus.loaded) {
      showError(t("timeoutError"));
    }
  }, 15000);
}

window.videoLibraryCallback = function(data) {
  isFetchingLibrary = false;
  clearTimeout(requestTimeout);

  if (!data || !data.success) {
    if (!libraryData) {
      showError(t("libraryError"));
    }
    return;
  }

  libraryData = compactLibraryForCache(data);

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data: libraryData
      })
    );
  } catch (error) {
    console.warn("Could not save library cache:", error);
  }

  renderLibrary(libraryData);
};


/* ==========================================
   RENDER ALL LIBRARY SECTIONS
========================================== */

function renderLibrary(data) {
  const videos = data.videos || [];
  const playlists = data.playlists || [];

  videosLimit = VIDEOS_PAGE_SIZE;
  playlistsLimit = PLAYLISTS_PAGE_SIZE;

  indexLibraryItems(videos, playlists);

  renderCategories();
  renderPlaylistCategories();

  renderVideos(videos);
  renderPlaylists(playlists);

  renderHomeRecent(videos, playlists);
  renderHomeVideos(videos);
  renderHomePlaylists(playlists);

  renderFavorites();
  syncFavoriteButtons();
  markAlreadyLoadedThumbs();
}


/* ==========================================
   SECURITY HELPERS
========================================== */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeYouTubeURL(value) {
  try {
    const url = new URL(value);

    const allowedHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtu.be",
      "www.youtube-nocookie.com"
    ];

    if (!allowedHosts.includes(url.hostname)) {
      return "";
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function safeImageURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function isVisible(item) {
  return String(item.Visible).toUpperCase() !== "FALSE";
}

function validVideo(item) {
  const id = String(item.YouTube_ID || "");
  return (
    /^[A-Za-z0-9_-]{11}$/.test(id) &&
    Boolean(safeYouTubeURL(item.YouTube_URL))
  );
}

function validPlaylist(item) {
  return Boolean(safeYouTubeURL(item.YouTube_URL));
}


/* ==========================================
   DATE & METADATA HELPERS
========================================== */

function extractDateInfo(item) {
  const rawDate =
    item.Date ||
    item.Published_At ||
    item.PublishedAt ||
    item.Published ||
    item.Created_At ||
    item.CreatedAt ||
    item.Added_On ||
    item.Upload_Date ||
    item.Timestamp ||
    "";

  if (!rawDate) return { timestamp: null, label: "" };

  const parsed = Date.parse(String(rawDate));
  if (!Number.isFinite(parsed)) {
    return { timestamp: null, label: "" };
  }

  const formatted = new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return { timestamp: parsed, label: formatted };
}

function getPreacher(item) {
  return String(
    item.Preacher ||
    item.Speaker ||
    item.Pastor ||
    item.Author ||
    ""
  ).trim();
}

function getDescription(item) {
  return String(item.Description || item.Summary || "").trim();
}


/* ==========================================
   OPTIMIZED YOUTUBE THUMBNAIL ENGINE
========================================== */

function getYouTubeThumbURL(id, quality = "hqdefault") {
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

function getPreferredThumbnail(id, customThumbnail = "") {
  if (customThumbnail) return customThumbnail;
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return "./logo.png";

  if (resolvedThumbMap.has(id)) {
    return resolvedThumbMap.get(id);
  }
  return getYouTubeThumbURL(id, "hqdefault");
}

function verifyMaxResThumbnail(id) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
  if (probedMaxResIds.has(id) || navigator.onLine === false) return;

  probedMaxResIds.add(id);
  const maxUrl = getYouTubeThumbURL(id, "maxresdefault");
  if (failedThumbUrls.has(maxUrl)) return;

  const probe = new Image();
  probe.decoding = "async";
  probe.onload = () => {
    // YouTube returns a 120x90 placeholder image when maxresdefault does not exist.
    if (probe.naturalWidth > 120) {
      resolvedThumbMap.set(id, maxUrl);
      document.querySelectorAll(`img.thumb[data-video-id="${id}"]`).forEach(img => {
        if (!img.dataset.customThumb && img.src !== maxUrl) {
          img.src = maxUrl;
        }
      });
    } else {
      failedThumbUrls.add(maxUrl);
    }
  };
  probe.onerror = () => {
    failedThumbUrls.add(maxUrl);
  };
  probe.src = maxUrl;
}

function markThumbLoaded(img) {
  img.classList.add("is-loaded");
  img.closest(".thumb-wrap")?.classList.add("is-loaded");
}

function markAlreadyLoadedThumbs() {
  document.querySelectorAll("img.thumb").forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      markThumbLoaded(img);
    }
  });
}

let thumbnailDelegationReady = false;

function initThumbnailDelegation() {
  if (thumbnailDelegationReady) return;
  thumbnailDelegationReady = true;

  document.addEventListener("load", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("thumb")) return;

    const videoId = img.dataset.videoId || "";
    if (videoId && img.naturalWidth > 0 && !img.src.endsWith("/logo.png")) {
      resolvedThumbMap.set(videoId, img.src);
    }
    markThumbLoaded(img);
  }, true);

  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("thumb")) return;

    const currentSrc = img.currentSrc || img.src || "";
    if (currentSrc && !currentSrc.endsWith("/logo.png")) {
      failedThumbUrls.add(currentSrc);
    }

    const videoId = img.dataset.videoId || "";
    const step = Number(img.dataset.fallback || 0);

    const tryCandidate = (nextStep, candidateUrl) => {
      if (!candidateUrl || failedThumbUrls.has(candidateUrl)) return false;
      img.dataset.fallback = String(nextStep);
      img.src = candidateUrl;
      return true;
    };

    if (/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      if (step === 0 && tryCandidate(1, getYouTubeThumbURL(videoId, "mqdefault"))) {
        return;
      }
      if (step <= 1 && tryCandidate(2, getYouTubeThumbURL(videoId, "default"))) {
        return;
      }
    }

    img.dataset.fallback = "3";
    if (!currentSrc.endsWith("/logo.png")) {
      if (videoId) resolvedThumbMap.set(videoId, "./logo.png");
      img.src = "./logo.png";
    } else {
      markThumbLoaded(img);
    }
  }, true);
}

function createThumbnailHTML(id, title, customThumbnail = "", isPriority = false, shouldCheckMaxRes = false) {
  const validId = /^[A-Za-z0-9_-]{11}$/.test(id);
  const thumbnail = getPreferredThumbnail(id, customThumbnail);

  if (validId && !customThumbnail && shouldCheckMaxRes) {
    verifyMaxResThumbnail(id);
  }

  const loadingAttr = isPriority ? "eager" : "lazy";
  const priorityAttr = isPriority ? ' fetchpriority="high"' : "";

  return `
    <div class="thumb-wrap">
      <img
        class="thumb"
        width="480"
        height="270"
        src="${escapeHTML(thumbnail)}"
        alt="${escapeHTML(title)}"
        loading="${loadingAttr}"
        decoding="async"${priorityAttr}
        data-video-id="${escapeHTML(validId ? id : "")}"
        data-custom-thumb="${customThumbnail ? "1" : ""}"
        data-fallback="0"
      >
    </div>
  `;
}


/* ==========================================
   UNIQUE IDS & ITEM INDEXING
========================================== */

function getVideoItemKey(video) {
  const id = String(video.YouTube_ID || "").trim();
  return id ? `video:${id}` : "";
}

function getPlaylistItemKey(item) {
  const safeUrl = safeYouTubeURL(item.YouTube_URL);
  if (!safeUrl) return "";

  try {
    const parsed = new URL(safeUrl);
    const listId = (parsed.searchParams.get("list") || "").trim();
    if (listId) {
      return `playlist:${listId}`;
    }
  } catch {}

  return `playlist:${safeUrl}`;
}

function buildVideoRecord(video, index = 0) {
  const id = String(video.YouTube_ID || "").trim();
  const key = getVideoItemKey(video);
  const url = safeYouTubeURL(video.YouTube_URL);
  if (!key || !url) return null;

  const category = String(video.Category || "Message").trim();
  const preacher = getPreacher(video);
  const dateInfo = extractDateInfo(video);

  return {
    key,
    type: "video",
    id,
    title: String(video.Title || "Shalom Tabernacle Video").trim(),
    category,
    preacher,
    description: getDescription(video),
    subtitle: preacher
      ? `${t("orgName")} · ${preacher} · ${category}`
      : `${t("orgName")} · ${category}`,
    url,
    thumbnail: getPreferredThumbnail(id),
    firstVideoId: id,
    isFeatured: String(video.Featured).toUpperCase() === "TRUE",
    dateTimestamp: dateInfo.timestamp,
    dateLabel: dateInfo.label,
    sourceIndex: index
  };
}

function buildPlaylistRecord(item, index = 0) {
  const key = getPlaylistItemKey(item);
  const url = safeYouTubeURL(item.YouTube_URL);
  if (!key || !url) return null;

  const customThumbnail = safeImageURL(item.Thumbnail_URL || "");
  const firstVideoId = String(item.First_Video_ID || "").trim();
  const validFirstId = /^[A-Za-z0-9_-]{11}$/.test(firstVideoId);
  const category = String(item.Category || "Collection").trim();
  const preacher = getPreacher(item);
  const dateInfo = extractDateInfo(item);

  return {
    key,
    type: "playlist",
    id: key.replace(/^playlist:/, ""),
    title: String(item.Title || "Shalom Tabernacle Playlist").trim(),
    category,
    preacher,
    description: getDescription(item),
    subtitle: preacher
      ? `${t("orgName")} · ${preacher}`
      : t("playlistCollectionSub"),
    url,
    thumbnail:
      customThumbnail ||
      (validFirstId ? getPreferredThumbnail(firstVideoId) : "./logo.png"),
    firstVideoId: validFirstId ? firstVideoId : "",
    customThumbnail,
    dateTimestamp: dateInfo.timestamp,
    dateLabel: dateInfo.label,
    sourceIndex: index
  };
}

function indexLibraryItems(videos, playlists) {
  libraryItemMap.clear();

  videos.forEach((video, idx) => {
    if (!isVisible(video) || !validVideo(video)) return;
    const record = buildVideoRecord(video, idx);
    if (record) libraryItemMap.set(record.key, record);
  });

  playlists.forEach((playlist, idx) => {
    if (!isVisible(playlist) || !validPlaylist(playlist)) return;
    const record = buildPlaylistRecord(playlist, idx);
    if (record) libraryItemMap.set(record.key, record);
  });
}


/* ==========================================
   ICON SVG HELPERS
========================================== */

function heartIconSVG(filled) {
  return `
    <svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  `;
}

function shareIconSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  `;
}


/* ==========================================
   CARD ACTION BUTTONS (FAVORITE & SHARE)
========================================== */

function createCardIconActionsHTML(record) {
  const favActive = isFavorite(record.key);
  const safeKey = escapeHTML(record.key);
  const safeTitle = escapeHTML(record.title);
  const safeUrl = escapeHTML(record.url);
  const favAria = escapeHTML(favActive ? t("removeFavAria") : t("addFavAria"));
  const favTitle = escapeHTML(favActive ? t("removeFavAria") : t("saveFavTitle"));
  const shareLabel = escapeHTML(t("shareTitle"));

  return `
    <div class="card-icon-actions">
      <button
        type="button"
        class="card-icon-btn fav-btn${favActive ? " active" : ""}"
        data-fav-key="${safeKey}"
        aria-label="${favAria}: ${safeTitle}"
        aria-pressed="${favActive ? "true" : "false"}"
        title="${favTitle}"
      >
        ${heartIconSVG(favActive)}
      </button>
      <button
        type="button"
        class="card-icon-btn share-btn"
        data-share-key="${safeKey}"
        data-share-url="${safeUrl}"
        data-share-title="${safeTitle}"
        data-share-type="${escapeHTML(record.type)}"
        aria-label="${shareLabel} ${safeTitle}"
        title="${shareLabel}"
      >
        ${shareIconSVG()}
      </button>
    </div>
  `;
}


/* ==========================================
   VIDEO & PLAYLIST CARD CREATORS
========================================== */

function createVideoCard(video, index = 0, { showRecentTag = false, isPriority = false } = {}) {
  const record = buildVideoRecord(video, index);
  if (!record) return "";

  libraryItemMap.set(record.key, record);

  const title = escapeHTML(record.title);
  const url = escapeHTML(record.url);
  const subtitle = showRecentTag
    ? escapeHTML(`${t("videoTag")}${record.dateLabel ? " · " + record.dateLabel : " · " + record.category}`)
    : escapeHTML(record.subtitle);

  return `
    <article class="card" data-title="${title}" data-item-key="${escapeHTML(record.key)}" data-item-type="video">

      ${createThumbnailHTML(
        record.firstVideoId,
        title,
        "",
        isPriority,
        isPriority || record.isFeatured
      )}

      <div class="card-info">

        <h3>${title}</h3>

        <p>${subtitle}</p>

        <div class="card-actions">
          <a
            class="play"
            href="${url}"
            target="_blank"
            rel="noopener"
          >
            ${escapeHTML(t("watchVideoBtn"))}
          </a>

          ${createCardIconActionsHTML(record)}
        </div>

      </div>

    </article>
  `;
}

function createPlaylistCard(item, index = 0, { showRecentTag = false, isPriority = false } = {}) {
  const record = buildPlaylistRecord(item, index);
  if (!record) return "";

  libraryItemMap.set(record.key, record);

  const title = escapeHTML(record.title);
  const url = escapeHTML(record.url);
  const subtitle = showRecentTag
    ? escapeHTML(`${t("playlistTag")}${record.dateLabel ? " · " + record.dateLabel : ""}`)
    : escapeHTML(record.subtitle);

  return `
    <article class="card" data-title="${title}" data-item-key="${escapeHTML(record.key)}" data-item-type="playlist">

      ${createThumbnailHTML(
        record.firstVideoId,
        title,
        record.customThumbnail,
        isPriority,
        isPriority
      )}

      <div class="card-info">

        <h3>${title}</h3>

        <p>${subtitle}</p>

        <div class="card-actions">
          <a
            class="play"
            href="${url}"
            target="_blank"
            rel="noopener"
          >
            ${escapeHTML(t("openPlaylistBtn"))}
          </a>

          ${createCardIconActionsHTML(record)}
        </div>

      </div>

    </article>
  `;
}


/* ==========================================
   FAVORITES SYSTEM (LOCALSTORAGE)
========================================== */

function getFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    const seen = new Set();
    return saved.filter(item => {
      if (!item || typeof item.key !== "string" || !item.key) return false;
      if (seen.has(item.key)) return false;
      const validUrl = safeYouTubeURL(item.url);
      if (!validUrl) return false;
      seen.add(item.key);
      return true;
    });
  } catch {
    return [];
  }
}

function saveFavorites(items) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn("Favorites storage is unavailable:", error);
  }
}

function isFavorite(key) {
  if (!key) return false;
  return getFavorites().some(item => item.key === key);
}

function toggleFavoriteByKey(key) {
  if (!key) return;
  const favorites = getFavorites();
  const existingIndex = favorites.findIndex(item => item.key === key);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    saveFavorites(favorites);
    showToast(t("removedFavToast"));
  } else {
    const record = libraryItemMap.get(key);
    if (!record) return;

    const validUrl = safeYouTubeURL(record.url);
    if (!validUrl) return;

    if (!favorites.some(item => item.key === record.key)) {
      favorites.unshift({
        key: record.key,
        type: record.type,
        id: record.id,
        title: record.title,
        subtitle: record.subtitle,
        url: validUrl,
        thumbnail: record.thumbnail,
        firstVideoId: record.firstVideoId,
        savedAt: Date.now()
      });
      saveFavorites(favorites);
    }
    showToast(t("addedFavToast"));
  }

  renderFavorites();
  syncFavoriteButtons();
}

function syncFavoriteButtons() {
  const favKeys = new Set(getFavorites().map(item => item.key));

  document.querySelectorAll(".fav-btn[data-fav-key]").forEach(btn => {
    const active = favKeys.has(btn.dataset.favKey);
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.title = active ? t("removeFavAria") : t("saveFavTitle");
    btn.innerHTML = heartIconSVG(active);
  });
}

function renderFavorites() {
  const grid = document.getElementById("favoritesGrid");
  const empty = document.getElementById("emptyFavorites");
  const count = document.getElementById("favoritesCount");
  const clearBtn = document.getElementById("clearFavorites");

  if (!grid) return;

  const favorites = getFavorites();

  grid.innerHTML = favorites.map(item => {
    const safeUrl = safeYouTubeURL(item.url);
    if (!safeUrl) return "";

    const title = escapeHTML(item.title || t("orgName"));
    const liveRecord = libraryItemMap.get(item.key);
    const subtitle = escapeHTML(
      liveRecord?.subtitle ||
      (item.type === "playlist" ? t("playlistCollectionSub") : t("orgName"))
    );
    const key = escapeHTML(item.key);
    const cta = escapeHTML(item.type === "playlist" ? t("openPlaylistBtn") : t("watchVideoBtn"));
    const firstId = String(item.firstVideoId || "").trim();
    const validFirstId = /^[A-Za-z0-9_-]{11}$/.test(firstId);
    const savedThumb = safeImageURL(item.thumbnail || "");
    const isStandardYouTubeThumb =
      validFirstId && (!savedThumb || savedThumb.includes("ytimg.com") || savedThumb.includes("youtube.com"));
    const customThumb = isStandardYouTubeThumb ? "" : (savedThumb || "./logo.png");
    const shareLabel = escapeHTML(t("shareTitle"));

    return `
      <article class="card" data-item-key="${key}" data-item-type="${escapeHTML(item.type || "video")}">
        ${createThumbnailHTML(firstId, title, customThumb)}

        <div class="card-info">
          <h3>${title}</h3>
          <p>${subtitle}</p>

          <div class="card-actions">
            <a
              class="play"
              href="${escapeHTML(safeUrl)}"
              target="_blank"
              rel="noopener"
            >
              ${cta}
            </a>

            <div class="card-icon-actions">
              <button
                type="button"
                class="card-icon-btn fav-btn active"
                data-fav-key="${key}"
                aria-label="${escapeHTML(t("removeFavAria"))}: ${title}"
                aria-pressed="true"
                title="${escapeHTML(t("removeFavAria"))}"
              >
                ${heartIconSVG(true)}
              </button>
              <button
                type="button"
                class="card-icon-btn share-btn"
                data-share-key="${key}"
                data-share-url="${escapeHTML(safeUrl)}"
                data-share-title="${title}"
                data-share-type="${escapeHTML(item.type || "video")}"
                aria-label="${shareLabel} ${title}"
                title="${shareLabel}"
              >
                ${shareIconSVG()}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  if (empty) empty.hidden = favorites.length !== 0;

  if (count) {
    count.textContent = formatFavoritesCount(favorites.length);
  }

  if (clearBtn) {
    clearBtn.hidden = favorites.length === 0;
  }

  markAlreadyLoadedThumbs();
}


/* ==========================================
   SHARE FUNCTIONALITY (WEB SHARE + COPY FALLBACK)
========================================== */

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

async function handleShare({ title, text, url, isWebsite = false }) {
  const websiteUrl = new URL("./", window.location.href).href;
  const safeTarget = isWebsite ? websiteUrl : safeYouTubeURL(url);
  if (!safeTarget) {
    showToast(t("shareUnavailableToast"));
    return;
  }

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: title || t("orgName"),
        text: text || title || `${t("orgName")}, ${t("locationText")}`,
        url: safeTarget
      });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }
  }

  const copied = await copyTextToClipboard(safeTarget);
  if (copied) {
    showToast(isWebsite ? t("websiteCopiedToast") : t("linkCopiedToast"));
  } else {
    showToast(t("copyManualToast"));
  }
}


/* ==========================================
   CONTINUE WATCHING (HOMEPAGE)
========================================== */

function extractYouTubeIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "").trim();
    }
    return (parsed.searchParams.get("v") || "").trim();
  } catch {
    return "";
  }
}

function renderContinueWatching() {
  const section = document.getElementById("homeContinueSection");
  const row = document.getElementById("homeContinueRow");
  if (!section || !row) return;

  const history = typeof getHistory === "function" ? getHistory() : [];
  if (!history.length) {
    section.hidden = true;
    row.innerHTML = "";
    return;
  }

  section.hidden = false;
  const shareLabel = escapeHTML(t("shareTitle"));

  row.innerHTML = history.slice(0, HOME_ROW_LIMIT).map(item => {
    const safeUrl =
      typeof safeHistoryURL === "function"
        ? safeHistoryURL(item.url)
        : safeYouTubeURL(item.url);
    if (!safeUrl) return "";

    const title = escapeHTML(item.title || t("orgName"));
    const videoId = extractYouTubeIdFromUrl(safeUrl);
    const validId = /^[A-Za-z0-9_-]{11}$/.test(videoId);
    const savedThumb = safeImageURL(item.thumbnail || "");
    const customThumb =
      validId && (!savedThumb || savedThumb.includes("ytimg.com") || savedThumb.includes("youtube.com"))
        ? ""
        : savedThumb;
    const url = escapeHTML(safeUrl);

    return `
      <article class="card" data-item-type="video">
        ${createThumbnailHTML(videoId, title, customThumb)}
        <div class="card-info">
          <h3>${title}</h3>
          <p>${escapeHTML(t("continueLabel"))}</p>
          <div class="card-actions">
            <a class="play" href="${url}" target="_blank" rel="noopener">
              ${escapeHTML(t("watchAgainBtn"))}
            </a>
            <div class="card-icon-actions">
              <button
                type="button"
                class="card-icon-btn share-btn"
                data-share-url="${url}"
                data-share-title="${title}"
                data-share-type="video"
                aria-label="${shareLabel} ${title}"
                title="${shareLabel}"
              >
                ${shareIconSVG()}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  markAlreadyLoadedThumbs();
}


/* ==========================================
   DAILY BIBLE VERSE (LOCAL DATE ROTATION)
========================================== */

function getTodaysBibleVerse() {
  const now = new Date();
  const daySeed =
    now.getFullYear() * 372 +
    (now.getMonth() + 1) * 31 +
    now.getDate();
  const idx = daySeed % DAILY_VERSES.length;
  if (currentLanguage === "te" && DAILY_VERSES_TE[idx]) {
    return DAILY_VERSES_TE[idx];
  }
  return DAILY_VERSES[idx];
}

function getFormattedDailyVerseShareText() {
  const verse = getTodaysBibleVerse();
  if (!verse) return "";
  return `"${verse.text}" — ${verse.reference}\n${verse.note}\n${t("orgName")}, ${t("locationText")}`;
}

function renderDailyBibleVerse() {
  const verse = getTodaysBibleVerse();
  const textEl = document.getElementById("dailyVerseText");
  const refEl = document.getElementById("dailyVerseRef");
  const noteEl = document.getElementById("dailyVerseNote");

  if (!verse || !textEl || !refEl || !noteEl) return;

  textEl.textContent = `“${verse.text}”`;
  refEl.textContent = verse.reference;
  noteEl.textContent = verse.note;
}

function initDailyBibleVerse() {
  renderDailyBibleVerse();

  document.getElementById("copyVerseBtn")?.addEventListener("click", async () => {
    const copied = await copyTextToClipboard(getFormattedDailyVerseShareText());
    showToast(copied ? t("verseCopiedToast") : t("verseCopyErrorToast"));
  });

  document.getElementById("shareVerseBtn")?.addEventListener("click", async () => {
    const verse = getTodaysBibleVerse();
    const formattedShareText = getFormattedDailyVerseShareText();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${t("dailyVerseShareTitle")} — ${verse.reference}`,
          text: formattedShareText,
          url: new URL("./", window.location.href).href
        });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    const copied = await copyTextToClipboard(formattedShareText);
    showToast(copied ? t("verseCopiedShareToast") : t("verseCopyErrorToast"));
  });
}


/* ==========================================
   HOMEPAGE - RECENTLY ADDED, VIDEOS & PLAYLISTS
========================================== */

function renderHomeRecent(videos, playlists) {
  const row = document.getElementById("homeRecentRow");
  if (!row) return;

  const recentVideos = videos
    .map((v, idx) => ({ raw: v, idx, record: isVisible(v) && validVideo(v) ? buildVideoRecord(v, idx) : null }))
    .filter(item => item.record);

  const recentPlaylists = playlists
    .map((p, idx) => ({ raw: p, idx, record: isVisible(p) && validPlaylist(p) ? buildPlaylistRecord(p, idx) : null }))
    .filter(item => item.record);

  const combined = [...recentVideos, ...recentPlaylists].sort((a, b) => {
    const timeA = a.record.dateTimestamp ?? a.idx;
    const timeB = b.record.dateTimestamp ?? b.idx;
    return timeB - timeA;
  });

  const latest = combined.slice(0, HOME_ROW_LIMIT);
  if (!latest.length) {
    row.innerHTML = `<p class="empty">${escapeHTML(t("noRecentUploads"))}</p>`;
    return;
  }

  row.innerHTML = latest
    .map((item, pos) =>
      item.record.type === "playlist"
        ? createPlaylistCard(item.raw, item.idx, { showRecentTag: true, isPriority: pos === 0 })
        : createVideoCard(item.raw, item.idx, { showRecentTag: true, isPriority: pos === 0 })
    )
    .join("");

  markAlreadyLoadedThumbs();
}

function renderHomeVideos(videos) {
  const row = document.getElementById("homeVideoRow");
  if (!row) return;

  const visibleVideos = videos
    .filter(video => isVisible(video) && validVideo(video))
    .slice(0, HOME_ROW_LIMIT);

  if (visibleVideos.length === 0) {
    row.innerHTML = `<p class="empty">${escapeHTML(t("noVideosAvailable"))}</p>`;
    return;
  }

  row.innerHTML = visibleVideos
    .map((v, idx) => createVideoCard(v, idx, { isPriority: idx === 0 }))
    .join("");

  markAlreadyLoadedThumbs();
}

function renderHomePlaylists(playlists) {
  const row = document.getElementById("homePlaylistRow");
  if (!row) return;

  const visiblePlaylists = playlists
    .filter(item => isVisible(item) && validPlaylist(item))
    .slice(0, HOME_ROW_LIMIT);

  if (visiblePlaylists.length === 0) {
    row.innerHTML = `<p class="empty">${escapeHTML(t("noPlaylistsAvailable"))}</p>`;
    return;
  }

  row.innerHTML = visiblePlaylists
    .map((p, idx) => createPlaylistCard(p, idx))
    .join("");

  markAlreadyLoadedThumbs();
}


/* ==========================================
   CATEGORY FILTERS (VIDEOS & PLAYLISTS)
========================================== */

function renderCategories() {
  const filters = document.getElementById("filters");
  if (!filters) return;

  const videos = (libraryData?.videos || []).filter(item =>
    isVisible(item) && validVideo(item)
  );

  const categories = [
    ...new Set(
      videos
        .map(video => String(video.Category || "").trim())
        .filter(Boolean)
    )
  ];

  currentCategory = "All";
  filters.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.className = "filter active";
  allButton.type = "button";
  allButton.textContent = t("filterAll");
  allButton.dataset.category = "All";
  filters.appendChild(allButton);

  categories.forEach(category => {
    const button = document.createElement("button");
    button.className = "filter";
    button.type = "button";
    button.textContent = category;
    button.dataset.category = category;
    filters.appendChild(button);
  });
}

function renderPlaylistCategories() {
  const filters = document.getElementById("playlistFilters");
  if (!filters) return;

  const playlists = (libraryData?.playlists || []).filter(item =>
    isVisible(item) && validPlaylist(item)
  );

  const categories = [
    ...new Set(
      playlists
        .map(item => String(item.Category || "").trim())
        .filter(Boolean)
    )
  ];

  currentPlaylistCategory = "All";
  if (categories.length <= 1) {
    filters.hidden = true;
    filters.innerHTML = "";
    return;
  }

  filters.hidden = false;
  filters.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.className = "filter active";
  allButton.type = "button";
  allButton.textContent = t("filterAll");
  allButton.dataset.category = "All";
  filters.appendChild(allButton);

  categories.forEach(category => {
    const button = document.createElement("button");
    button.className = "filter";
    button.type = "button";
    button.textContent = category;
    button.dataset.category = category;
    filters.appendChild(button);
  });
}

function setLibraryCategory(category, button) {
  currentCategory = category;
  videosLimit = VIDEOS_PAGE_SIZE;

  document.querySelectorAll("#filters .filter").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");
  renderVideos(libraryData?.videos || []);
}

const filterContainer = document.getElementById("filters");
if (filterContainer) {
  filterContainer.addEventListener("click", function(event) {
    const button = event.target.closest(".filter");
    if (!button) return;
    setLibraryCategory(button.dataset.category || "All", button);
  });
}

const playlistFilterContainer = document.getElementById("playlistFilters");
if (playlistFilterContainer) {
  playlistFilterContainer.addEventListener("click", function(event) {
    const button = event.target.closest(".filter");
    if (!button) return;

    currentPlaylistCategory = button.dataset.category || "All";
    playlistsLimit = PLAYLISTS_PAGE_SIZE;
    playlistFilterContainer.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderPlaylists(libraryData?.playlists || []);
  });
}


/* ==========================================
   SORT HELPER
========================================== */

function sortLibraryEntries(entries, sortBy) {
  const list = [...entries];

  if (sortBy === "newest") {
    list.sort((a, b) => {
      const timeA = extractDateInfo(a.item).timestamp ?? a.index;
      const timeB = extractDateInfo(b.item).timestamp ?? b.index;
      return timeB - timeA;
    });
  } else if (sortBy === "oldest") {
    list.sort((a, b) => {
      const timeA = extractDateInfo(a.item).timestamp ?? a.index;
      const timeB = extractDateInfo(b.item).timestamp ?? b.index;
      return timeA - timeB;
    });
  } else if (sortBy === "title") {
    list.sort((a, b) =>
      String(a.item.Title || "").localeCompare(String(b.item.Title || ""))
    );
  }

  return list;
}


/* ==========================================
   VIDEOS TAB - ADVANCED SEARCH, FILTER, SORT & PAGINATION
========================================== */

function matchesSearchQuery(item, query) {
  if (!query) return true;
  const searchable = [
    item.Title,
    getPreacher(item),
    getDescription(item),
    item.Category,
    item.Tags
  ]
    .map(v => String(v || "").toLowerCase())
    .join(" ");
  return searchable.includes(query);
}

function renderVideos(videos) {
  const grid = document.getElementById("videoGrid");
  const empty = document.getElementById("noVideos");
  const loadMoreWrap = document.getElementById("loadMoreVideosWrap");
  const loadMoreBtn = document.getElementById("loadMoreVideosBtn");
  if (!grid) return;

  const query = (document.getElementById("search")?.value || "").trim().toLowerCase();
  const sortBy = document.getElementById("videoSort")?.value || "default";

  const filtered = videos
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const category = String(item.Category || "").trim();
      const matchesCategory =
        currentCategory === "All" || category === currentCategory;

      return (
        isVisible(item) &&
        validVideo(item) &&
        matchesSearchQuery(item, query) &&
        matchesCategory
      );
    });

  const sorted = sortLibraryEntries(filtered, sortBy);
  const visibleSlice = sorted.slice(0, videosLimit);

  grid.innerHTML = visibleSlice
    .map(({ item, index }) => createVideoCard(item, index))
    .join("");

  const remaining = sorted.length - visibleSlice.length;
  if (loadMoreWrap && loadMoreBtn) {
    loadMoreWrap.hidden = remaining <= 0;
    if (remaining > 0) {
      loadMoreBtn.textContent = t("loadMoreVideosRemaining", { n: remaining });
    }
  }

  if (empty) {
    empty.hidden = sorted.length !== 0;
  }

  markAlreadyLoadedThumbs();
}


/* ==========================================
   PLAYLISTS TAB - ADVANCED SEARCH, SORT & PAGINATION
========================================== */

function renderPlaylists(playlists) {
  const grid = document.getElementById("playlistGrid");
  const empty = document.getElementById("noPlaylists");
  const loadMoreWrap = document.getElementById("loadMorePlaylistsWrap");
  const loadMoreBtn = document.getElementById("loadMorePlaylistsBtn");
  if (!grid) return;

  const query = (document.getElementById("playlistSearch")?.value || "").trim().toLowerCase();
  const sortBy = document.getElementById("playlistSort")?.value || "default";

  const visible = playlists
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const category = String(item.Category || "").trim();
      const matchesCategory =
        currentPlaylistCategory === "All" || category === currentPlaylistCategory;

      return (
        isVisible(item) &&
        validPlaylist(item) &&
        matchesSearchQuery(item, query) &&
        matchesCategory
      );
    });

  const sorted = sortLibraryEntries(visible, sortBy);
  const visibleSlice = sorted.slice(0, playlistsLimit);

  grid.innerHTML = visibleSlice
    .map(({ item, index }) => createPlaylistCard(item, index))
    .join("");

  const remaining = sorted.length - visibleSlice.length;
  if (loadMoreWrap && loadMoreBtn) {
    loadMoreWrap.hidden = remaining <= 0;
    if (remaining > 0) {
      loadMoreBtn.textContent = t("loadMorePlaylistsRemaining", { n: remaining });
    }
  }

  if (empty) {
    empty.hidden = sorted.length !== 0;
  }

  markAlreadyLoadedThumbs();
}


/* ==========================================
   CLIENT-SIDE SEARCH & PAGINATION TRIGGERS
========================================== */

function filterVideos() {
  videosLimit = VIDEOS_PAGE_SIZE;
  if (libraryData) {
    renderVideos(libraryData.videos || []);
  }
}

function filterPlaylists() {
  playlistsLimit = PLAYLISTS_PAGE_SIZE;
  if (libraryData) {
    renderPlaylists(libraryData.playlists || []);
  }
}

function initLoadMoreControls() {
  document.getElementById("loadMoreVideosBtn")?.addEventListener("click", () => {
    videosLimit += VIDEOS_PAGE_SIZE;
    if (libraryData) {
      renderVideos(libraryData.videos || []);
    }
  });

  document.getElementById("loadMorePlaylistsBtn")?.addEventListener("click", () => {
    playlistsLimit += PLAYLISTS_PAGE_SIZE;
    if (libraryData) {
      renderPlaylists(libraryData.playlists || []);
    }
  });
}


/* ==========================================
   SMART PWA INSTALL PROMPT
========================================== */

function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

function wasInstallDismissedRecently() {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp < INSTALL_DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function dismissInstallBanner() {
  const banner = document.getElementById("pwaInstallBanner");
  if (banner) banner.hidden = true;

  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
  } catch {}
}

function openInstallGuideModal() {
  const modal = document.getElementById("installGuideModal");
  const body = document.getElementById("installGuideBody");
  if (!modal || !body) return;

  body.innerHTML = isIOSDevice()
    ? t("installGuideIosHtml")
    : t("installGuideOtherHtml");

  modal.hidden = false;
}

function closeInstallGuideModal() {
  const modal = document.getElementById("installGuideModal");
  if (modal) modal.hidden = true;
}

async function triggerInstallFlow() {
  if (isAppInstalled()) {
    syncInstallUI();
    return;
  }

  if (deferredInstallPrompt) {
    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;

      if (choice && choice.outcome === "accepted") {
        const banner = document.getElementById("pwaInstallBanner");
        if (banner) banner.hidden = true;
        showToast(t("installingToast"));
      } else {
        dismissInstallBanner();
      }
      syncInstallUI();
      return;
    } catch {
      deferredInstallPrompt = null;
    }
  }

  openInstallGuideModal();
}

function syncInstallUI() {
  const installed = isAppInstalled();
  const aboutInstallBtn = document.getElementById("aboutInstallBtn");
  const banner = document.getElementById("pwaInstallBanner");
  const bannerSub = document.getElementById("pwaBannerSubtitle");
  const bannerBtn = document.getElementById("pwaBannerInstallBtn");

  if (installed) {
    if (aboutInstallBtn) aboutInstallBtn.hidden = true;
    if (banner) banner.hidden = true;
    return;
  }

  if (aboutInstallBtn) aboutInstallBtn.hidden = false;

  if (banner) {
    if (wasInstallDismissedRecently()) {
      banner.hidden = true;
    } else if (deferredInstallPrompt) {
      if (bannerSub) bannerSub.textContent = t("installBannerSub");
      if (bannerBtn) bannerBtn.textContent = t("installAppBtn");
      banner.hidden = false;
    } else if (isIOSDevice()) {
      if (bannerSub) bannerSub.textContent = t("installBannerSubIos");
      if (bannerBtn) bannerBtn.textContent = t("howToInstallBtn");
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }
}

function initPWAInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInstallUI();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    syncInstallUI();
    showToast(t("installedToast"));
  });

  const displayModeQuery = window.matchMedia("(display-mode: standalone)");
  if (displayModeQuery && typeof displayModeQuery.addEventListener === "function") {
    displayModeQuery.addEventListener("change", syncInstallUI);
  }

  document.getElementById("aboutInstallBtn")?.addEventListener("click", triggerInstallFlow);
  document.getElementById("pwaBannerInstallBtn")?.addEventListener("click", triggerInstallFlow);
  document.getElementById("pwaBannerDismissBtn")?.addEventListener("click", dismissInstallBanner);
  document.getElementById("closeInstallGuideBtn")?.addEventListener("click", closeInstallGuideModal);

  document.getElementById("installGuideModal")?.addEventListener("click", (event) => {
    if (event.target.id === "installGuideModal") {
      closeInstallGuideModal();
    }
  });

  syncInstallUI();
}


/* ==========================================
   SINGLE DELEGATED CARD, HISTORY & SHARE HANDLER
========================================== */

function initCardAndShareInteractions() {
  document.addEventListener("click", function(event) {
    const favBtn = event.target.closest(".fav-btn[data-fav-key]");
    if (favBtn) {
      event.preventDefault();
      toggleFavoriteByKey(favBtn.dataset.favKey);
      return;
    }

    const shareBtn = event.target.closest(".share-btn");
    if (shareBtn) {
      event.preventDefault();
      const key = shareBtn.dataset.shareKey || "";
      const record = libraryItemMap.get(key);
      const url = record?.url || shareBtn.dataset.shareUrl || "";
      const title = record?.title || shareBtn.dataset.shareTitle || t("orgName");
      const typeLabel =
        (record?.type || shareBtn.dataset.shareType) === "playlist"
          ? t("typePlaylist")
          : t("typeMessage");

      handleShare({
        title,
        text: t("shareTextTemplate", { title, type: typeLabel }),
        url
      });
      return;
    }

    const playLink = event.target.closest("a.play");
    if (playLink) {
      const trackedContainer = playLink.closest(
        "#homeVideoRow, #homeRecentRow, #homeContinueRow, #videoGrid, #favoritesGrid"
      );
      if (!trackedContainer) return;

      const card = playLink.closest(".card");
      if (!card || card.dataset.itemType === "playlist") return;

      const title =
        card.querySelector("h3")?.textContent?.trim() ||
        t("orgName");
      const image = card.querySelector("img.thumb");

      if (typeof addToHistory === "function") {
        addToHistory({
          title,
          thumbnail: image?.src || "./logo.png",
          url: playLink.href
        });
      }
    }
  });

  document.getElementById("clearFavorites")?.addEventListener("click", function() {
    const favorites = getFavorites();
    if (!favorites.length) return;
    if (!window.confirm(t("confirmClearFavorites"))) return;
    saveFavorites([]);
    renderFavorites();
    syncFavoriteButtons();
    showToast(t("clearedFavToast"));
  });

  document.getElementById("homeClearHistoryBtn")?.addEventListener("click", function() {
    if (typeof getHistory !== "function" || typeof saveHistory !== "function") return;
    if (!getHistory().length) return;
    if (!window.confirm(t("confirmClearHistory"))) return;
    saveHistory([]);
    showToast(t("clearedHistoryToast"));
  });

  const shareWebsiteHandler = () => {
    handleShare({
      title: t("pageTitle"),
      text: t("websiteShareText"),
      isWebsite: true
    });
  };

  document.getElementById("aboutShareWebsiteBtn")?.addEventListener("click", shareWebsiteHandler);
}


/* ==========================================
   ERROR HANDLING
========================================== */

function showError(message) {
  const homeRecent = document.getElementById("homeRecentRow");
  const homeVideos = document.getElementById("homeVideoRow");
  const homePlaylists = document.getElementById("homePlaylistRow");
  const grid = document.getElementById("videoGrid");

  const error = `<p class="empty">${escapeHTML(message)}</p>`;

  if (homeRecent) homeRecent.innerHTML = error;
  if (homeVideos) homeVideos.innerHTML = error;
  if (homePlaylists) homePlaylists.innerHTML = error;
  if (grid) grid.innerHTML = error;
}


/* ==========================================
   START WEBSITE
========================================== */

initThumbnailDelegation();

document.addEventListener("DOMContentLoaded", () => {
  initLanguageSwitcher();
  initThemeSwitcher();
  initOfflineIndicator();
  initThumbnailDelegation();
  initDailyBibleVerse();
  initLoadMoreControls();
  initCardAndShareInteractions();
  initPWAInstallPrompt();
  if (typeof renderHistory === "function") renderHistory();
  renderContinueWatching();
  renderFavorites();
  markAlreadyLoadedThumbs();
  loadLibrary();

  // Refresh public data silently if returning to tab after CACHE_TIME has elapsed.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && getCacheAgeMs() >= CACHE_TIME) {
      loadLibrary();
    }
  });
});
