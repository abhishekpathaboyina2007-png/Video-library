
/* ==========================================
   SHALOM TABERNACLE - OPTIMIZED PUBLIC WEBSITE
   Google Sheets + Horizontal Home Rows
========================================== */

const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0X0bDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

let libraryData = null;
let currentCategory = "All";

const CACHE_KEY = "shalomLibraryCache";
const CACHE_TIME = 5 * 60 * 1000;

let requestTimeout = null;


/* ==========================================
   LOAD CACHED DATA
========================================== */

function loadCachedLibrary() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);

    if (!cached) return false;

    const parsed = JSON.parse(cached);

    if (!parsed.data || !parsed.time) return false;

    // Display cached data immediately, even if stale.
    libraryData = parsed.data;
    renderLibrary(libraryData);

    return true;

  } catch (error) {
    console.warn("Library cache unavailable:", error);
    return false;
  }
}


/* ==========================================
   LOAD FRESH GOOGLE SHEETS DATA
========================================== */

function loadLibrary() {

  // Show cached content first.
  loadCachedLibrary();

  // Request fresh data.
  const oldScript = document.getElementById("library-api-script");

  if (oldScript) oldScript.remove();

  const script = document.createElement("script");

  script.id = "library-api-script";

  script.src = API_URL +
    "?action=publicData&callback=window.videoLibraryCallback&t=" +
    Date.now();

  script.async = true;

  script.onerror = () => {
    clearTimeout(requestTimeout);

    if (!libraryData) {
      showError("Unable to connect. Please check your internet and refresh.");
    }

    console.warn("Google Sheets connection failed.");
  };

  document.body.appendChild(script);

  // Avoid waiting forever if the API does not respond.
  clearTimeout(requestTimeout);

  requestTimeout = setTimeout(() => {
    if (!libraryData) {
      showError("Connection is taking too long. Please refresh the page.");
    }
  }, 15000);
}


/* ==========================================
   RECEIVE FRESH DATA
========================================== */

window.videoLibraryCallback = function(data) {

  clearTimeout(requestTimeout);

  if (!data || !data.success) {

    if (!libraryData) {
      showError("Unable to load the video library.");
    }

    return;
  }

  libraryData = data;

  // Save fresh data for future visits.
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data: data
      })
    );
  } catch (error) {
    console.warn("Could not save library cache:", error);
  }

  renderLibrary(data);
};


/* ==========================================
   RENDER ALL LIBRARY SECTIONS
========================================== */

