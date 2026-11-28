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
let currentEventFilter = "All";

const CACHE_KEY = "shalomLibraryCache";
const MIN_REVALIDATE_MS = 60 * 1000;
const CACHE_TIME = 5 * 60 * 1000;
const FAVORITES_KEY = "shalomFavorites";
const THEME_KEY = "shalomTheme";
const INSTALL_DISMISS_KEY = "shalomPwaInstallDismissedAt";
const INSTALL_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

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


/* ==========================================
   MANUALLY EDITABLE CHURCH EVENTS CALENDAR
========================================== */

const CHURCH_EVENTS = [
  {
    title: "Sunday Worship Service",
    category: "Sunday Service",
    recurringWeekday: 0,
    time: "10:00 AM IST",
    description: "Weekly gathering for worship, fellowship, and preaching of the Word of God.",
    location: "Shalom Tabernacle, Visakhapatnam"
  },
  {
    title: "Wednesday Prayer & Bible Study",
    category: "Wednesday Service",
    recurringWeekday: 3,
    time: "7:00 PM IST",
    description: "Midweek Scripture teaching, prayer meeting, and spiritual encouragement.",
    location: "Shalom Tabernacle, Visakhapatnam"
  },
  {
    title: "Special Youth & Family Fellowship",
    category: "Special Event",
    date: "2026-12-20",
    time: "5:30 PM IST",
    description: "An evening of worship songs, testimonies, and encouraging messages for families and youth.",
    location: "Shalom Tabernacle Main Hall, Visakhapatnam"
  },
  {
    title: "Year-End Thanksgiving & Watchnight Service",
    category: "Special Event",
    date: "2026-12-31",
    time: "9:30 PM IST",
    description: "Closing the year in gratitude, prayer, and dedication to the Lord for the year ahead.",
    location: "Shalom Tabernacle, Visakhapatnam"
  }
];


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
    if (toggleLabel) toggleLabel.textContent = "Dark Mode";
    if (aboutThemeBtn) aboutThemeBtn.textContent = "Switch to Dark Mode";
    if (toggleIcon) {
      toggleIcon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
  } else {
    root.removeAttribute("data-theme");
    if (metaTheme) metaTheme.setAttribute("content", "#090909");
    if (toggleLabel) toggleLabel.textContent = "Light Mode";
    if (aboutThemeBtn) aboutThemeBtn.textContent = "Switch to Light Mode";
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
    showToast(next === "light" ? "Light theme enabled" : "Dark theme enabled");
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
    playlists: Array.isArray(data.playlists) ? data.playlists.map(trimPlaylist) : [],
    events: Array.isArray(data.events) ? data.events : []
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
      showError("You are offline and no previously loaded library is cached yet.");
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
      showError("Unable to connect. Please check your internet and refresh.");
    }

    console.warn("Google Sheets connection failed.");
  };

  document.body.appendChild(script);

  clearTimeout(requestTimeout);
  requestTimeout = setTimeout(() => {
    isFetchingLibrary = false;
    if (!libraryData && !cacheStatus.loaded) {
      showError("Connection is taking too long. Please refresh the page.");
    }
  }, 15000);
}

