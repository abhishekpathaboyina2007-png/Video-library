
/* ==========================================
   SHALOM TABERNACLE - PUBLIC WEBSITE
   Google Sheets + Responsive Video Library
========================================== */

const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0X0bDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

const ITEMS_PER_PAGE = 12;

let libraryData = null;
let currentCategory = "All";
let videoLimit = ITEMS_PER_PAGE;
let playlistLimit = ITEMS_PER_PAGE;


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

  renderCategories();
  renderVideos(data.videos || []);
  renderPlaylists(data.playlists || []);

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


/* ==========================================
   SHOW MORE BUTTON CREATOR
========================================== */

function createMoreButton(gridId, buttonId, label) {

  let button = document.getElementById(buttonId);

  if (button) return button;

  const grid = document.getElementById(gridId);

  if (!grid) return null;

  button = document.createElement("button");

  button.id = buttonId;
  button.className = "outline-button";
  button.type = "button";
  button.textContent = label;

  button.style.display = "none";
  button.style.margin = "30px auto 0";
  button.style.width = "fit-content";

  grid.insertAdjacentElement("afterend", button);

  return button;

}


/* ==========================================
   CATEGORY FILTERS
========================================== */

function renderCategories() {

  const filters = document.getElementById("filters");

  if (!filters) return;

  const videos = (libraryData?.videos || []).filter(isVisible);

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
  videoLimit = ITEMS_PER_PAGE;

  document.querySelectorAll("#filters .filter").forEach(item => {
    item.classList.remove("active");
  });

  button.classList.add("active");

  renderVideos(libraryData?.videos || []);

}


/* Category button clicks */

document.getElementById("filters").addEventListener(
  "click",
  function(event) {

    const button = event.target.closest(".filter");

    if (!button) return;

    setLibraryCategory(button.dataset.category || "All", button);

  }
);


/* ==========================================
   VIDEO DISPLAY
========================================== */

function renderVideos(videos) {

  const grid = document.getElementById("videoGrid");
  const empty = document.getElementById("noVideos");

  if (!grid) return;

  const query = (
    document.getElementById("search")?.value || ""
  ).trim().toLowerCase();


  const filtered = videos.filter(video => {

    const visible = isVisible(video);

    const title = String(video.Title || "").toLowerCase();

    const category = String(video.Category || "").trim();

    const matchesSearch = title.includes(query);

    const matchesCategory =
      currentCategory === "All" ||
      category === currentCategory;

    return visible && matchesSearch && matchesCategory;

  });


  const validVideos = filtered.filter(video => {

    const id = String(video.YouTube_ID || "");

    const url = safeYouTubeURL(video.YouTube_URL);

    return /^[A-Za-z0-9_-]{11}$/.test(id) && Boolean(url);

  });


  const displayed = validVideos.slice(0, videoLimit);


  grid.innerHTML = displayed.map(video => {

    const id = String(video.YouTube_ID || "");

    const title = escapeHTML(video.Title);

    const url = safeYouTubeURL(video.YouTube_URL);

    const thumbnail =
      "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";

    const category = escapeHTML(video.Category || "Message");

    return `
      <article class="card"
        data-title="${title}"
        data-category="${category}">

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

  }).join("");


  if (empty) {
    empty.hidden = validVideos.length !== 0;
  }


  /* SHOW MORE BUTTON */

  const moreButton = createMoreButton(
    "videoGrid",
    "showMoreVideos",
    "SHOW MORE VIDEOS ↓"
  );

  if (moreButton) {

    moreButton.style.display =
      validVideos.length > videoLimit ? "flex" : "none";

    moreButton.onclick = function() {

      videoLimit += ITEMS_PER_PAGE;

      renderVideos(videos);

    };

  }

}


/* ==========================================
   PLAYLIST DISPLAY
========================================== */

function renderPlaylists(playlists) {

  const grid = document.getElementById("playlistGrid");
  const empty = document.getElementById("noPlaylists");

  if (!grid) return;


  const visible = playlists.filter(item => {

    return isVisible(item) &&
      Boolean(safeYouTubeURL(item.YouTube_URL));

  });


  const displayed = visible.slice(0, playlistLimit);


  grid.innerHTML = displayed.map(item => {

    const url = safeYouTubeURL(item.YouTube_URL);

    const title = escapeHTML(item.Title);

    const thumbnail =
      safeImageURL(item.Thumbnail_URL || "") || "./logo.png";

    return `
      <article class="card">

        <img
          class="thumb"
          src="${escapeHTML(thumbnail)}"
          alt="${title}"
          loading="lazy"
          onerror="this.onerror=null;this.src='./logo.png';"
        >

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

  }).join("");


  if (empty) {
    empty.hidden = visible.length !== 0;
  }


  /* SHOW MORE PLAYLISTS */

  const moreButton = createMoreButton(
    "playlistGrid",
    "showMorePlaylists",
    "SHOW MORE PLAYLISTS ↓"
  );

  if (moreButton) {

    moreButton.style.display =
      visible.length > playlistLimit ? "flex" : "none";

    moreButton.onclick = function() {

      playlistLimit += ITEMS_PER_PAGE;

      renderPlaylists(playlists);

    };

  }

}


/* ==========================================
   SEARCH
========================================== */

function filterVideos() {

  videoLimit = ITEMS_PER_PAGE;

  if (libraryData) {
    renderVideos(libraryData.videos || []);
  }

}


/* ==========================================
   ERROR HANDLING
========================================== */

function showError(message) {

  const grid = document.getElementById("videoGrid");

  if (grid) {

    grid.innerHTML =
      `<p class="empty">${escapeHTML(message)}</p>`;

  }

}


/* ==========================================
   START WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", loadLibrary);
