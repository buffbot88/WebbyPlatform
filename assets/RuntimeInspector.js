const RuntimeInspector = (() => {
  const uiState = {
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
        ${types.map(type => `<button onclick="window.RuntimeInspector.toggleFilter('${type}')" style="padding:6px 10px;border:none;border-radius:8px;background:${uiState.filterType === type ? `#2563eb` : `#334155`};color:#f8fafc;cursor:pointer;">${Diagnostics.escapeText(type)}</button>`).join("")}
        <button onclick="window.AdminSystemCore.openPanel()" style="padding:6px 10px;border:none;border-radius:8px;background:#16a34a;color:#f8fafc;cursor:pointer;">Admin Panel</button>
      </div>
    `;
  }

  function filterLogs(items) {
    if (uiState.filterType === "all") return items;
    return items.filter(item => item.type === uiState.filterType);
  }

  function refresh() {
    if (visible) render();
  }

  function render() {
    if (!panel) createPanel();
    const shared = Runtime?.getSharedState?.() || {};
    const logEntries = filterLogs(
      (Diagnostics.getErrors().concat(Diagnostics.getWarnings(), Diagnostics.getLogs()) || [])
        .map((entry) => ({ ...entry, type: entry.type || "info" }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    );

    const diagnosticsSummary = `
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Warnings: ${shared.diagnostics?.warnings ?? 0}</span>
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Errors: ${shared.diagnostics?.errors ?? 0}</span>
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Plugins: ${shared.loadedPlugins?.length ?? 0}</span>
        <span style="background:#1e293b; padding:4px 8px; border-radius:999px;">Modules: ${shared.loadedModules?.length ?? 0}</span>
      </div>
    `;

    panel.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <div style="font-size:15px; font-weight:800;">PlatformCore Inspector</div>
        <button style="border:none; background:#0f172a; color:#f8fafc; padding:4px 8px; border-radius:8px; cursor:pointer;" onclick="window.RuntimeInspector.toggle()">${visible ? "Hide" : "Show"}</button>
      </div>
      ${renderSection("Boot status", `<div>${Diagnostics.escapeText(shared.booted ? "complete" : "pending")}</div>`)}
      ${renderSection("Active route", `<div>${Diagnostics.escapeText(shared.activeRoute || "None")}</div>`)}
      ${renderSection("Current layout", `<div>${Diagnostics.escapeText(shared.currentLayout || "None")}</div>`)}
      ${renderSection("Runtime events", `${renderLogToolbar()}${renderList(logEntries.map(entry => `${entry.timestamp} - ${entry.type.toUpperCase()}: ${entry.message}`), "No events")}`)}
      ${renderSection("Registered routes", renderRouteTable(shared.registry))}
      ${renderSection("Loaded plugins", renderList(shared.loadedPlugins))}
      ${renderSection("Loaded modules", renderList(shared.loadedModules))}
      ${renderSection("Loaded features", renderList(shared.loadedFeatures))}
      ${renderSection("Route health", `<div>Total: ${Object.keys(shared.registry || {}).length}<br>Active: ${Object.values(shared.registry || {}).filter(route => route.enabled !== false).length}<br>Disabled: ${Object.values(shared.registry || {}).filter(route => route.enabled === false).length}<br>Invalid: ${shared.registry ? Object.values(shared.registry).filter(route => !route || route.type !== "page").length : 0}</div>`)}
      ${renderSection("Module health", `<div>Quarantined modules: ${shared.moduleHealth?.filter(entry => entry.quarantined).length ?? 0}<br>${Diagnostics.escapeText((shared.moduleHealth?.filter(entry => entry.quarantined).map(entry => entry.moduleId) || []).join(", ") || "None")}</div>`)}
      ${renderSection("Plugin health", `<div>Quarantined plugins: ${shared.pluginHealth?.filter(entry => entry.quarantined).length ?? 0}<br>${Diagnostics.escapeText((shared.pluginHealth?.filter(entry => entry.quarantined).map(entry => entry.pluginId) || []).join(", ") || "None")}</div>`)}
      ${renderSection("Crash counters", `<div>Runtime crash count: ${Runtime.getState()?.recovery?.crashCount || 0}</div>`)}
      ${renderSection("Safe mode flags", `<div>${Object.entries(shared.safeMode || {}).map(([key, value]) => `${Diagnostics.escapeText(key)}: ${Diagnostics.escapeText(String(value))}`).join("<br>")}</div>`) }
      ${renderSection("Registry diagnostics", `
        <div style="font-size:12px; margin-bottom:6px;">Duplicate routes</div>
        ${renderList(RegistryEngine.inspect?.().duplicateRoutes || [])}
        <div style="font-size:12px; margin:8px 0 6px 0;">Invalid contracts</div>
        ${renderList(RegistryEngine.inspect?.().invalidContracts || [])}
        <div style="font-size:12px; margin:8px 0 6px 0;">Disabled routes</div>
        ${renderList(RegistryEngine.inspect?.().disabledRoutes || [])}
        <div style="font-size:12px; margin:8px 0 6px 0;">Missing layouts</div>
        ${renderList(RegistryEngine.inspect?.().missingLayouts || [])}
        <div style="font-size:12px; margin:8px 0 6px 0;">Missing modules</div>
        ${renderList(RegistryEngine.inspect?.().missingModules || [])}
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

  function toggleFilter(filterType) {
    uiState.filterType = filterType;
    if (visible) render();
  }

  function init() {
    createPanel();
    visible = false;
    render();
  }

  return {
    init,
    toggle,
    toggleFilter,
    refresh
  };
})();

window.RuntimeInspector = RuntimeInspector;
window.addEventListener("DOMContentLoaded", () => {
  if (window.Runtime) {
    RuntimeInspector.init();
  }
});
