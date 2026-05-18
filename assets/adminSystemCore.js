const AdminSystemCore = (() => {

  const state = {
    authed: localStorage.getItem("admin_auth") === "true",
    user: null
  };

  const el = (id) => document.getElementById(id);

  function init() {
    ensureUI();
    syncUI();
  }

  function ensureUI() {
    if (!el("adminLoginModal")) {
      const div = document.createElement("div");
      div.id = "adminLoginModal";
      div.style.display = "none";
      div.innerHTML = `
        <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6)">
          <div style="background:#fff;padding:20px;width:280px;border-radius:10px">
            <h3>Admin Login</h3>
            <input id="adminUser" placeholder="User" style="width:100%;margin:5px 0;padding:6px"/>
            <input id="adminPass" type="password" placeholder="Pass" style="width:100%;margin:5px 0;padding:6px"/>
            <button id="adminLoginBtn" style="width:100%;padding:8px">Login</button>
          </div>
        </div>
      `;
      document.body.appendChild(div);

      div.querySelector("#adminLoginBtn").onclick = () => login();
    }
  }

  function syncUI() {
    state.authed = localStorage.getItem("admin_auth") === "true";
  }

  function login() {
    const u = el("adminUser")?.value;
    const p = el("adminPass")?.value;

    const ok = u === "admin" && p === "admin123";

    if (ok) {
      localStorage.setItem("admin_auth", "true");
      state.authed = true;
      hideLogin();
    }

    return ok;
  }

  function logout() {
    localStorage.removeItem("admin_auth");
    state.authed = false;
    location.reload();
  }

  function requireAuth(route) {
    syncUI();
    if (route?.auth && !state.authed) {
      showLogin();
      return false;
    }
    return true;
  }

  function showLogin() {
    const m = el("adminLoginModal");
    if (m) m.style.display = "flex";
  }

  function hideLogin() {
    const m = el("adminLoginModal");
    if (m) m.style.display = "none";
  }

  function isAuthed() {
    return state.authed;
  }

  return {
    init,
    login,
    logout,
    requireAuth,
    showLogin,
    hideLogin,
    isAuthed
  };

})();

window.AdminSystemCore = AdminSystemCore;