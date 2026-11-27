
/* SHALOM TABERNACLE - PUBLIC WEBSITE */

const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0X0bDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

let libraryData = null;
let currentCategory = "All";

/* LOAD GOOGLE SHEETS DATA */

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

  // Branding stays permanently in index.html.
  // Google Sheets only controls videos and playlists.

  renderCategories();
  renderVideos(data.videos || []);
  renderPlaylists(data.playlists || []);
};

/* SECURITY */

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

    if (![
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtube-nocookie.com"
    ].includes(url.hostname)) return "";

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

/* SINGLE CATEGORY */

function renderCategories() {
  const filters = document.getElementById("filters");

  if (!filters) return;

  filters.innerHTML = `
    <button class="filter active"
      onclick="setLibraryCategory('All', this)">
      All
    </button>
  `;

  currentCategory = "All";
}

function setLibraryCategory(category, button) {
  currentCategory = category;

  document.querySelectorAll(".filter").forEach(b => {
    b.classList.remove("active");
  });

  button.classList.add("active");

  renderVideos(libraryData?.videos || []);
}

/* VIDEO DISPLAY */

function renderVideos(videos) {
  const grid = document.getElementById("videoGrid");
  const empty = document.getElementById("noVideos");

  if (!grid) return;

  const query = (
    document.getElementById("search")?.value || ""
  ).toLowerCase();

  const filtered = videos.filter(video => {
    const visible =
      String(video.Visible).toUpperCase() !== "FALSE";

    const matchesSearch =
      String(video.Title || "").toLowerCase().includes(query);

    return visible && matchesSearch;
  });

  grid.innerHTML = filtered.map(video => {
    const id = String(video.YouTube_ID || "");
    const url = safeYouTubeURL(video.YouTube_URL);

    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !url) {
      return "";
    }

    const thumbnail =
      "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";

    return `
      <article class="card"
        data-title="${escapeHTML(video.Title)}">

        <img class="thumb"
          src="${thumbnail}"
          alt="${escapeHTML(video.Title)}"
          loading="lazy">

        <div class="card-info">
          <h3>${escapeHTML(video.Title)}</h3>

          <p>Shalom Tabernacle</p>

          <a class="play"
            href="${escapeHTML(url)}"
            target="_blank"
            rel="noopener">
            ▶ Watch Video
          </a>
        </div>
      </article>
    `;
  }).join("");

  if (empty) {
    empty.hidden = filtered.length !== 0;
  }
}

/* PLAYLIST DISPLAY */

function renderPlaylists(playlists) {
  const grid = document.getElementById("playlistGrid");
  const empty = document.getElementById("noPlaylists");

  if (!grid) return;

  const visible = playlists.filter(item =>
    String(item.Visible).toUpperCase() !== "FALSE"
  );

  const cards = visible.map(item => {
    const url = safeYouTubeURL(item.YouTube_URL);

    if (!url) return "";

    const thumbnail = safeImageURL(item.Thumbnail_URL || "");

    return `
      <article class="card">

        ${thumbnail
          ? `<img class="thumb"
              src="${escapeHTML(thumbnail)}"
              alt="${escapeHTML(item.Title)}"
              loading="lazy">`
          : `<div class="thumb"
              style="background:linear-gradient(135deg,#45111d,#171717)">
            </div>`
        }

        <div class="card-info">
          <h3>${escapeHTML(item.Title)}</h3>

          <p>Shalom Tabernacle Collection</p>

          <a class="play"
            href="${escapeHTML(url)}"
            target="_blank"
            rel="noopener">
            ▶ Open Playlist
          </a>
        </div>
      </article>
    `;
  }).join("");

  grid.innerHTML = cards;

  if (empty) {
    empty.hidden = cards.length !== 0;
  }
}

/* ERROR HANDLING */

function showError(message) {
  const grid = document.getElementById("videoGrid");

  if (grid) {
    grid.innerHTML =
      `<p class="empty">${escapeHTML(message)}</p>`;
  }
}

/* SEARCH */

function filterVideos() {
  if (libraryData) {
    renderVideos(libraryData.videos || []);
  }
}

/* START */

document.addEventListener("DOMContentLoaded", loadLibrary);
