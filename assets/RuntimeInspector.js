const RuntimeInspector = (() => {
  const state = {
    bootStatus: "pending",
    activeRoute: null,
    currentLayout: null,
    loadedModules: [],
    loadedPlugins: [],
    loadedFeatures: [],
    runtimeLogs: [],
    runtimeWarnings: [],
    runtimeErrors: [],
    crashCount: 0,
    routeHealth: {
      total: 0,
      active: 0,
      disabled: 0,
      invalid: 0
    },
    moduleHealth: [],
    pluginHealth: [],
    quarantinedModules: [],
    quarantinedPlugins: [],
    safeMode: {
      safeBoot: false,
      pluginDisableMode: false,
      diagnosticsOnlyBoot: false
    },
    registryDiagnostics: {
      duplicateRoutes: [],
      invalidContracts: [],
      disabledRoutes: [],
      missingLayouts: [],
      missingModules: []
    },
    filterType: "all"
  };

  let panel = null;
  let button = null;
  let visible = false;

  function getOverlayRoot() {
    return document.getElementById("overlayLayer") || document.body;
  }

  function createPanel() {
    if (panel) return panel;

    const root = getOverlayRoot();
    panel = document.createElement("div");
    panel.id = "runtimeInspectorPanel";
    panel.style.position = "fixed";
    panel.style.bottom = "12px";
    panel.style.right = "12px";
    panel.style.width = "360px";
    panel.style.maxHeight = "70vh";
    panel.style.overflow = "auto";
    panel.style.background = "rgba(15, 23, 42, 0.95)";
    panel.style.color = "#f8fafc";
    panel.style.border = "1px solid rgba(148, 163, 184, 0.3)";
    panel.style.borderRadius = "12px";
    panel.style.boxShadow = "0 18px 40px rgba(15, 23, 42, 0.33)";
    panel.style.zIndex = "10000";
    panel.style.fontFamily = "system-ui, sans-serif";
    panel.style.fontSize = "13px";
    panel.style.lineHeight = "1.4";
    panel.style.padding = "12px";
    panel.style.display = "none";

    root.appendChild(panel);

    button = document.createElement("button");
    button.id = "runtimeInspectorToggle";
    button.textContent = "Inspector";
    button.style.position = "fixed";
    button.style.bottom = "12px";
    button.style.right = "392px";
    button.style.zIndex = "10001";
    button.style.padding = "8px 12px";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.background = "#334155";
    button.style.color = "#f8fafc";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 8px 18px rgba(15, 23, 42, 0.2)";

    button.addEventListener("click", toggle);
    root.appendChild(button);

    return panel;
  }

  function renderSection(title, content) {
    return `
      <div style="margin-bottom:12px;">
        <div style="font-weight:700; margin-bottom:4px;">${Diagnostics.escapeText(title)}</div>
        <div>${content}</div>
      </div>
    `;
  }

  function renderList(items, emptyLabel = "None") {
    if (!items || !items.length) return `<div style="opacity:.7">${Diagnostics.escapeText(emptyLabel)}</div>`;
    return `<ul style="padding-left:18px; margin:0;">${items.map(item => `<li>${Diagnostics.escapeText(item)}</li>`).join("")}</ul>`;
  }

  function renderRouteTable(routes) {
    if (!routes || !Object.keys(routes).length) {
      return `<div style="opacity:.7">No route registry available</div>`;
    }

    const rows = Object.entries(routes).map(([name, route]) => {
      const status = route.enabled === false ? "disabled" : "active";
      return `
        <tr>
          <td style="padding:4px 6px; border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(name)}</td>
          <td style="padding:4px 6px; border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(route.layout)}</td>
          <td style="padding:4px 6px; border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(String(route.auth))}</td>
          <td style="padding:4px 6px; border:1px solid rgba(148,163,184,.2);">${Diagnostics.escapeText(status)}</td>
        </tr>
      `;
    }).join("");

    return `
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="padding:6px 8px; text-align:left; border:1px solid rgba(148,163,184,.3);">Route</th>
            <th style="padding:6px 8px; text-align:left; border:1px solid rgba(148,163,184,.3);">Layout</th>
            <th style="padding:6px 8px; text-align:left; border:1px solid rgba(148,163,184,.3);">Auth</th>
            <th style="padding:6px 8px; text-align:left; border:1px solid rgba(148,163,184,.3);">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderLogToolbar() {
    const types = ["all", "info", "warn", "error"];
    return `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        ${types.map(type => `<button onclick="window.RuntimeInspector.toggleFilter('${type}')" style="padding:6px 10px;border:none;border-radius:8px;background:${state.filterType === type ? `#2563eb` : `#334155`};color:#f8fafc;cursor:pointer;">${Diagnostics.escapeText(type)}</button>`).join("")}
        <button onclick="window.AdminSystemCore.openPanel()" style="padding:6px 10px;border:none;border-radius:8px;background:#16a34a;color:#f8fafc;cursor:pointer;">Admin Panel</button>
      </div>
    `;
  }

  function filterLogs(items) {
    if (state.filterType === "all") return items;
    return items.filter(item => item.type === state.filterType);
  }

  function refreshDiagnostics() {
    state.runtimeWarnings = Diagnostics.getWarnings().slice(-20);
    state.runtimeErrors = Diagnostics.getErrors().slice(-20);
    state.runtimeLogs = Diagnostics.getLogs().slice(-20);
  }

  function refreshSafeMode() {
    if (window.Runtime?.safeMode) {
      state.safeMode = { ...window.Runtime.safeMode };
    }
    if (window.Runtime?.getState) {
      const runtimeState = window.Runtime.getState();
      state.crashCount = runtimeState?.recovery?.crashCount || 0;
    }
  }

  function refreshHealth() {
    if (typeof PluginEngine.getHealth === "function") {
      state.pluginHealth = PluginEngine.getHealth();
      state.quarantinedPlugins = state.pluginHealth.filter(entry => entry.quarantined).map(entry => entry.pluginId);
    }
    if (typeof ModuleLoader.getHealth === "function") {
      state.moduleHealth = ModuleLoader.getHealth();
      state.quarantinedModules = state.moduleHealth.filter(entry => entry.quarantined).map(entry => entry.moduleId);
    }
    const routes = RegistryEngine.getAll() || {};
    const total = Object.keys(routes).length;
    const disabled = Object.values(routes).filter(route => route.enabled === false).length;
    const invalid = state.registryDiagnostics.invalidContracts.length;
    state.routeHealth = {
      total,
      active: total - disabled - invalid,
      disabled,
      invalid
    };
  }

  function refreshRegistryDiagnostics() {
    if (typeof RegistryEngine.inspect !== "function") return;
    const report = RegistryEngine.inspect();
    state.registryDiagnostics = {
      duplicateRoutes: report.duplicateRoutes || [],
      invalidContracts: report.invalidContracts || [],
      disabledRoutes: report.disabledRoutes || [],
      missingLayouts: report.missingLayouts || [],
      missingModules: report.missingModules || []
    };
  }

  function render() {
    if (!panel) createPanel();
    refreshDiagnostics();
    refreshSafeMode();
    refreshRegistryDiagnostics();
    refreshHealth();

    const diagnosticsSummary = `
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Warnings: ${state.runtimeWarnings.length}</span>
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Errors: ${state.runtimeErrors.length}</span>
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Plugins: ${state.loadedPlugins.length}</span>
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Modules: ${state.loadedModules.length}</span>
      </div>
    `;

    panel.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <div style="font-size:15px; font-weight:800;">PlatformCore Inspector</div>
        <button style="border:none; background:#0f172a; color:#f8fafc; padding:4px 8px; border-radius:8px; cursor:pointer;" onclick="window.RuntimeInspector.toggle()">${visible ? "Hide" : "Show"}</button>
      </div>
      ${renderSection("Boot status", `<div>${Diagnostics.escapeText(state.bootStatus)}</div>`)}
      ${renderSection("Active route", `<div>${Diagnostics.escapeText(state.activeRoute || "None")}</div>`)}
      ${renderSection("Current layout", `<div>${Diagnostics.escapeText(state.currentLayout || "None")}</div>`)}
      ${renderSection("Runtime events", `${renderLogToolbar()}${renderList(logEntries.map(entry => `${entry.timestamp} - ${entry.type.toUpperCase()}: ${entry.message}`), "No events")}`)}
      ${renderSection("Registered routes", renderRouteTable(RegistryEngine.getAll()))}
      ${renderSection("Loaded plugins", renderList(state.loadedPlugins))}
      ${renderSection("Loaded modules", renderList(state.loadedModules))}
      ${renderSection("Loaded features", renderList(state.loadedFeatures))}
      ${renderSection("Route health", `<div>Total: ${state.routeHealth.total}<br>Active: ${state.routeHealth.active}<br>Disabled: ${state.routeHealth.disabled}<br>Invalid: ${state.routeHealth.invalid}</div>`)}
      ${renderSection("Module health", `<div>Quarantined modules: ${state.quarantinedModules.length}<br>${Diagnostics.escapeText(state.quarantinedModules.join(", ") || "None")}</div>`)}
      ${renderSection("Plugin health", `<div>Quarantined plugins: ${state.quarantinedPlugins.length}<br>${Diagnostics.escapeText(state.quarantinedPlugins.join(", ") || "None")}</div>`)}
      ${renderSection("Crash counters", `<div>Runtime crash count: ${state.crashCount}</div>`)}
      ${renderSection("Safe mode flags", `<div>${Object.entries(state.safeMode).map(([key, value]) => `${Diagnostics.escapeText(key)}: ${Diagnostics.escapeText(String(value))}`).join("<br>")}</div>`) }
      ${renderSection("Registry diagnostics", `
        <div style="font-size:12px; margin-bottom:6px;">Duplicate routes</div>
        ${renderList(state.registryDiagnostics.duplicateRoutes)}
        <div style="font-size:12px; margin:8px 0 6px 0;">Invalid contracts</div>
        ${renderList(state.registryDiagnostics.invalidContracts)}
        <div style="font-size:12px; margin:8px 0 6px 0;">Disabled routes</div>
        ${renderList(state.registryDiagnostics.disabledRoutes)}
        <div style="font-size:12px; margin:8px 0 6px 0;">Missing layouts</div>
        ${renderList(state.registryDiagnostics.missingLayouts)}
        <div style="font-size:12px; margin:8px 0 6px 0;">Missing modules</div>
        ${renderList(state.registryDiagnostics.missingModules)}
      `)}
      ${diagnosticsSummary}
    `;
  }

  function toggle() {
    visible = !visible;
    if (!panel) createPanel();
    panel.style.display = visible ? "block" : "none";
    button.textContent = visible ? "Hide Inspector" : "Show Inspector";
    if (visible) render();
  }

  function updateState(updates) {
    Object.assign(state, updates);
    if (visible) render();
  }

  function addModule(moduleId) {
    if (!state.loadedModules.includes(moduleId)) {
      state.loadedModules.push(moduleId);
    }
    if (visible) render();
  }

  function addPlugin(pluginId) {
    if (!state.loadedPlugins.includes(pluginId)) {
      state.loadedPlugins.push(pluginId);
    }
    if (visible) render();
  }

  function addFeature(featureId) {
    if (!state.loadedFeatures.includes(featureId)) {
      state.loadedFeatures.push(featureId);
    }
    if (visible) render();
  }

  function registerLifecycle() {
    Lifecycle.on("boot:start", () => updateState({ bootStatus: "starting" }));
    Lifecycle.on("boot:complete", () => updateState({ bootStatus: "complete" }));
    Lifecycle.on("route:change", (payload) => updateState({ activeRoute: payload.data?.route?.id || payload.data?.route || null }));
    Lifecycle.on("layout:mount", (payload) => {
      updateState({ currentLayout: payload.data?.layout || null });
      if (payload.data?.status === "missing") {
        if (!state.registryDiagnostics.missingLayouts.includes(payload.data?.layout)) {
          state.registryDiagnostics.missingLayouts.push(payload.data?.layout);
        }
      }
    });
    Lifecycle.on("module:load", (payload) => {
      const moduleId = payload.data?.moduleId;
      if (moduleId) {
        addModule(moduleId);
        if (payload.data?.status === "missing" && !state.registryDiagnostics.missingModules.includes(moduleId)) {
          state.registryDiagnostics.missingModules.push(moduleId);
        }
      }
    });
    Lifecycle.on("plugin:mount", (payload) => {
      const pluginId = payload.data?.pluginId;
      if (pluginId) addPlugin(pluginId);
    });
    Lifecycle.on("runtime:error", (payload) => {
      const errorEntry = { timestamp: payload.timestamp, message: payload.data?.message || "runtime error" };
      state.runtimeErrors.push(errorEntry);
      if (visible) render();
    });
  }

  function init() {
    registerLifecycle();
    createPanel();
    visible = false;
    refreshDiagnostics();
    render();
  }

  return {
    init,
    toggle,
    toggleFilter,
    getState: () => ({ ...state }),
    addFeature,
    addModule,
    addPlugin
  };
})();

window.RuntimeInspector = RuntimeInspector;
RuntimeInspector.init();
