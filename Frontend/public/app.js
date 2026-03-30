const loginForm = document.getElementById("loginForm");
const messageDiv = document.getElementById("message");
const dashboard = document.getElementById("dashboard");
const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");

const totalUsers = document.getElementById("totalUsers");
const cloudStatus = document.getElementById("cloudStatus");
const activeServices = document.getElementById("activeServices");
const uptime = document.getElementById("uptime");

async function loadDashboard() {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch("/api/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      dashboard.classList.remove("hidden");
      loginForm.classList.add("hidden");

      welcomeText.textContent = `Hello ${data.data.loggedInUser} (${data.data.role})`;
      totalUsers.textContent = data.data.totalUsers;
      cloudStatus.textContent = data.data.cloudStatus;
      activeServices.textContent = data.data.activeServices;
      uptime.textContent = data.data.uptime;
    } else {
      localStorage.removeItem("token");
    }
  } catch (error) {
    console.error("Dashboard load error:", error);
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  messageDiv.textContent = "Checking login...";
  messageDiv.className = "";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);

      messageDiv.textContent = data.message;
      messageDiv.className = "success";

      await loadDashboard();
    } else {
      messageDiv.textContent = data.message;
      messageDiv.className = "error";
    }
  } catch (error) {
    messageDiv.textContent = "Something went wrong";
    messageDiv.className = "error";
    console.error(error);
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  dashboard.classList.add("hidden");
  loginForm.classList.remove("hidden");
  messageDiv.textContent = "Logged out successfully";
  messageDiv.className = "success";
});

window.addEventListener("load", loadDashboard);
