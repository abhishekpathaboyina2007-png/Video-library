
/* ==========================================
   SHALOM TABERNACLE - PUBLIC WEBSITE
   Google Sheets + Horizontal Home Rows
========================================== */

const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0X0bDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

let libraryData = null;
let currentCategory = "All";


/* ==========================================
   LOAD GOOGLE SHEETS DATA
========================================== */

function loadLibrary() {

  const script = document.createElement("script");

  script.src = API_URL +
    "?action=publicData&callback=window.videoLibraryCallback&t=" +
    Date.now();

  script.onerror = () => {
    showError("Unable to connect. Please refresh the page.");
  };

  document.body.appendChild(script);

}


window.videoLibraryCallback = function(data) {

  if (!data || !data.success) {
    showError("Unable to load the video library.");
    return;
  }

  libraryData = data;

  const videos = data.videos || [];
  const playlists = data.playlists || [];

  renderCategories();

  // Complete libraries
  renderVideos(videos);
  renderPlaylists(playlists);

  // Homepage horizontal rows
  renderHomeVideos(videos);
  renderHomePlaylists(playlists);

};


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
   VIDEO CARD CREATOR
========================================== */

function createVideoCard(video) {

  const id = String(video.YouTube_ID || "");

  const title = escapeHTML(video.Title);

  const url = safeYouTubeURL(video.YouTube_URL);

  const category = escapeHTML(
    video.Category || "Message"
  );

  const thumbnail =
    "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";

  return `
    <article class="card" data-title="${title}">

      <img
        class="thumb"
        src="${thumbnail}"
        alt="${title}"
        loading="lazy"
      >

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

  const thumbnail = customThumbnail ||
    (/^[A-Za-z0-9_-]{11}$/.test(firstVideoId)
      ? "https://i.ytimg.com/vi/" + firstVideoId + "/maxresdefault.jpg"
      : "./logo.png"
    );

  return `
    <article class="card">
      <img class="thumb"
        src="${escapeHTML(thumbnail)}"
        alt="${title}"
        loading="lazy"
        onerror="
          if (this.dataset.fallback === '0') {
            this.dataset.fallback = '1';
            this.src = 'https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg';
          } else if (this.dataset.fallback === '1') {
            this.dataset.fallback = '2';
            this.src = 'https://i.ytimg.com/vi/${firstVideoId}/sddefault.jpg';
          } else {
            this.onerror = null;
            this.src = './logo.png';
          }
        ">
      <div class="card-info">
        <h3>${title}</h3>
        <p>Shalom Tabernacle Collection</p>
        <a class="play" href="${escapeHTML(url)}"
          target="_blank" rel="noopener">
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

document.getElementById("filters").addEventListener(
  "click",
  function(event) {

    const button = event.target.closest(".filter");

    if (!button) return;

    setLibraryCategory(
      button.dataset.category || "All",
      button
    );

  }
);


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

document.getElementById("homeVideoRow").addEventListener(
  "click",
  function(event) {

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

  }
);


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