window.videoLibraryCallback = function(data) {
  isFetchingLibrary = false;
  clearTimeout(requestTimeout);

  if (!data || !data.success) {
    if (!libraryData) {
      showError("Unable to load the video library.");
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

  renderEvents();
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
      ? `Shalom Tabernacle · ${preacher} · ${category}`
      : `Shalom Tabernacle · ${category}`,
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
      ? `Shalom Tabernacle · ${preacher}`
      : "Shalom Tabernacle Collection",
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

  return `
    <div class="card-icon-actions">
      <button
        type="button"
        class="card-icon-btn fav-btn${favActive ? " active" : ""}"
        data-fav-key="${safeKey}"
        aria-label="${favActive ? "Remove from favorites" : "Add to favorites"}: ${safeTitle}"
        aria-pressed="${favActive ? "true" : "false"}"
        title="${favActive ? "Remove from favorites" : "Save to favorites"}"
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
        aria-label="Share ${safeTitle}"
        title="Share"
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
    ? escapeHTML(`Video${record.dateLabel ? " · " + record.dateLabel : " · " + record.category}`)
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
            ▶ WATCH VIDEO
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
    ? escapeHTML(`Playlist${record.dateLabel ? " · " + record.dateLabel : ""}`)
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
            ▶ OPEN PLAYLIST
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
    showToast("Removed from Favorites");
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
    showToast("Added to Favorites");
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
    btn.title = active ? "Remove from favorites" : "Save to favorites";
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

    const title = escapeHTML(item.title || "Shalom Tabernacle");
    const subtitle = escapeHTML(
      item.subtitle ||
      (item.type === "playlist" ? "Shalom Tabernacle Collection" : "Shalom Tabernacle")
    );
    const key = escapeHTML(item.key);
    const cta = item.type === "playlist" ? "▶ OPEN PLAYLIST" : "▶ WATCH VIDEO";
    const firstId = String(item.firstVideoId || "").trim();
    const validFirstId = /^[A-Za-z0-9_-]{11}$/.test(firstId);
    const savedThumb = safeImageURL(item.thumbnail || "");
    const isStandardYouTubeThumb =
      validFirstId && (!savedThumb || savedThumb.includes("ytimg.com") || savedThumb.includes("youtube.com"));
    const customThumb = isStandardYouTubeThumb ? "" : (savedThumb || "./logo.png");

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
                aria-label="Remove from favorites: ${title}"
                aria-pressed="true"
                title="Remove from favorites"
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
                aria-label="Share ${title}"
                title="Share"
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
    count.textContent = favorites.length
      ? `${favorites.length} saved favorite${favorites.length === 1 ? "" : "s"}`
      : "No saved favorites yet";
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
    showToast("Unable to share this link.");
    return;
  }

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: title || "Shalom Tabernacle",
        text: text || title || "Shalom Tabernacle, Visakhapatnam",
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
    showToast(isWebsite ? "Website link copied to clipboard!" : "Link copied to clipboard!");
  } else {
    showToast("Copy unavailable. Long-press the link to copy.");
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
  row.innerHTML = history.slice(0, HOME_ROW_LIMIT).map(item => {
    const safeUrl =
      typeof safeHistoryURL === "function"
        ? safeHistoryURL(item.url)
        : safeYouTubeURL(item.url);
    if (!safeUrl) return "";

    const title = escapeHTML(item.title || "Shalom Tabernacle Video");
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
          <p>Continue Watching</p>
          <div class="card-actions">
            <a class="play" href="${url}" target="_blank" rel="noopener">
              ▶ WATCH AGAIN
            </a>
            <div class="card-icon-actions">
              <button
                type="button"
                class="card-icon-btn share-btn"
                data-share-url="${url}"
                data-share-title="${title}"
                data-share-type="video"
                aria-label="Share ${title}"
                title="Share"
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
  return DAILY_VERSES[daySeed % DAILY_VERSES.length];
}

function initDailyBibleVerse() {
  const verse = getTodaysBibleVerse();
  const textEl = document.getElementById("dailyVerseText");
  const refEl = document.getElementById("dailyVerseRef");
  const noteEl = document.getElementById("dailyVerseNote");

  if (!verse || !textEl || !refEl || !noteEl) return;

  textEl.textContent = `“${verse.text}”`;
  refEl.textContent = verse.reference;
  noteEl.textContent = verse.note;

  const formattedShareText = `"${verse.text}" — ${verse.reference}\n${verse.note}\nShalom Tabernacle, Visakhapatnam`;

  document.getElementById("copyVerseBtn")?.addEventListener("click", async () => {
    const copied = await copyTextToClipboard(formattedShareText);
    showToast(copied ? "Bible verse copied!" : "Could not copy verse.");
  });

  document.getElementById("shareVerseBtn")?.addEventListener("click", async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Daily Bible Verse — ${verse.reference}`,
          text: formattedShareText,
          url: new URL("./", window.location.href).href
        });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    const copied = await copyTextToClipboard(formattedShareText);
    showToast(copied ? "Bible verse copied for sharing!" : "Could not copy verse.");
  });
}


