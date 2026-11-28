/* ==========================================
   SHALOM TABERNACLE - OPTIMIZED PUBLIC WEBSITE
   Google Sheets + Horizontal Home Rows
   + Performance-Optimized Thumbnails,
     Pagination, Favorites, Share, PWA Install,
     Continue Watching, Advanced Search,
     Bilingual Switcher & Theme Switcher
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
    updateAvailableTitle: "New Update Available",
    updateAvailableSub: "Tap refresh to load the latest features and improvements.",
    laterBtn: "Later",
    refreshNowBtn: "Refresh Now",
    updatingBtn: "Updating...",
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
    updateAvailableTitle: "కొత్త అప్‌డేట్ అందుబాటులో ఉంది",
    updateAvailableSub: "కొత్త ఫీచర్లు మరియు మార్పులను పొందడానికి ఇప్పుడే రిఫ్రెష్ చేయండి.",
    laterBtn: "తర్వాత",
    refreshNowBtn: "ఇప్పుడే రిఫ్రెష్",
    updatingBtn: "అప్‌డేట్ అవుతోంది...",
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
  const updateBanner = document.getElementById("pwaUpdateBanner");
  const bannerSub = document.getElementById("pwaBannerSubtitle");
  const bannerBtn = document.getElementById("pwaBannerInstallBtn");

  if (installed) {
    if (aboutInstallBtn) aboutInstallBtn.hidden = true;
    if (banner) banner.hidden = true;
    return;
  }

  if (aboutInstallBtn) aboutInstallBtn.hidden = false;

  if (banner) {
    if (updateBanner && !updateBanner.hidden) {
      banner.hidden = true;
    } else if (wasInstallDismissedRecently()) {
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
