
const API_URL = "https://script.google.com/macros/s/AKfycby_Lxcf0XbDVZF6hqKcl42YB8AelRc8EoFENbz1D61LaJ9UxZHeqiu7jNtJosgtx05/exec";

let adminToken = sessionStorage.getItem("adminToken");

const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const statusText = document.getElementById("status");

function showDashboard() {
  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

function showLogin() {
  dashboard.classList.add("hidden");
  loginPanel.classList.remove("hidden");
}

if (adminToken) showDashboard();

function postData(values) {
  const body = new URLSearchParams(values);

  return fetch(API_URL, {
    method: "POST",
    body: body
  }).then(response => response.json());
}

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  statusText.textContent = "Logging in...";

  try {
    const result = await postData({
      action: "login",
      password: document.getElementById("password").value
    });

    if (result.success && result.token) {
      adminToken = result.token;
      sessionStorage.setItem("adminToken", adminToken);
      showDashboard();
      statusText.textContent = "Login successful!";
    } else {
      statusText.textContent = result.message || "Incorrect password.";
    }
  } catch (error) {
    statusText.textContent = "Connection error. Check the API.";
  }
});

document.getElementById("videoForm").addEventListener("submit", async event => {
  event.preventDefault();

  statusText.textContent = "Adding video...";

  const record = {
    Title: document.getElementById("title").value.trim(),
    YouTube_URL: document.getElementById("youtubeUrl").value.trim(),
    Category: document.getElementById("category").value.trim(),
    Description: document.getElementById("description").value.trim(),
    Featured: false,
    Visible: true
  };

  try {
    const result = await postData({
      action: "addVideo",
      token: adminToken,
      record: JSON.stringify(record)
    });

    if (result.success) {
      statusText.textContent = "Video added successfully!";
      document.getElementById("videoForm").reset();
    } else {
      statusText.textContent = result.message || "Could not add video.";
    }
  } catch (error) {
    statusText.textContent =
      "Request failed. We may need to fix the API connection.";
  }
});

document.getElementById("logoutButton").addEventListener("click", () => {
  sessionStorage.removeItem("adminToken");
  adminToken = null;
  showLogin();
  statusText.textContent = "Logged out.";
});
