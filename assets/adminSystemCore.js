const AdminSystemCore = (() => {

  const state = {
    visible: false,
    activeTab: "runtime",
    activeCategory: "overview",
    activeSub: null,
    statusMessage: null
  };

  let panel = null;
  let button = null;

  function getOverlayRoot() {
    return document.getElementById("overlayLayer") || document.body;
  }

  function createPanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "adminControlPanel";
    getOverlayRoot().appendChild(panel);
    return panel;
  }

  function hasAdminAccess() {
    return window.UserCoreSystem?.can?.("platform.admin.access") === true;
  }

  function createButton() {
    if (button) return button;
    button = document.createElement("button");
    button.id = "adminControlToggle";
    button.type = "button";
    button.textContent = "Admin Panel";
    button.addEventListener("click", () => {
      if (!hasAdminAccess()) {
        return;
      }
      togglePanel();
    });
    getOverlayRoot().appendChild(button);
    return button;
  }

  function init() {
    createPanel();
    createButton();
    updateButtonState();
    Lifecycle.on("user:login", updateButtonState);
    Lifecycle.on("user:logout", updateButtonState);
    Lifecycle.on("user:register", updateButtonState);
  }

  function updateButtonState() {
    if (!button) return;
    const enabled = getSharedState().config?.admin?.enabled !== false;
    const hasAccess = hasAdminAccess();
    button.style.display = enabled && hasAccess ? "block" : "none";
    if (button.style.display === "block") {
      button.textContent = "Admin Panel";
    }
    if (!hasAccess) {
      hidePanel();
    }
  }

  function requireAuth(route) {
    if (!route) return true;
    return window.UserCoreSystem?.isRouteAccessible(route) ?? true;
  }

  function logout() {
    if (window.UserCoreSystem?.logout) {
      window.UserCoreSystem.logout();
    }
    state.visible = false;
    if (panel) panel.style.display = "none";
    updateButtonState();
  }

  function openPanel() {
    const shared = getSharedState();
    if (!shared.config?.admin?.enabled) return;
    if (!hasAdminAccess()) {
      updateButtonState();
      return;
    }
    if (!panel) createPanel();
    panel.style.display = "block";
    state.visible = true;
    renderPanel();
  }

  function togglePanel() {
    state.visible = !state.visible;
    if (state.visible) {
      openPanel();
    } else {
      hidePanel();
    }
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
    return hasAdminAccess() || getSharedState().safeMode?.safeBoot;
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

    // New fullscreen admin console shell: sidebar + main workspace
    panel.innerHTML = `
      <div class="admin-console">
        <aside class="admin-console-sidebar">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div>
              <div class="admin-console-title">WebbyOS Admin Console</div>
              <div class="admin-console-subtitle">Control panel for runtime, registry, modules, and site settings</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
              <button class="admin-button-danger" onclick="window.AdminSystemCore.logout()">Logout</button>
              <button class="admin-button-secondary" onclick="window.AdminSystemCore.hidePanel()">Close</button>
            </div>
          </div>
          <div style="margin-top:8px;">
            ${renderCategoryItem("overview", "Overview")}
            ${renderCategoryItem("site", "Site")}
            ${renderCategoryItem("community", "Community")}
            ${renderCategoryItem("content", "Content")}
            ${renderCategoryItem("users", "Users & Roles")}
            ${renderCategoryItem("permissions", "Permissions")}
            ${renderCategoryItem("appearance", "Appearance")}
            ${renderCategoryItem("builders", "Builders")}
            ${renderCategoryItem("extensions", "Extensions")}
            ${renderCategoryItem("maintenance", "Maintenance")}
            ${renderCategoryItem("system", "System")}
          </div>
        </aside>
        <main class="admin-console-main">
          <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div class="admin-console-toolbar">
              <div class="admin-console-title" style="font-size:15px;margin-bottom:4px;">${Diagnostics.escapeText(state.activeCategory.toUpperCase())}</div>
              <div class="admin-console-subtitle">${Diagnostics.escapeText(state.activeSub || "Overview")}</div>
            </div>
            <div class="admin-actions">
              <div class="admin-badge">Booted: ${runtime.booted ? "Yes" : "No"}</div>
              <div class="admin-badge">Route: ${Diagnostics.escapeText(runtime.route || "none")}</div>
              <div class="admin-badge">Safe mode: ${safeModeActive ? "enabled" : "disabled"}</div>
            </div>
          </div>
          <div id="adminConsoleContent" style="min-height:400px;">
            ${renderCategoryContent(state.activeCategory)}
          </div>
          <div style="margin-top:12px;">
            <div class="admin-muted">Action state</div>
            <div class="${state.statusMessage?.includes("failed") ? "admin-badge admin-badge-danger" : "admin-badge admin-badge-success"}">${Diagnostics.escapeText(state.statusMessage || "Ready")}</div>
          </div>
        </main>
      </div>
    `;
  }

  function renderCategoryItem(id, label) {
    return `<div class="admin-console-category ${state.activeCategory === id ? 'active' : ''}" onclick="window.AdminSystemCore.switchCategory('${id}')">${Diagnostics.escapeText(label)}</div>`;
  }

  function switchCategory(cat) {
    state.activeCategory = cat;
    state.activeSub = null;
    if (state.visible) renderPanel();
  }

  function switchSub(sub) {
    state.activeSub = sub;
    if (state.visible) renderPanel();
  }

  function renderCategoryContent(category) {
    const shared = getSharedState();
    switch (category) {
      case "overview":
        return renderRuntimeTab({ runtime: { route: shared.activeRoute, booted: shared.booted, safeMode: shared.safeMode, recovery: Runtime?.getState?.()?.recovery || {} }, config: shared.config, warnings: Diagnostics.getWarnings().slice(-8), errors: Diagnostics.getErrors().slice(-8), logs: Diagnostics.getLogs().slice(-8) });
      case "site":
        return `
          <div style="display:grid;gap:12px;">
            ${renderThemeTab({ config: shared.config || {} })}
            ${renderNavigationTab()}
            <div style="padding-top:6px;">${renderHomepageTab()}</div>
          </div>
        `;
      case "community":
        return `
          <div style="display:grid;gap:12px;">
            ${renderCmsTab()}
            ${renderMediaTab()}
            <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
              <div style="font-weight:700;margin-bottom:8px;">Community tools</div>
              <div style="color:#94a3b8;font-size:12px;">Forums, messaging, notifications, activity feed, reputation and moderation summaries appear here when available.</div>
            </div>
          </div>
        `;
      case "content":
        return `
          <div style="display:grid;gap:12px;">
            ${renderCmsTab()}
            <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">${renderList((window.RevisionCoreSystem?.listRecent?.() || []).map(r=> r.id + ' ' + (r.message||'')), 'No revisions')}</div>
            <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">${renderList((window.SearchCoreSystem?.indexStatus?.() ? ["Index available"] : []), 'Search status unknown')}</div>
          </div>
        `;
      case "users":
        return `
          <div style="display:grid;gap:12px;">
            <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
              <div style="font-weight:700;margin-bottom:8px;">Users</div>
              <div style="color:#94a3b8;font-size:12px;">User summaries and profile controls.</div>
              ${renderList((window.UserCoreSystem?.listUsers?.() || []).slice(0,20).map(u => u.id || u.username || JSON.stringify(u)), 'No users')}
            </div>
            ${renderPermissionsTab()}
          </div>
        `;
      case "permissions":
        return renderPermissionsTab();
      case "appearance":
        return `
          <div style="display:grid;gap:12px;">
            ${renderThemeTab({ config: shared.config || {} })}
          </div>
        `;
      case "builders":
        return `
          <div style="display:grid;gap:12px;">
            ${renderHomepageTab()}
            ${renderNavigationTab()}
            ${renderWidgetsTab()}
            ${renderModuleVisibilityTab()}
          </div>
        `;
      case "extensions":
        return `
          <div style="display:grid;gap:12px;">
            ${renderModulesTab({ modules: shared.moduleHealth || [] })}
            ${renderPluginsTab({ plugins: shared.pluginHealth || [] })}
            <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
              <div style="font-weight:700;margin-bottom:8px;">Registered modules & routes</div>
              <div style="font-size:12px;color:#94a3b8;">A combined view of modules and registered routes.</div>
            </div>
          </div>
        `;
      case "maintenance":
        return `
          <div style="display:grid;gap:12px;">
            <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
              <div style="font-weight:700;margin-bottom:8px;">Maintenance</div>
              <div style="color:#94a3b8;font-size:12px;">Cache, search rebuild, diagnostics export and cleanup tools.</div>
            </div>
            ${renderRegistryTab({ registryRoutes, canEditRoutes, safeModeActive })}
          </div>
        `;
      case "system":
        return `
          <div style="display:grid;gap:12px;">
            ${renderRuntimeTab({ runtime: { route: shared.activeRoute, booted: shared.booted, safeMode: shared.safeMode, recovery: Runtime?.getState?.()?.recovery || {} }, config: shared.config, warnings: Diagnostics.getWarnings().slice(-8), errors: Diagnostics.getErrors().slice(-8), logs: Diagnostics.getLogs().slice(-8) })}
            ${renderRegistryTab({ registryRoutes, canEditRoutes, safeModeActive })}
            ${renderModulesTab({ modules: shared.moduleHealth || [] })}
          </div>
        `;
      default:
        return `<div>Unknown section</div>`;
    }
  }

  function renderTabButton(tab, label) {
    return `<button class="admin-tab ${state.activeTab === tab ? "active" : ""}" onclick="window.AdminSystemCore.switchTab('${tab}')">${Diagnostics.escapeText(label)}</button>`;
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
      case "media":
        return renderMediaTab();
      case "cms":
        return renderCmsTab();
      case "theme":
        return renderThemeTab(context);
      case "navigation":
        return renderNavigationTab();
      case "homepage":
        return renderHomepageTab();
      case "widgets":
        return renderWidgetsTab();
      case "visibility":
        return renderModuleVisibilityTab();
      case "permissions":
        return renderPermissionsTab();
      case "config":
        return renderConfigTab(context);
      default:
        return "";
    }
  }

  function renderRuntimeTab({ runtime, config, warnings, errors, logs }) {
    return `
      <div class="admin-row-list">
        ${window.RuntimeInspector?.renderCard ? window.RuntimeInspector.renderCard() : ""}
        <div class="admin-panel">
          <div class="admin-panel-title">Runtime Dashboard</div>
          <div class="admin-status-strip">
            <div class="admin-status-item">Booted<br><span class="admin-badge">${runtime.booted ? "complete" : "pending"}</span></div>
            <div class="admin-status-item">Current route<br><span class="admin-badge">${Diagnostics.escapeText(runtime.route || "none")}</span></div>
            <div class="admin-status-item">Crashes<br><span class="admin-badge">${runtime.recovery?.crashCount || 0}</span></div>
            <div class="admin-status-item">Recovery<br><span class="admin-badge">${runtime.recovery?.recoveryMode ? "active" : "inactive"}</span></div>
            <div class="admin-status-item">Safe boot<br><span class="admin-badge">${runtime.safeMode?.safeBoot ? "yes" : "no"}</span></div>
            <div class="admin-status-item">Diagnostics boot<br><span class="admin-badge">${runtime.safeMode?.diagnosticsOnlyBoot ? "yes" : "no"}</span></div>
          </div>
        </div>
        <div class="admin-panel">
          <div class="admin-panel-title">Recent diagnostics</div>
          <div class="admin-actions">
            <span class="admin-badge admin-badge-warning">Warnings: ${warnings.length}</span>
            <span class="admin-badge admin-badge-danger">Errors: ${errors.length}</span>
            <span class="admin-badge">Logs: ${logs.length}</span>
          </div>
        </div>
        <div class="admin-panel-grid">
          <div class="admin-panel">
            <div class="admin-panel-title">Runtime errors</div>
            ${renderList(errors.map(item => `${item.timestamp} - ${item.message}`), "No recent errors")}
          </div>
          <div class="admin-panel">
            <div class="admin-panel-title">Runtime warnings</div>
            ${renderList(warnings.map(item => `${item.timestamp} - ${item.message}`), "No recent warnings")}
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
      const moduleId = record.moduleId || record.id;
      const status = record.quarantined ? "quarantined" : record.adminDisabled ? "disabled" : "healthy";
      const label = status === "disabled" ? "Enable" : "Disable";
      return `
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;margin-bottom:10px;">
          <div style="font-weight:700;">${Diagnostics.escapeText(moduleId)}</div>
          <div style="font-size:12px;color:#cbd5e1;">Status: ${Diagnostics.escapeText(status)}</div>
          <div style="font-size:12px;color:#94a3b8;">Failures: ${record.failureCount || 0}</div>
          <div style="font-size:12px;color:#94a3b8;">Last error: ${Diagnostics.escapeText(record.lastError?.message || record.lastError || "none")}</div>
          <div style="font-size:12px;color:#94a3b8;">Last loaded: ${record.lastLoaded ? new Date(record.lastLoaded).toLocaleString() : "never"}</div>
          <button onclick="window.AdminSystemCore.toggleModuleEnabled('${Diagnostics.escapeText(moduleId)}')" style="margin-top:10px;padding:8px 12px;border:none;border-radius:8px;background:${status === "disabled" ? `#16a34a` : `#dc2626`};color:#f8fafc;cursor:pointer;">${label}</button>
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

  function renderNavigationTab() {
    const items = window.NavigationBuilderSystem?.getItems?.() || [];
    const visibilityOptions = window.NavigationBuilderSystem?.getVisibilityOptions?.() || ["public", "authenticated", "admin", "capability"];
    return `
      <div class="admin-builder-stack">
        <div class="admin-builder-card">
          <div class="admin-builder-title">Navigation Builder</div>
          <div class="admin-builder-note">Order, labels, public visibility, and capability rules are stored through DataCoreSystem.</div>
        </div>
        ${items.map((item) => `
          <div class="admin-builder-row">
            <div class="admin-builder-fields">
              <label>Label<input id="navLabel_${item.route}" value="${Diagnostics.escapeText(item.label)}" /></label>
              <label>Order<input id="navOrder_${item.route}" type="number" value="${Diagnostics.escapeText(String(item.order))}" /></label>
              <label>Visibility
                <select id="navVisibility_${item.route}">
                  ${visibilityOptions.map((option) => `<option value="${Diagnostics.escapeText(option)}" ${item.visibility === option ? "selected" : ""}>${Diagnostics.escapeText(option)}</option>`).join("")}
                </select>
              </label>
              <label>Capability<input id="navCapability_${item.route}" value="${Diagnostics.escapeText(item.capability || "")}" placeholder="required when visibility=capability" /></label>
            </div>
            <div class="admin-builder-actions">
              <label class="admin-builder-check"><input id="navShown_${item.route}" type="checkbox" ${item.nav ? "checked" : ""} /> In nav</label>
              <label class="admin-builder-check"><input id="navEnabled_${item.route}" type="checkbox" ${item.enabled ? "checked" : ""} /> Route enabled</label>
              <button onclick="window.AdminSystemCore.saveNavigationItem('${Diagnostics.escapeText(item.route)}')">Save</button>
            </div>
          </div>
        `).join("") || `<div class="admin-builder-empty">No routes are available.</div>`}
      </div>
    `;
  }

  function renderHomepageTab() {
    const config = window.HomepageBuilderSystem?.getConfig?.() || {};
    const hero = config.hero || {};
    const sections = config.sections || [];
    const sectionTypes = window.HomepageBuilderSystem?.getSectionTypes?.() || [];
    const widgets = window.WidgetCoreSystem?.getWidgets?.() || [];
    return `
      <div class="admin-builder-stack">
        <div class="admin-builder-card">
          <div class="admin-builder-title">Homepage Builder</div>
          <div class="admin-builder-note">Configure the public homepage without editing the home module.</div>
        </div>
        <div class="admin-builder-card">
          <div class="admin-builder-title">Hero</div>
          <label>Kicker<input id="homeHeroKicker" value="${Diagnostics.escapeText(hero.kicker || "")}" /></label>
          <label>Title<input id="homeHeroTitle" value="${Diagnostics.escapeText(hero.title || "")}" /></label>
          <label>Body<textarea id="homeHeroBody" rows="3">${Diagnostics.escapeText(hero.body || "")}</textarea></label>
          <button onclick="window.AdminSystemCore.saveHomepageHero()">Save Hero</button>
        </div>
        <div class="admin-builder-card">
          <div class="admin-builder-title">Sections</div>
          ${sections.map((section) => `
            <div class="admin-builder-row">
              <div class="admin-builder-fields">
                <label>Title<input id="homeSectionTitle_${section.id}" value="${Diagnostics.escapeText(section.title)}" /></label>
                <label>Order<input id="homeSectionOrder_${section.id}" type="number" value="${Diagnostics.escapeText(String(section.order))}" /></label>
                <label>Type
                  <select id="homeSectionType_${section.id}">
                    ${sectionTypes.map((type) => `<option value="${Diagnostics.escapeText(type)}" ${section.type === type ? "selected" : ""}>${Diagnostics.escapeText(type)}</option>`).join("")}
                  </select>
                </label>
                <label>Widget
                  <select id="homeSectionWidget_${section.id}">
                    <option value="">None</option>
                    ${widgets.map((widget) => `<option value="${Diagnostics.escapeText(widget.id)}" ${section.widgetId === widget.id ? "selected" : ""}>${Diagnostics.escapeText(widget.title)}</option>`).join("")}
                  </select>
                </label>
              </div>
              <div class="admin-builder-actions">
                <label class="admin-builder-check"><input id="homeSectionEnabled_${section.id}" type="checkbox" ${section.enabled ? "checked" : ""} /> Enabled</label>
                <button onclick="window.AdminSystemCore.saveHomepageSection('${Diagnostics.escapeText(section.id)}')">Save</button>
                <button onclick="window.AdminSystemCore.removeHomepageSection('${Diagnostics.escapeText(section.id)}')">Remove</button>
              </div>
            </div>
          `).join("")}
          <div class="admin-builder-row">
            <div class="admin-builder-fields">
              <label>New title<input id="homeNewSectionTitle" placeholder="Custom widget block" /></label>
              <label>Type
                <select id="homeNewSectionType">
                  ${sectionTypes.map((type) => `<option value="${Diagnostics.escapeText(type)}">${Diagnostics.escapeText(type)}</option>`).join("")}
                </select>
              </label>
              <label>Widget
                <select id="homeNewSectionWidget">
                  <option value="">None</option>
                  ${widgets.map((widget) => `<option value="${Diagnostics.escapeText(widget.id)}">${Diagnostics.escapeText(widget.title)}</option>`).join("")}
                </select>
              </label>
            </div>
            <div class="admin-builder-actions">
              <button onclick="window.AdminSystemCore.addHomepageSection()">Add Section</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderWidgetsTab() {
    const widgets = window.WidgetCoreSystem?.getWidgets?.() || [];
    const types = window.WidgetCoreSystem?.getTypes?.() || [];
    return `
      <div class="admin-builder-stack">
        <div class="admin-builder-card">
          <div class="admin-builder-title">Widget Library</div>
          <div class="admin-builder-note">Reusable blocks can be added to the homepage builder.</div>
        </div>
        ${widgets.map((widget) => `
          <div class="admin-builder-row">
            <div class="admin-builder-fields">
              <label>Title<input id="widgetTitle_${widget.id}" value="${Diagnostics.escapeText(widget.title)}" /></label>
              <label>Type
                <select id="widgetType_${widget.id}">
                  ${types.map((type) => `<option value="${Diagnostics.escapeText(type)}" ${widget.type === type ? "selected" : ""}>${Diagnostics.escapeText(window.WidgetCoreSystem?.labelForType?.(type) || type)}</option>`).join("")}
                </select>
              </label>
              <label>Limit<input id="widgetLimit_${widget.id}" type="number" value="${Diagnostics.escapeText(String(widget.limit || 4))}" /></label>
              <label>Safe HTML<textarea id="widgetContent_${widget.id}" rows="3">${Diagnostics.escapeText(widget.content || "")}</textarea></label>
            </div>
            <div class="admin-builder-actions">
              <label class="admin-builder-check"><input id="widgetEnabled_${widget.id}" type="checkbox" ${widget.enabled ? "checked" : ""} /> Enabled</label>
              <button onclick="window.AdminSystemCore.saveWidgetFromPanel('${Diagnostics.escapeText(widget.id)}')">Save</button>
              <button onclick="window.AdminSystemCore.removeWidgetFromPanel('${Diagnostics.escapeText(widget.id)}')">Remove</button>
            </div>
          </div>
        `).join("") || `<div class="admin-builder-empty">No widgets yet.</div>`}
        <div class="admin-builder-card">
          <div class="admin-builder-title">Add Widget</div>
          <label>Title<input id="widgetNewTitle" placeholder="Homepage note" /></label>
          <label>Type
            <select id="widgetNewType">
              ${types.map((type) => `<option value="${Diagnostics.escapeText(type)}">${Diagnostics.escapeText(window.WidgetCoreSystem?.labelForType?.(type) || type)}</option>`).join("")}
            </select>
          </label>
          <label>Limit<input id="widgetNewLimit" type="number" value="4" /></label>
          <label>Safe HTML<textarea id="widgetNewContent" rows="4" placeholder="<p>Welcome message</p>"></textarea></label>
          <button onclick="window.AdminSystemCore.addWidgetFromPanel()">Add Widget</button>
        </div>
      </div>
    `;
  }

  function renderModuleVisibilityTab() {
    const routes = Object.values(getSharedState().registry || {});
    return `
      <div class="admin-builder-stack">
        <div class="admin-builder-card">
          <div class="admin-builder-title">Module Visibility</div>
          <div class="admin-builder-note">Hide routes from navigation or disable route access without touching module files.</div>
        </div>
        ${routes.map((route) => `
          <div class="admin-builder-row">
            <div>
              <div class="admin-builder-title">${Diagnostics.escapeText(route.label || route.id)}</div>
              <div class="admin-builder-note">${Diagnostics.escapeText(route.id)} / ${Diagnostics.escapeText(route.layout || "default")}</div>
            </div>
            <div class="admin-builder-actions">
              <button onclick="window.AdminSystemCore.toggleBuilderNav('${Diagnostics.escapeText(route.id)}', ${route.nav === false ? "true" : "false"})">${route.nav === false ? "Show in Nav" : "Hide from Nav"}</button>
              <button onclick="window.AdminSystemCore.toggleBuilderRoute('${Diagnostics.escapeText(route.id)}', ${route.enabled === false ? "true" : "false"})">${route.enabled === false ? "Enable Route" : "Disable Route"}</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderPermissionsTab() {
    const roles = ["guest", "user", "moderator", "admin"];
    return `
      <div class="admin-builder-stack">
        <div class="admin-builder-card">
          <div class="admin-builder-title">Roles & Permissions</div>
          <div class="admin-builder-note">Safe reference view for v0.44. Route and builder controls should use capabilities instead of hard-coded role checks.</div>
        </div>
        ${roles.map((role) => {
          const capabilities = window.UserCoreSystem?.getRoleCapabilities?.(role) || [];
          return `
            <div class="admin-builder-card">
              <div class="admin-builder-title">${Diagnostics.escapeText(role)}</div>
              <div class="capability-grid">
                ${capabilities.map((capability) => `<span class="capability-chip">${Diagnostics.escapeText(capability)}</span>`).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderMediaTab() {
    setTimeout(() => loadMediaPanel(), 0);
    return `
      <div style="display:grid;gap:10px;">
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Media Library</div>
          <div style="font-size:12px;color:#94a3b8;">Uploaded images stored through MediaCoreSystem and DataCoreSystem.</div>
        </div>
        <div id="adminMediaLibrary" style="display:grid;gap:10px;">
          <div style="opacity:.7">Loading media...</div>
        </div>
      </div>
    `;
  }

  function renderCmsTab() {
    setTimeout(() => loadCmsPanel(), 0);
    return `
      <div style="display:grid;gap:10px;">
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">CMS Organization</div>
          <div style="font-size:12px;color:#94a3b8;">Manage categories and tags used by content modules.</div>
        </div>
        <div style="display:grid;gap:8px;padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <input id="adminCategoryName" placeholder="Category name" style="padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#0f172a;color:#f8fafc;" />
          <button onclick="window.AdminSystemCore.saveCategoryFromPanel()" style="padding:8px 12px;border:none;border-radius:8px;background:#16a34a;color:#fff;cursor:pointer;">Save Category</button>
          <input id="adminTagName" placeholder="Tag name" style="padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#0f172a;color:#f8fafc;" />
          <button onclick="window.AdminSystemCore.saveTagFromPanel()" style="padding:8px 12px;border:none;border-radius:8px;background:#16a34a;color:#fff;cursor:pointer;">Save Tag</button>
        </div>
        <div id="adminCmsTaxonomy" style="display:grid;gap:10px;">
          <div style="opacity:.7">Loading taxonomy...</div>
        </div>
      </div>
    `;
  }

  async function loadCmsPanel() {
    const container = document.getElementById("adminCmsTaxonomy");
    if (!container) return;
    try {
      const [categories, tags] = await Promise.all([
        window.CategoryCoreSystem?.listCategories?.() || [],
        window.TagCoreSystem?.listTags?.() || []
      ]);
      container.innerHTML = `
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Categories</div>
          ${window.CategoryCoreSystem?.renderCategoryChips?.(categories) || ""}
        </div>
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Tags</div>
          ${window.TagCoreSystem?.renderTagChips?.(tags) || ""}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:#fecaca;">Unable to load CMS taxonomy.</div>`;
    }
  }

  async function saveCategoryFromPanel() {
    try {
      const name = document.getElementById("adminCategoryName")?.value || "";
      await window.CategoryCoreSystem?.saveCategory?.({ name });
      state.statusMessage = "Category saved.";
      await loadCmsPanel();
    } catch (err) {
      state.statusMessage = `Category save failed: ${err.message || err}`;
      renderPanel();
    }
  }

  async function saveTagFromPanel() {
    try {
      const name = document.getElementById("adminTagName")?.value || "";
      await window.TagCoreSystem?.saveTag?.({ name });
      state.statusMessage = "Tag saved.";
      await loadCmsPanel();
    } catch (err) {
      state.statusMessage = `Tag save failed: ${err.message || err}`;
      renderPanel();
    }
  }

  async function loadMediaPanel() {
    const container = document.getElementById("adminMediaLibrary");
    if (!container || !window.MediaCoreSystem?.listMedia) return;
    try {
      const media = await window.MediaCoreSystem.listMedia();
      const canDelete = window.UserCoreSystem?.can?.("media.manage") === true;
      if (!media.length) {
        container.innerHTML = `<div style="opacity:.7">No uploaded media.</div>`;
        return;
      }
      container.innerHTML = media.map((item) => `
        <div style="display:grid;grid-template-columns:72px 1fr auto;gap:10px;align-items:center;padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <img src="${Diagnostics.escapeText(item.url)}" alt="${Diagnostics.escapeText(item.originalName)}" style="width:72px;height:54px;object-fit:cover;border-radius:8px;border:1px solid rgba(148,163,184,.25);" />
          <div>
            <div style="font-weight:700;">${Diagnostics.escapeText(item.originalName || item.filename)}</div>
            <div style="font-size:12px;color:#94a3b8;">${Diagnostics.escapeText(item.mimeType)} · ${Diagnostics.escapeText(String(item.size || 0))} bytes</div>
            <div style="font-size:12px;color:#94a3b8;">Uploader: ${Diagnostics.escapeText(item.uploaderId || "unknown")} · ${Diagnostics.escapeText(item.createdAt || "")}</div>
          </div>
          ${canDelete ? `<button onclick="window.AdminSystemCore.deleteMediaItem('${Diagnostics.escapeText(item.id)}')" style="padding:7px 10px;border:none;border-radius:8px;background:#dc2626;color:#fff;cursor:pointer;">Delete</button>` : ""}
        </div>
      `).join("");
    } catch (err) {
      container.innerHTML = `<div style="color:#fecaca;">Unable to load media library.</div>`;
    }
  }

  async function deleteMediaItem(id) {
    if (!window.confirm("Delete this media item? This cannot be undone.")) {
      return;
    }

    try {
      await window.MediaCoreSystem?.deleteMedia?.(id);
      state.statusMessage = "Media deleted.";
      await loadMediaPanel();
    } catch (err) {
      state.statusMessage = `Media delete failed: ${err.message || err}`;
      renderPanel();
    }
  }

  function renderThemeTab({ config }) {
    const theme = config.themeSettings || {};
    return `
      <div style="display:grid;gap:10px;">
        <div style="padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          <div style="font-weight:700;margin-bottom:8px;">Site Design</div>
          <div style="font-size:12px;color:#94a3b8;">Customize public identity, color variables, navigation style, and layout density.</div>
        </div>
        <div style="display:grid;gap:10px;padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:#020617;">
          ${renderThemeField("Site name", "adminThemeSiteName", config.siteName || "")}
          ${renderThemeField("Tagline", "adminThemeTagline", config.tagline || "")}
          ${renderThemeField("Logo text", "adminThemeLogoText", theme.logoText || config.siteName || "")}
          ${renderThemeField("Primary color", "adminThemePrimaryColor", theme.primaryColor || "#3b82f6", "color")}
          ${renderThemeField("Accent color", "adminThemeAccentColor", theme.accentColor || "#16a34a", "color")}
          ${renderThemeSelect("Background", "adminThemeBackgroundMode", theme.backgroundMode || "soft", [["soft", "Soft"], ["plain", "Plain"], ["contrast", "Contrast"]])}
          ${renderThemeSelect("Navigation", "adminThemeNavStyle", theme.navStyle || "pills", [["pills", "Pills"], ["underline", "Underline"], ["compact", "Compact"]])}
          ${renderThemeSelect("Density", "adminThemeLayoutDensity", theme.layoutDensity || "comfortable", [["comfortable", "Comfortable"], ["compact", "Compact"], ["spacious", "Spacious"]])}
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button onclick="window.AdminSystemCore.applyThemeEditor()" style="padding:10px 14px;border:none;border-radius:10px;background:#16a34a;color:#f8fafc;cursor:pointer;">Save Theme</button>
            <button onclick="window.AdminSystemCore.resetThemeEditor()" style="padding:10px 14px;border:none;border-radius:10px;background:#334155;color:#f8fafc;cursor:pointer;">Reset Defaults</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderThemeField(label, id, value, type = "text") {
    return `
      <label style="display:grid;gap:6px;font-size:12px;color:#cbd5e1;">
        ${Diagnostics.escapeText(label)}
        <input id="${id}" type="${type}" value="${Diagnostics.escapeText(value)}" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#0f172a;color:#f8fafc;" />
      </label>
    `;
  }

  function renderThemeSelect(label, id, value, options) {
    return `
      <label style="display:grid;gap:6px;font-size:12px;color:#cbd5e1;">
        ${Diagnostics.escapeText(label)}
        <select id="${id}" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid rgba(148,163,184,.3);background:#0f172a;color:#f8fafc;">
          ${options.map(([optionValue, optionLabel]) => `<option value="${Diagnostics.escapeText(optionValue)}" ${optionValue === value ? "selected" : ""}>${Diagnostics.escapeText(optionLabel)}</option>`).join("")}
        </select>
      </label>
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
    const record = Object.values(ModuleLoader.getHealth()).find((item) => (item.moduleId || item.id) === moduleId);
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

  function applyThemeEditor() {
    const current = ConfigLoader.get() || {};
    const next = ConfigLoader.mergeConfig?.(current, {
      siteName: document.getElementById("adminThemeSiteName")?.value || current.siteName,
      tagline: document.getElementById("adminThemeTagline")?.value || "",
      themeSettings: {
        primaryColor: document.getElementById("adminThemePrimaryColor")?.value,
        accentColor: document.getElementById("adminThemeAccentColor")?.value,
        backgroundMode: document.getElementById("adminThemeBackgroundMode")?.value,
        logoText: document.getElementById("adminThemeLogoText")?.value,
        navStyle: document.getElementById("adminThemeNavStyle")?.value,
        layoutDensity: document.getElementById("adminThemeLayoutDensity")?.value
      }
    }) || current;

    const result = ConfigLoader.apply(next);
    state.statusMessage = result.success ? "Theme saved successfully." : `Theme save failed: ${result.error}`;
    renderPanel();
    Runtime?.navigate?.(Runtime.getState?.().route || "home", { updateHash: false });
  }

  function resetThemeEditor() {
    const current = ConfigLoader.get() || {};
    const next = ConfigLoader.mergeConfig?.(current, {
      siteName: "WebbyOS",
      tagline: "Modular publishing for community sites.",
      themeSettings: {
        primaryColor: "#3b82f6",
        accentColor: "#16a34a",
        backgroundMode: "soft",
        logoText: "WebbyOS",
        navStyle: "pills",
        layoutDensity: "comfortable"
      }
    }) || current;

    const result = ConfigLoader.apply(next);
    state.statusMessage = result.success ? "Theme reset to defaults." : `Theme reset failed: ${result.error}`;
    renderPanel();
    Runtime?.navigate?.(Runtime.getState?.().route || "home", { updateHash: false });
  }

  function fieldValue(id) {
    return document.getElementById(id)?.value || "";
  }

  function fieldChecked(id) {
    return document.getElementById(id)?.checked === true;
  }

  async function saveNavigationItem(route) {
    try {
      await window.NavigationBuilderSystem?.saveItem?.({
        route,
        label: fieldValue(`navLabel_${route}`),
        order: Number(fieldValue(`navOrder_${route}`)),
        visibility: fieldValue(`navVisibility_${route}`),
        capability: fieldValue(`navCapability_${route}`),
        nav: fieldChecked(`navShown_${route}`),
        enabled: fieldChecked(`navEnabled_${route}`)
      });
      state.statusMessage = "Navigation item saved.";
      Runtime?.navigate?.(Runtime.getState?.().route || "home", { updateHash: false });
    } catch (err) {
      state.statusMessage = `Navigation save failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function toggleBuilderNav(route, visible) {
    try {
      const item = (window.NavigationBuilderSystem?.getItems?.() || []).find((entry) => entry.route === route) || { route };
      await window.NavigationBuilderSystem?.saveItem?.({ ...item, nav: visible === true });
      state.statusMessage = visible ? "Navigation item shown." : "Navigation item hidden.";
      Runtime?.navigate?.(Runtime.getState?.().route || "home", { updateHash: false });
    } catch (err) {
      state.statusMessage = `Navigation visibility failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function toggleBuilderRoute(route, enabled) {
    try {
      const item = (window.NavigationBuilderSystem?.getItems?.() || []).find((entry) => entry.route === route) || { route };
      await window.NavigationBuilderSystem?.saveItem?.({ ...item, enabled: enabled === true });
      state.statusMessage = enabled ? "Route enabled." : "Route disabled.";
      Runtime?.navigate?.(Runtime.getState?.().route || "home", { updateHash: false });
    } catch (err) {
      state.statusMessage = `Route visibility failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function saveHomepageHero() {
    try {
      await window.HomepageBuilderSystem?.saveHero?.({
        kicker: fieldValue("homeHeroKicker"),
        title: fieldValue("homeHeroTitle"),
        body: fieldValue("homeHeroBody")
      });
      state.statusMessage = "Homepage hero saved.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Homepage hero save failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function saveHomepageSection(id) {
    try {
      await window.HomepageBuilderSystem?.saveSection?.({
        id,
        title: fieldValue(`homeSectionTitle_${id}`),
        order: Number(fieldValue(`homeSectionOrder_${id}`)),
        type: fieldValue(`homeSectionType_${id}`),
        widgetId: fieldValue(`homeSectionWidget_${id}`),
        enabled: fieldChecked(`homeSectionEnabled_${id}`)
      });
      state.statusMessage = "Homepage section saved.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Homepage section save failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function addHomepageSection() {
    try {
      const config = window.HomepageBuilderSystem?.getConfig?.() || { sections: [] };
      const type = fieldValue("homeNewSectionType") || "widget";
      const id = `${type}-${Date.now()}`;
      await window.HomepageBuilderSystem?.saveSection?.({
        id,
        type,
        title: fieldValue("homeNewSectionTitle") || "New Section",
        widgetId: fieldValue("homeNewSectionWidget"),
        enabled: true,
        order: (config.sections || []).length + 1
      });
      state.statusMessage = "Homepage section added.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Homepage section add failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function removeHomepageSection(id) {
    if (!window.confirm("Remove this homepage section?")) {
      return;
    }

    try {
      await window.HomepageBuilderSystem?.removeSection?.(id);
      state.statusMessage = "Homepage section removed.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Homepage section remove failed: ${err.message || err}`;
    }
    renderPanel();
  }

  function readWidgetFields(id) {
    return {
      id,
      title: fieldValue(`widgetTitle_${id}`),
      type: fieldValue(`widgetType_${id}`),
      limit: Number(fieldValue(`widgetLimit_${id}`)),
      content: fieldValue(`widgetContent_${id}`),
      enabled: fieldChecked(`widgetEnabled_${id}`)
    };
  }

  async function saveWidgetFromPanel(id) {
    try {
      await window.WidgetCoreSystem?.saveWidget?.(readWidgetFields(id));
      state.statusMessage = "Widget saved.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Widget save failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function addWidgetFromPanel() {
    try {
      await window.WidgetCoreSystem?.saveWidget?.({
        id: `widget-${Date.now()}`,
        title: fieldValue("widgetNewTitle") || "New Widget",
        type: fieldValue("widgetNewType"),
        limit: Number(fieldValue("widgetNewLimit")),
        content: fieldValue("widgetNewContent"),
        enabled: true
      });
      state.statusMessage = "Widget added.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Widget add failed: ${err.message || err}`;
    }
    renderPanel();
  }

  async function removeWidgetFromPanel(id) {
    if (!window.confirm("Remove this widget?")) {
      return;
    }

    try {
      await window.WidgetCoreSystem?.removeWidget?.(id);
      state.statusMessage = "Widget removed.";
      await window.HomeModuleUI?.refresh?.();
    } catch (err) {
      state.statusMessage = `Widget remove failed: ${err.message || err}`;
    }
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
    logout,
    requireAuth,
    switchTab,
    switchCategory,
    switchSub,
    toggleModuleEnabled,
    togglePluginEnabled,
    toggleRouteEnabled,
    applyConfigEditor,
    resetConfigEditor,
    applyThemeEditor,
    resetThemeEditor,
    saveNavigationItem,
    toggleBuilderNav,
    toggleBuilderRoute,
    saveHomepageHero,
    saveHomepageSection,
    addHomepageSection,
    removeHomepageSection,
    saveWidgetFromPanel,
    addWidgetFromPanel,
    removeWidgetFromPanel,
    loadMediaPanel,
    deleteMediaItem,
    loadCmsPanel,
    saveCategoryFromPanel,
    saveTagFromPanel,
    refresh,
    updateButtonState,
    openPanel,
    hidePanel
  };

})();

window.AdminSystemCore = AdminSystemCore;