function renderLibrary(data) {

  const videos = data.videos || [];
  const playlists = data.playlists || [];

  renderCategories();

  renderVideos(videos);
  renderPlaylists(playlists);

  renderHomeVideos(videos);
  renderHomePlaylists(playlists);
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
   THUMBNAIL FALLBACK
========================================== */

function createThumbnailHTML(id, title, customThumbnail = "") {

  const validId = /^[A-Za-z0-9_-]{11}$/.test(id);

  const thumbnail = customThumbnail ||
    (validId
      ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"
      : "./logo.png"
    );

  return `
    <img
      class="thumb"
      src="${escapeHTML(thumbnail)}"
      alt="${escapeHTML(title)}"
      loading="lazy"
      decoding="async"
      onerror="
        const step = Number(this.dataset.fallback || 0);
        const videoId = '${escapeHTML(validId ? id : "")}';

        if (videoId && step === 0) {
          this.dataset.fallback = '1';
          this.src = 'https://i.ytimg.com/vi/' + videoId + '/mqdefault.jpg';
        } else if (videoId && step === 1) {
          this.dataset.fallback = '2';
          this.src = 'https://i.ytimg.com/vi/' + videoId + '/default.jpg';
        } else {
          this.onerror = null;
          this.src = './logo.png';
        }
      "
    >
  `;
}


/* ==========================================
   VIDEO CARD CREATOR
========================================== */

function createVideoCard(video) {

  const id = String(video.YouTube_ID || "");

  const title = escapeHTML(video.Title);

  const url = safeYouTubeURL(video.YouTube_URL);

  const category = escapeHTML(
    video.Category || "Message"
  );

  return `
    <article class="card" data-title="${title}">

      ${createThumbnailHTML(id, title)}

      <div class="card-info">

        <h3>${title}</h3>

        <p>Shalom Tabernacle · ${category}</p>

        <a
          class="play"
          href="${escapeHTML(url)}"
          target="_blank"
          rel="noopener"
        >
          ▶ WATCH VIDEO
        </a>

      </div>

    </article>
  `;
}


/* ==========================================
   PLAYLIST CARD CREATOR
========================================== */

function createPlaylistCard(item) {

  const title = escapeHTML(item.Title);

  const url = safeYouTubeURL(item.YouTube_URL);

  const customThumbnail = safeImageURL(item.Thumbnail_URL || "");

  const firstVideoId = String(item.First_Video_ID || "").trim();

  return `
    <article class="card">

      ${createThumbnailHTML(
        firstVideoId,
        title,
        customThumbnail
      )}

      <div class="card-info">

        <h3>${title}</h3>

        <p>Shalom Tabernacle Collection</p>

        <a
          class="play"
          href="${escapeHTML(url)}"
          target="_blank"
          rel="noopener"
        >
          ▶ OPEN PLAYLIST
        </a>

      </div>

    </article>
  `;
}


/* ==========================================
   HOMEPAGE - HORIZONTAL VIDEOS
========================================== */

function renderHomeVideos(videos) {

  const row = document.getElementById("homeVideoRow");

  if (!row) return;

  const visibleVideos = videos.filter(video =>
    isVisible(video) && validVideo(video)
  );

  if (visibleVideos.length === 0) {

    row.innerHTML = `
      <p class="empty">No videos available yet.</p>
    `;

    return;
  }

  row.innerHTML = visibleVideos
    .map(createVideoCard)
    .join("");
}


/* ==========================================
   HOMEPAGE - HORIZONTAL PLAYLISTS
========================================== */

function renderHomePlaylists(playlists) {

  const row = document.getElementById("homePlaylistRow");

  if (!row) return;

  const visiblePlaylists = playlists.filter(item =>
    isVisible(item) && validPlaylist(item)
  );

  if (visiblePlaylists.length === 0) {

    row.innerHTML = `
      <p class="empty">No playlists available yet.</p>
    `;

    return;
  }

  row.innerHTML = visiblePlaylists
    .map(createPlaylistCard)
    .join("");
}


/* ==========================================
   CATEGORY FILTERS
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


function setLibraryCategory(category, button) {

  currentCategory = category;

  document.querySelectorAll("#filters .filter").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");

  renderVideos(libraryData?.videos || []);
}


/* CATEGORY BUTTON EVENTS */

const filterContainer = document.getElementById("filters");

if (filterContainer) {

  filterContainer.addEventListener("click", function(event) {

    const button = event.target.closest(".filter");

    if (!button) return;

    setLibraryCategory(
      button.dataset.category || "All",
      button
    );

  });

}


/* ==========================================
   VIDEOS TAB - COMPLETE LIBRARY
========================================== */

function renderVideos(videos) {

  const grid = document.getElementById("videoGrid");
  const empty = document.getElementById("noVideos");

  if (!grid) return;

  const query = (
    document.getElementById("search")?.value || ""
  ).trim().toLowerCase();

  const filtered = videos.filter(video => {

    const title = String(video.Title || "").toLowerCase();

    const category = String(video.Category || "").trim();

    const matchesSearch = title.includes(query);

    const matchesCategory =
      currentCategory === "All" ||
      category === currentCategory;

    return (
      isVisible(video) &&
      validVideo(video) &&
      matchesSearch &&
      matchesCategory
    );

  });

  grid.innerHTML = filtered
    .map(createVideoCard)
    .join("");

  if (empty) {
    empty.hidden = filtered.length !== 0;
  }
}


/* ==========================================
   PLAYLISTS TAB - COMPLETE LIBRARY
========================================== */

function renderPlaylists(playlists) {

  const grid = document.getElementById("playlistGrid");
  const empty = document.getElementById("noPlaylists");

  if (!grid) return;

  const visible = playlists.filter(item =>
    isVisible(item) && validPlaylist(item)
  );

  grid.innerHTML = visible
    .map(createPlaylistCard)
    .join("");

  if (empty) {
    empty.hidden = visible.length !== 0;
  }
}


/* ==========================================
   SEARCH
========================================== */

function filterVideos() {

  if (libraryData) {
    renderVideos(libraryData.videos || []);
  }

}


/* ==========================================
   HISTORY - HOMEPAGE VIDEO CLICKS
========================================== */

const homeVideoContainer = document.getElementById("homeVideoRow");

if (homeVideoContainer) {

  homeVideoContainer.addEventListener("click", function(event) {

    const link = event.target.closest("a.play");

    if (!link) return;

    const card = link.closest(".card");

    if (!card) return;

    const title =
      card.querySelector("h3")?.textContent?.trim() ||
      "Shalom Tabernacle Video";

    const thumbnail =
      card.querySelector("img.thumb")?.src || "./logo.png";

    if (typeof addToHistory === "function") {

      addToHistory({
        title,
        url: link.href,
        thumbnail
      });

    }

  });

}


/* ==========================================
   ERROR HANDLING
========================================== */

function showError(message) {

  const homeVideos = document.getElementById("homeVideoRow");
  const homePlaylists = document.getElementById("homePlaylistRow");
  const grid = document.getElementById("videoGrid");

  const error = `<p class="empty">${escapeHTML(message)}</p>`;

  if (homeVideos) homeVideos.innerHTML = error;

  if (homePlaylists) homePlaylists.innerHTML = error;

  if (grid) grid.innerHTML = error;

}


/* ==========================================
   START WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", loadLibrary);
