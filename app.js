
/* VIDEO LIBRARY - PUBLIC WEBSITE CONNECTION */

const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0X0bDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

let libraryData = null;
let currentCategory = "All";

function loadLibrary() {
  const script = document.createElement("script");
  script.src = API_URL + "?action=publicData&callback=window.videoLibraryCallback";
  script.onerror = () => showError("Unable to connect to the library.");
  document.body.appendChild(script);
}

window.videoLibraryCallback = function(data) {
  if (!data || !data.success) {
    showError("Unable to load library data.");
    return;
  }

  libraryData = data;
  applySettings(data.settings || {});
  renderCategories(data.categories || []);
  renderVideos(data.videos || []);
  renderPlaylists(data.playlists || []);
};

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
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(url.hostname)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function applySettings(settings) {
  if (settings.site_title) {
    document.title = settings.site_title;
    document.querySelector(".logo").textContent = settings.site_title;
  }

  if (settings.hero_title) {
    document.querySelector(".hero h1").textContent = settings.hero_title;
  }

  if (settings.hero_subtitle) {
    document.querySelector(".hero p").textContent = settings.hero_subtitle;
  }

  if (settings.accent_color) {
    document.documentElement.style.setProperty("--accent", settings.accent_color);
  }
}

function renderCategories(categories) {
  const filters = document.getElementById("filters");
  if (!filters) return;

  filters.innerHTML = "";

  addFilter("All");

  categories.forEach(category => {
    if (String(category.Visible).toUpperCase() !== "FALSE") {
      addFilter(category.Category_Name);
    }
  });
}

function addFilter(category) {
  const filters = document.getElementById("filters");
  const button = document.createElement("button");

  button.className = "filter" + (category === "All" ? " active" : "");
  button.textContent = category;
  button.onclick = () => {
    currentCategory = category;
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    renderVideos(libraryData.videos || []);
  };

  filters.appendChild(button);
}

function renderVideos(videos) {
  const grid = document.getElementById("videoGrid");
  const empty = document.getElementById("noVideos");
  const query = (document.getElementById("search")?.value || "").toLowerCase();

  if (!grid) return;

  const filtered = videos.filter(video => {
    const matchesCategory = currentCategory === "All" || video.Category === currentCategory;
    const matchesSearch = String(video.Title || "").toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = filtered.map(video => {
    const id = String(video.YouTube_ID || "");
    const url = safeYouTubeURL(video.YouTube_URL);

    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !url) return "";

    const thumbnail = "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";

    return `
      <article class="card">
        <img class="thumb" src="${thumbnail}" alt="${escapeHTML(video.Title)}" loading="lazy">
        <div class="card-info">
          <h3>${escapeHTML(video.Title)}</h3>
          <p>${escapeHTML(video.Category || "Uncategorized")}</p>
          ${video.Date_Added ? `<p>${escapeHTML(video.Date_Added)}</p>` : ""}
          <a class="play" href="${escapeHTML(url)}" target="_blank" rel="noopener">▶ Watch Video</a>
        </div>
      </article>
    `;
  }).join("");

  if (empty) empty.hidden = filtered.length !== 0;
}

function renderPlaylists(playlists) {
  const section = document.getElementById("playlists");
  if (!section) return;

  const visible = playlists.filter(item =>
    String(item.Visible).toUpperCase() !== "FALSE"
  );

  const cards = visible.map(item => {
    const url = safeYouTubeURL(item.YouTube_URL);
    if (!url) return "";

    const thumbnail = item.Thumbnail_URL || "";

    return `
      <article class="card">
        ${thumbnail
          ? `<img class="thumb" src="${escapeHTML(thumbnail)}" alt="${escapeHTML(item.Title)}" loading="lazy">`
          : `<div class="thumb" style="background:linear-gradient(135deg,#252b40,#17181d)"></div>`
        }
        <div class="card-info">
          <h3>${escapeHTML(item.Title)}</h3>
          <p>${escapeHTML(item.Description || item.Category || "Playlist")}</p>
          <a class="play" href="${escapeHTML(url)}" target="_blank" rel="noopener">▶ Open Playlist</a>
        </div>
      </article>
    `;
  }).join("");

  section.innerHTML = `
    <div class="section-head">
      <h2>Featured Playlists</h2>
      <small>${visible.length} collections</small>
    </div>
    ${cards
      ? `<div class="grid">${cards}</div>`
      : `<p class="empty">No playlists available yet.</p>`
    }
  `;
}

function showError(message) {
  const grid = document.getElementById("videoGrid");
  if (grid) grid.innerHTML = `<p class="empty">${escapeHTML(message)}</p>`;
}

// Connect search box to live data
function filterVideos() {
  if (libraryData) renderVideos(libraryData.videos || []);
}

// Start loading the library
document.addEventListener("DOMContentLoaded", loadLibrary);