/* ==========================================
   CHURCH EVENTS CALENDAR
========================================== */

function getNextWeekdayDate(weekday) {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (weekday - base.getDay() + 7) % 7;
  base.setDate(base.getDate() + diff);
  return base;
}

function getUpcomingEvents() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const sheetEvents = Array.isArray(libraryData?.events)
    ? libraryData.events.filter(item => isVisible(item))
    : [];

  const combined = [...CHURCH_EVENTS, ...sheetEvents];

  return combined
    .map(ev => {
      const title = String(ev.title || ev.Title || "").trim();
      if (!title) return null;

      const category = String(ev.category || ev.Category || "Special Event").trim();
      const time = String(ev.time || ev.Time || "").trim();
      const description = String(ev.description || ev.Description || "").trim();
      const location = String(ev.location || ev.Location || "Shalom Tabernacle, Visakhapatnam").trim();

      let dateObj = null;
      if (typeof ev.recurringWeekday === "number") {
        dateObj = getNextWeekdayDate(ev.recurringWeekday);
      } else {
        const rawDate = String(ev.date || ev.Date || "").trim();
        const parsed = rawDate ? new Date(`${rawDate}T00:00:00`) : null;
        if (parsed && Number.isFinite(parsed.getTime())) {
          dateObj = parsed;
        }
      }

      if (!dateObj || dateObj.getTime() < todayStart) {
        return null;
      }

      const dateLabel = dateObj.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      return {
        title,
        category,
        time,
        description,
        location,
        dateTimestamp: dateObj.getTime(),
        dateLabel
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateTimestamp - b.dateTimestamp);
}

function createEventCardHTML(eventItem) {
  return `
    <article class="event-card">
      <span class="event-badge">${escapeHTML(eventItem.category)}</span>
      <h3>${escapeHTML(eventItem.title)}</h3>
      <div class="event-meta">
        ${escapeHTML(eventItem.dateLabel)}${eventItem.time ? " · " + escapeHTML(eventItem.time) : ""}
      </div>
      <p class="event-desc">${escapeHTML(eventItem.description)}</p>
      <div class="event-location">📍 ${escapeHTML(eventItem.location)}</div>
    </article>
  `;
}

function renderEvents() {
  const upcoming = getUpcomingEvents();

  const homeGrid = document.getElementById("homeEventsGrid");
  const homeEmpty = document.getElementById("homeNoEvents");
  if (homeGrid) {
    const preview = upcoming.slice(0, 3);
    homeGrid.innerHTML = preview.map(createEventCardHTML).join("");
    if (homeEmpty) homeEmpty.hidden = preview.length !== 0;
  }

  const grid = document.getElementById("eventsGrid");
  const empty = document.getElementById("noEvents");
  if (grid) {
    const filtered = upcoming.filter(
      item => currentEventFilter === "All" || item.category === currentEventFilter
    );
    grid.innerHTML = filtered.map(createEventCardHTML).join("");
    if (empty) empty.hidden = filtered.length !== 0;
  }
}

function initEventFilters() {
  const container = document.getElementById("eventFilters");
  if (!container) return;

  container.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-event-filter]");
    if (!btn) return;

    currentEventFilter = btn.dataset.eventFilter || "All";
    container.querySelectorAll(".filter").forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    renderEvents();
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
    row.innerHTML = '<p class="empty">No recent uploads available yet.</p>';
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
    row.innerHTML = '<p class="empty">No videos available yet.</p>';
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
    row.innerHTML = '<p class="empty">No playlists available yet.</p>';
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
  allButton.textContent = "All";
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
  allButton.textContent = "All";
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
      loadMoreBtn.textContent = `Load More Messages (${remaining} remaining)`;
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
      loadMoreBtn.textContent = `Load More Playlists (${remaining} remaining)`;
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

  if (isIOSDevice()) {
    body.innerHTML = `
      <p>Install <strong>Shalom Tabernacle</strong> directly to your iPhone or iPad home screen:</p>
      <ol>
        <li>Tap the <strong>Share</strong> icon in Safari's toolbar.</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong> in the top-right corner.</li>
      </ol>
    `;
  } else {
    body.innerHTML = `
      <p>Your browser does not show an automatic install prompt right now. You can still install or pin <strong>Shalom Tabernacle</strong>:</p>
      <ol>
        <li>Open your browser's menu (<strong>⋮</strong> or <strong>⋯</strong>) or address bar install icon.</li>
        <li>Choose <strong>Install App</strong>, <strong>Add to Home Screen</strong>, or <strong>Create Shortcut</strong>.</li>
      </ol>
    `;
  }

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
        showToast("Installing Shalom Tabernacle...");
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
  const installAppBtn = document.getElementById("installAppBtn");
  const aboutInstallBtn = document.getElementById("aboutInstallBtn");
  const banner = document.getElementById("pwaInstallBanner");
  const bannerSub = document.getElementById("pwaBannerSubtitle");
  const bannerBtn = document.getElementById("pwaBannerInstallBtn");

  if (installed) {
    if (installAppBtn) installAppBtn.hidden = true;
    if (aboutInstallBtn) aboutInstallBtn.hidden = true;
    if (banner) banner.hidden = true;
    return;
  }

  if (installAppBtn) installAppBtn.hidden = false;
  if (aboutInstallBtn) aboutInstallBtn.hidden = false;

  if (banner) {
    if (wasInstallDismissedRecently()) {
      banner.hidden = true;
    } else if (deferredInstallPrompt) {
      if (bannerSub) {
        bannerSub.textContent = "Add to your home screen for quick access to messages & playlists.";
      }
      if (bannerBtn) bannerBtn.textContent = "Install App";
      banner.hidden = false;
    } else if (isIOSDevice()) {
      if (bannerSub) {
        bannerSub.textContent = "Tap below for Safari Add to Home Screen steps.";
      }
      if (bannerBtn) bannerBtn.textContent = "How to Install";
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
    showToast("Shalom Tabernacle app installed!");
  });

  const displayModeQuery = window.matchMedia("(display-mode: standalone)");
  if (displayModeQuery && typeof displayModeQuery.addEventListener === "function") {
    displayModeQuery.addEventListener("change", syncInstallUI);
  }

  document.getElementById("installAppBtn")?.addEventListener("click", triggerInstallFlow);
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
      const title = record?.title || shareBtn.dataset.shareTitle || "Shalom Tabernacle";
      const typeLabel =
        (record?.type || shareBtn.dataset.shareType) === "playlist"
          ? "playlist"
          : "message";

      handleShare({
        title,
        text: `Watch "${title}" from Shalom Tabernacle (${typeLabel})`,
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
        "Shalom Tabernacle Video";
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
    if (!window.confirm("Remove all saved favorites?")) return;
    saveFavorites([]);
    renderFavorites();
    syncFavoriteButtons();
    showToast("Favorites cleared");
  });

  document.getElementById("homeClearHistoryBtn")?.addEventListener("click", function() {
    if (typeof getHistory !== "function" || typeof saveHistory !== "function") return;
    if (!getHistory().length) return;
    if (!window.confirm("Clear all your recently watched videos?")) return;
    saveHistory([]);
    showToast("Viewing history cleared");
  });

  const shareWebsiteHandler = () => {
    handleShare({
      title: "Shalom Tabernacle | Visakhapatnam",
      text: "Watch messages and explore playlists from Shalom Tabernacle, Visakhapatnam.",
      isWebsite: true
    });
  };

  document.getElementById("shareWebsiteBtn")?.addEventListener("click", shareWebsiteHandler);
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
  initThemeSwitcher();
  initOfflineIndicator();
  initThumbnailDelegation();
  initDailyBibleVerse();
  initEventFilters();
  initLoadMoreControls();
  initCardAndShareInteractions();
  initPWAInstallPrompt();
  renderContinueWatching();
  renderEvents();
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
