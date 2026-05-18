const AdminSystemCore = (() => {

  const state = {
    authed: localStorage.getItem("admin_auth") === "true",
    pendingRoute: null,
    visible: false,
    activeTab: "runtime",
    loginError: null,
    statusMessage: null
  };

  let panel = null;
  let button = null;
  let loginModal = null;

  function getOverlayRoot() {
    return document.getElementById("overlayLayer") || document.body;
  }

  function createLoginModal() {
    if (loginModal) return loginModal;
    loginModal = document.createElement("div");
    loginModal.id = "adminLoginModal";
    loginModal.style.display = "none";
    loginModal.style.position = "fixed";
    loginModal.style.inset = "0";
    loginModal.style.background = "rgba(0,0,0,0.65)";
    loginModal.style.display = "none";
    loginModal.innerHTML = `
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;color:#f8fafc;padding:24px;border-radius:14px;min-width:320px;box-shadow:0 18px 42px rgba(15,23,42,.45);font-family:system-ui,sans-serif;">
        <div style="font-size:18px;font-weight:700;margin-bottom:14px;">Admin Access</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <input id="adminUser" placeholder="Username" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#020617;color:#f8fafc;" />
          <input id="adminPass" type="password" placeholder="Password" style="width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#020617;color:#f8fafc;" />
          <div class="admin-login-error" style="color:#fecaca;min-height:20px;font-size:13px;"></div>
          <button id="adminLoginBtn" style="width:100%;padding:10px;border:none;border-radius:8px;background:#2563eb;color:#f8fafc;cursor:pointer;font-weight:700;">Sign In</button>
        </div>
      </div>
    `;
    getOverlayRoot().appendChild(loginModal);
    loginModal.querySelector("#adminLoginBtn").onclick = () => login();
    return loginModal;
  }

  function createPanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "adminControlPanel";
    panel.style.position = "fixed";
    panel.style.top = "12px";
    panel.style.right = "12px";
    panel.style.width = "420px";
    panel.style.maxHeight = "80vh";
    panel.style.overflow = "auto";
    panel.style.background = "rgba(15, 23, 42, 0.98)";
    panel.style.color = "#f8fafc";
    panel.style.border = "1px solid rgba(148, 163, 184, 0.35)";
    panel.style.borderRadius = "16px";
    panel.style.boxShadow = "0 20px 50px rgba(15, 23, 42, 0.45)";
    panel.style.zIndex = "10010";
    panel.style.fontFamily = "system-ui, sans-serif";
    panel.style.fontSize = "13px";
    panel.style.lineHeight = "1.4";
    panel.style.display = "none";
    panel.style.padding = "14px";
    getOverlayRoot().appendChild(panel);
    return panel;
  }

  function createButton() {
    if (button) return button;
    button = document.createElement("button");
    button.id = "adminControlToggle";
    button.type = "button";
    button.textContent = state.authed ? "Admin Panel" : "Admin Login";
    button.style.position = "fixed";
    button.style.bottom = "12px";
    button.style.right = "12px";
    button.style.padding = "10px 14px";
    button.style.border = "none";
    button.style.borderRadius = "12px";
    button.style.background = "#1d4ed8";
    button.style.color = "#f8fafc";
    button.style.cursor = "pointer";
    button.style.zIndex = "10010";
    button.style.boxShadow = "0 12px 26px rgba(15, 23, 42, 0.3)";
    button.style.fontWeight = "700";
    button.addEventListener("click", () => {
      if (!state.authed) {
        showLogin();
        return;
      }
      togglePanel();
    });
    getOverlayRoot().appendChild(button);
    return button;
  }

  function init() {
    createLoginModal();
    createPanel();
    createButton();
    updateButtonState();
  }

  function updateButtonState() {
    if (!button) return;
    const enabled = getSharedState().config?.admin?.enabled !== false;
    button.style.display = enabled ? "block" : "none";
    button.textContent = state.authed ? "Admin Panel" : "Admin Login";
  }

  function syncUI() {
    state.authed = localStorage.getItem("admin_auth") === "true";
  }

  function login() {
    const u = document.getElementById("adminUser")?.value;
    const p = document.getElementById("adminPass")?.value;
    const ok = u === "admin" && p === "admin123";
    if (!ok) {
      state.loginError = "Invalid username or password.";
      renderLoginError();
      return false;
    }
    localStorage.setItem("admin_auth", "true");
    state.authed = true;
    state.loginError = null;
    hideLogin();
    updateButtonState();
    openPanel();
    if (state.pendingRoute) {
      window.Runtime?.navigate(state.pendingRoute);
      state.pendingRoute = null;
    }
    return true;
  }

  function logout() {
    localStorage.removeItem("admin_auth");
    state.authed = false;
    state.visible = false;
    if (panel) panel.style.display = "none";
    updateButtonState();
    location.reload();
  }

  function requireAuth(route) {
    syncUI();
    if (route?.auth && !state.authed) {
      state.pendingRoute = route.id || null;
      showLogin();
      return false;
    }
    return true;
  }

  function showLogin() {
    if (!loginModal) createLoginModal();
    loginModal.style.display = "flex";
    renderLoginError();
  }

  function hideLogin() {
    if (loginModal) loginModal.style.display = "none";
  }

  function renderLoginError() {
    const errorEl = loginModal?.querySelector(".admin-login-error");
    if (errorEl) {
      errorEl.textContent = state.loginError || "";
    }
  }

  function togglePanel() {
    state.visible = !state.visible;
    if (state.visible) {
      openPanel();
    } else {
      hidePanel();
    }
  }

  function openPanel() {
    const shared = getSharedState();
    if (!shared.config?.admin?.enabled) return;
    if (!state.authed) {
      showLogin();
      return;
    }
    if (!panel) createPanel();
    panel.style.display = "block";
    state.visible = true;
    renderPanel();
  }

  function switchTab(tab) {
    state.activeTab = tab;
    if (state.visible) renderPanel();
  }

  function getSharedState() {
    return Runtime?.getSharedState?.() || { activeRoute: null, currentLayout: null, safeMode: {}, config: {}, registry: {}, moduleHealth: [], pluginHealth: [], booted: false };
  }

  function getSafeModeActive() {
    const safeMode = getSharedState().safeMode || {};
    return Object.values(safeMode).some((value) => !!value);
  }

  function canEditRegistry() {
    return state.authed || getSharedState().safeMode?.safeBoot;
  }

  function renderPanel() {
    if (!panel) createPanel();

    const shared = getSharedState();
    const runtime = {
      route: shared.activeRoute,
      booted: shared.booted,
      safeMode: shared.safeMode,
      recovery: Runtime?.getState?.()?.recovery || {}
    };
    const config = shared.config || {};
    const registryRoutes = shared.registry || {};
    const modules = shared.moduleHealth || [];
    const plugins = shared.pluginHealth || [];
    const errors = Diagnostics.getErrors().slice(-8);
    const warnings = Diagnostics.getWarnings().slice(-8);
    const logs = Diagnostics.getLogs().slice(-8);
    const safeModeActive = getSafeModeActive();
    const canEditRoutes = canEditRegistry();

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:12px;">
        <div>
          <div style="font-size:16px;font-weight:800;">Platform Control Panel</div>
          <div style="font-size:12px;color:#94a3b8;">Operator tooling for runtime, registry, modules, plugins and config</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
          <button onclick="window.AdminSystemCore.logout()" style="padding:6px 10px;border:none;border-radius:10px;background:#991b1b;color:#fff;cursor:pointer;">Logout</button>
          <button onclick="window.AdminSystemCore.hidePanel()" style="padding:6px 10px;border:none;border-radius:10px;background:#334155;color:#f8fafc;cursor:pointer;">Close</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
        ${renderTabButton("runtime", "Runtime")}
        ${renderTabButton("registry", "Registry")}
        ${renderTabButton("modules", "Modules")}
        ${renderTabButton("plugins", "Plugins")}
        ${renderTabButton("config", "Config")}
      </div>
      <div style="margin-bottom:10px;padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#0f172a;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="font-size:12px;color:#cbd5e1;">Booted: ${runtime.booted ? "Yes" : "No"}</div>
          <div style="font-size:12px;color:#cbd5e1;">Active route: ${Diagnostics.escapeText(runtime.route || "none")}</div>
          <div style="font-size:12px;color:#cbd5e1;">Safe mode: ${safeModeActive ? "enabled" : "disabled"}</div>
          <div style="font-size:12px;color:#cbd5e1;">Config admin: ${config.admin?.enabled ? "enabled" : "disabled"}</div>
        </div>
      </div>
      ${renderTabContent(state.activeTab, { runtime, config, registryRoutes, modules, plugins, errors, warnings, logs, canEditRoutes, safeModeActive })}
      <div style="margin-top:12px;padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
        <div style="font-size:12px;color:#94a3b8;">Action state:</div>
        <div style="margin-top:6px;color:${state.statusMessage?.includes("failed") ? "#fecaca" : "#a7f3d0"};">${Diagnostics.escapeText(state.statusMessage || "Ready")}</div>
      </div>
    `;
  }

  function renderTabButton(tab, label) {
    return `<button onclick="window.AdminSystemCore.switchTab('${tab}')" style="padding:8px 12px;border:none;border-radius:10px;cursor:pointer;background:${state.activeTab === tab ? "#2563eb" : "#334155"};color:#f8fafc;font-weight:700;">${Diagnostics.escapeText(label)}</button>`;
  }

  function renderTabContent(tab, context) {
    switch (tab) {
      case "runtime":
        return renderRuntimeTab(context);
      case "registry":
        return renderRegistryTab(context);
      case "modules":
        return renderModulesTab(context);
      case "plugins":
        return renderPluginsTab(context);
      case "config":
        return renderConfigTab(context);
      default:
        return "";
    }
  }

  function renderRuntimeTab({ runtime, config, warnings, errors, logs }) {
    return `
      <div style="display:grid;grid-template-columns:1fr;gap:10px;">
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Runtime Dashboard</div>
              <div style="font-size:12px;color:#cbd5e1;">Booted: ${runtime.booted ? "complete" : "pending"}</div>
          <div style="font-size:12px;color:#cbd5e1;">Current route: ${Diagnostics.escapeText(runtime.route || "none")}</div>
          <div style="font-size:12px;color:#cbd5e1;">Crash counter: ${runtime.recovery?.crashCount || 0}</div>
          <div style="font-size:12px;color:#cbd5e1;">Recovery mode: ${runtime.recovery?.recoveryMode ? "active" : "inactive"}</div>
          <div style="font-size:12px;color:#cbd5e1;">Safe boot: ${runtime.safeMode?.safeBoot ? "yes" : "no"}</div>
          <div style="font-size:12px;color:#cbd5e1;">Diagnostics-only boot: ${runtime.safeMode?.diagnosticsOnlyBoot ? "yes" : "no"}</div>
        </div>
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Recent diagnostics</div>
          <div style="font-size:12px;color:#f97316;">Warnings: ${warnings.length}</div>
          <div style="font-size:12px;color:#ef4444;">Errors: ${errors.length}</div>
          <div style="font-size:12px;color:#38bdf8;">Logs: ${logs.length}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
          <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
            <div style="font-weight:700;margin-bottom:8px;">Runtime errors</div>
            ${renderList(errors.map(item => `${item.timestamp} – ${item.message}`), "No recent errors")}
          </div>
          <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
            <div style="font-weight:700;margin-bottom:8px;">Runtime warnings</div>
            ${renderList(warnings.map(item => `${item.timestamp} – ${item.message}`), "No recent warnings")}
          </div>
        </div>
      </div>
    `;
  }

  function renderRegistryTab({ registryRoutes, canEditRoutes, safeModeActive }) {
    const rows = Object.values(registryRoutes).map((route) => {
      const status = route.enabled === false ? "disabled" : "active";
      const buttonLabel = route.enabled === false ? "Enable" : "Disable";
      const action = canEditRoutes ? `<button onclick="window.AdminSystemCore.toggleRouteEnabled('${Diagnostics.escapeText(route.id)}')" style="padding:6px 10px;border:none;border-radius:8px;background:${route.enabled === false ? `#16a34a` : `#dc2626`};color:#f8fafc;cursor:pointer;">${buttonLabel}</button>` : "";
      return `
        <tr>
          <td style="padding:8px;border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(route.id)}</td>
          <td style="padding:8px;border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(route.layout)}</td>
          <td style="padding:8px;border:1px solid rgba(148,163,184,.2);">${route.auth ? "yes" : "no"}</td>
          <td style="padding:8px;border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(status)}</td>
          <td style="padding:8px;border:1px solid rgba(148,163,184,.2);">${action}</td>
        </tr>
      `;
    }).join("");

    return `
      <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
        <div style="font-weight:700;margin-bottom:10px;">Registry manager</div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:10px;">Edit mode is ${canEditRoutes ? "enabled" : "disabled"}. ${canEditRoutes ? "" : "Admin login or safe mode is required to change route state."}</div>
        <div style="overflow:auto;max-height:300px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid rgba(148,163,184,.3);text-align:left;">Route</th>
                <th style="padding:8px;border:1px solid rgba(148,163,184,.3);text-align:left;">Layout</th>
                <th style="padding:8px;border:1px solid rgba(148,163,184,.3);text-align:left;">Auth</th>
                <th style="padding:8px;border:1px solid rgba(148,163,184,.3);text-align:left;">Status</th>
                <th style="padding:8px;border:1px solid rgba(148,163,184,.3);text-align:left;">Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="margin-top:12px;font-size:12px;color:#cbd5e1;">Safe mode active: ${safeModeActive ? "yes" : "no"}</div>
      </div>
    `;
  }

  function renderModulesTab({ modules }) {
    const rows = modules.map((record) => {
      const status = record.quarantined ? "quarantined" : record.adminDisabled ? "disabled" : "healthy";
      const label = status === "disabled" ? "Enable" : "Disable";
      return `
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;margin-bottom:10px;">
          <div style="font-weight:700;">${Diagnostics.escapeText(record.moduleId)}</div>
          <div style="font-size:12px;color:#cbd5e1;">Status: ${Diagnostics.escapeText(status)}</div>
          <div style="font-size:12px;color:#94a3b8;">Failures: ${record.failureCount || 0}</div>
          <div style="font-size:12px;color:#94a3b8;">Last error: ${Diagnostics.escapeText(record.lastError?.message || record.lastError || "none")}</div>
          <div style="font-size:12px;color:#94a3b8;">Last loaded: ${record.lastLoaded ? new Date(record.lastLoaded).toLocaleString() : "never"}</div>
          <button onclick="window.AdminSystemCore.toggleModuleEnabled('${Diagnostics.escapeText(record.moduleId)}')" style="margin-top:10px;padding:8px 12px;border:none;border-radius:8px;background:${status === "disabled" ? `#16a34a` : `#dc2626`};color:#f8fafc;cursor:pointer;">${label}</button>
        </div>
      `;
    }).join("");

    return `
      <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
        <div style="font-weight:700;margin-bottom:10px;">Module control</div>
        ${rows || `<div style="opacity:.7">No module health records available.</div>`}
      </div>
    `;
  }

  function renderPluginsTab({ plugins }) {
    const rows = plugins.map((record) => {
      const status = record.quarantined ? "quarantined" : record.disabled ? "disabled" : record.status || "registered";
      const label = record.disabled ? "Enable" : "Disable";
      return `
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;margin-bottom:10px;">
          <div style="font-weight:700;">${Diagnostics.escapeText(record.pluginId)}</div>
          <div style="font-size:12px;color:#cbd5e1;">Status: ${Diagnostics.escapeText(status)}</div>
          <div style="font-size:12px;color:#94a3b8;">Failures: ${record.failureCount || 0}</div>
          <div style="font-size:12px;color:#94a3b8;">Last error: ${Diagnostics.escapeText(record.lastError?.message || record.lastError || "none")}</div>
          <button onclick="window.AdminSystemCore.togglePluginEnabled('${Diagnostics.escapeText(record.pluginId)}')" style="margin-top:10px;padding:8px 12px;border:none;border-radius:8px;background:${record.disabled ? `#16a34a` : `#dc2626`};color:#f8fafc;cursor:pointer;">${label}</button>
        </div>
      `;
    }).join("");

    return `
      <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
        <div style="font-weight:700;margin-bottom:10px;">Plugin control</div>
        ${rows || `<div style="opacity:.7">No plugin health records available.</div>`}
      </div>
    `;
  }

  function renderConfigTab({ config }) {
    const jsonText = Diagnostics.escapeText(JSON.stringify(config || {}, null, 2));
    return `
      <div style="display:grid;gap:10px;">
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Config editor</div>
          <div style="font-size:12px;color:#94a3b8;">Changes are validated before applying. Invalid payloads are rejected to protect runtime integrity.</div>
        </div>
        <textarea id="adminConfigEditor" style="width:100%;min-height:240px;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.2);background:#020617;color:#f8fafc;font-family:monospace;font-size:12px;">${jsonText}</textarea>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button onclick="window.AdminSystemCore.applyConfigEditor()" style="padding:10px 14px;border:none;border-radius:10px;background:#16a34a;color:#f8fafc;cursor:pointer;">Apply Config</button>
          <button onclick="window.AdminSystemCore.resetConfigEditor()" style="padding:10px 14px;border:none;border-radius:10px;background:#334155;color:#f8fafc;cursor:pointer;">Reset to Loaded</button>
        </div>
      </div>
    `;
  }

  function renderList(items, emptyLabel = "None") {
    if (!items || !items.length) return `<div style="opacity:.7">${Diagnostics.escapeText(emptyLabel)}</div>`;
    return `<ul style="padding-left:18px;margin:0;">${items.map(item => `<li>${Diagnostics.escapeText(item)}</li>`).join("")}</ul>`;
  }

  function toggleRouteEnabled(routeId) {
    const route = RegistryEngine.getAll()?.[routeId];
    if (!route) return;
    const success = RegistryEngine.setRouteEnabled(routeId, !route.enabled);
    state.statusMessage = success ? `Route ${routeId} ${!route.enabled ? "enabled" : "disabled"}` : `Failed to update route ${routeId}`;
    renderPanel();
  }

  function toggleModuleEnabled(moduleId) {
    const record = ModuleLoader.getHealth().find((item) => item.moduleId === moduleId);
    if (!record) return;
    const nextEnabled = !record.adminDisabled;
    const success = ModuleLoader.setModuleEnabled(moduleId, nextEnabled);
    state.statusMessage = success ? `Module ${moduleId} ${nextEnabled ? "enabled" : "disabled"}` : `Failed to update module ${moduleId}`;
    renderPanel();
  }

  function togglePluginEnabled(pluginId) {
    const record = PluginEngine.getHealth().find((item) => item.pluginId === pluginId);
    if (!record) return;
    const nextEnabled = !record.disabled;
    const success = PluginEngine.setPluginEnabled(pluginId, nextEnabled);
    state.statusMessage = success ? `Plugin ${pluginId} ${nextEnabled ? "enabled" : "disabled"}` : `Failed to update plugin ${pluginId}`;
    renderPanel();
  }

  function applyConfigEditor() {
    const editor = document.getElementById("adminConfigEditor");
    if (!editor) return;
    try {
      const parsed = JSON.parse(editor.value);
      const result = ConfigLoader.apply(parsed);
      if (!result.success) {
        state.statusMessage = `Config apply failed: ${result.error}`;
      } else {
        state.statusMessage = "Config applied successfully.";
        updateButtonState();
        if (!ConfigLoader.get()?.admin?.enabled) {
          state.statusMessage = "Config applied and admin access disabled.";
          hidePanel();
        }
      }
    } catch (err) {
      state.statusMessage = `Config apply failed: ${err.message || "Invalid JSON"}`;
    }
    renderPanel();
  }

  function resetConfigEditor() {
    state.statusMessage = "Config editor reset to loaded configuration.";
    renderPanel();
  }

  function hidePanel() {
    if (panel) panel.style.display = "none";
    state.visible = false;
  }

  function refresh() {
    if (state.visible) renderPanel();
  }

  return {
    init,
    login,
    logout,
    requireAuth,
    showLogin,
    hideLogin,
    isAuthed: () => state.authed,
    switchTab,
    toggleModuleEnabled,
    togglePluginEnabled,
    toggleRouteEnabled,
    applyConfigEditor,
    resetConfigEditor,
    refresh,
    updateButtonState,
    openPanel,
    hidePanel
  };

})();

window.AdminSystemCore = AdminSystemCore;