const ModuleLoader = (() => {
  const moduleHealth = new Map();
  const MAX_MODULE_FAILURES = 3;
  const QUARANTINE_DURATION_MS = 5 * 60 * 1000;

  function getModuleRecord(moduleId) {
    if (!moduleHealth.has(moduleId)) {
      moduleHealth.set(moduleId, {
        moduleId,
        failureCount: 0,
        quarantined: false,
        quarantinedUntil: null,
        adminDisabled: false,
        initialized: false,
        lastError: null,
        lastLoaded: null
      });
    }
    const record = moduleHealth.get(moduleId);
    if (record.quarantined && record.quarantinedUntil && Date.now() > record.quarantinedUntil) {
      record.quarantined = false;
      record.failureCount = 0;
      record.quarantinedUntil = null;
      Diagnostics.info("[ModuleLoader] module quarantine expired", moduleId);
    }
    return record;
  }

  function quarantineModule(moduleId, err) {
    const record = getModuleRecord(moduleId);
    record.quarantined = true;
    record.quarantinedUntil = Date.now() + QUARANTINE_DURATION_MS;
    record.lastError = err;
    Diagnostics.warn("[ModuleLoader] module quarantined after repeated failures", { moduleId, failureCount: record.failureCount });
    Lifecycle.emit("module:load", { moduleId, status: "quarantined", error: err });
  }

  function recordModuleFailure(moduleId, err) {
    const record = getModuleRecord(moduleId);
    record.failureCount += 1;
    record.lastError = err;
    if (record.failureCount >= MAX_MODULE_FAILURES) {
      quarantineModule(moduleId, err);
    }
  }

  function recordModuleSuccess(moduleId) {
    const record = getModuleRecord(moduleId);
    record.failureCount = 0;
    record.lastLoaded = Date.now();
    record.lastError = null;
  }

  function isQuarantined(moduleId) {
    return getModuleRecord(moduleId).quarantined;
  }

  function setModuleEnabled(moduleId, enabled) {
    if (!moduleId || typeof enabled !== "boolean") return false;
    const record = getModuleRecord(moduleId);
    record.adminDisabled = enabled === false ? true : false;
    Diagnostics.info("[ModuleLoader] module admin disabled state updated", { moduleId, disabled: record.adminDisabled });
    Lifecycle.emit("module:load", { moduleId, status: record.adminDisabled ? "disabled" : "loaded" });
    if (window.Runtime?.updateRuntimeState) {
      window.Runtime.updateRuntimeState({ moduleHealth: getHealth() });
    }
    return true;
  }

  function getHealth() {
    return Array.from(moduleHealth.values()).map(record => ({ ...record }));
  }

  function load(route, ctx = {}) {
    if (!route || typeof route !== "object") {
      return `<div class="module-error">Invalid route configuration</div>`;
    }

    const moduleId = route.id || "unknown";
    const record = getModuleRecord(moduleId);

    if (record.adminDisabled) {
      Diagnostics.warn("[ModuleLoader] module disabled by admin", moduleId);
      Lifecycle.emit("module:load", { moduleId, status: "disabled" });
      return `<div class="module-error">Module disabled by admin: ${Diagnostics.escapeText(moduleId)}</div>`;
    }

    if (record.quarantined) {
      Diagnostics.warn("[ModuleLoader] quarantined module blocked", moduleId);
      return `<div class="module-error">Module quarantined: ${Diagnostics.escapeText(moduleId)}</div>`;
    }

    const mod = window.ModuleRegistry?.[moduleId];

    if (!mod || typeof mod.render !== "function") {
      Diagnostics.warn("[ModuleLoader] missing module", moduleId);
      Lifecycle.emit("module:load", { moduleId, status: "missing" });
      return `<div class="module-error">Missing module: ${Diagnostics.escapeText(moduleId)}</div>`;
    }

    if (typeof mod.init === "function" && !record.initialized) {
      try {
        mod.init(ctx);
        record.initialized = true;
        Diagnostics.info("[ModuleLoader] module initialized", moduleId);
      } catch (err) {
        Diagnostics.warn("[ModuleLoader] module init failed", { moduleId, error: err });
      }
    }

    const features = FeatureEngine.resolve(route.features, ctx);
    const loadedFeatureIds = Array.isArray(route.features) ? [...new Set(route.features)] : [];
    let body = "";

    try {
      body = mod.render(ctx);
      recordModuleSuccess(moduleId);
    } catch (err) {
      recordModuleFailure(moduleId, err);
      Diagnostics.error("[ModuleLoader] module render failed", { id: moduleId, error: err });
      body = `<div class="module-error">Module render failed: ${Diagnostics.escapeText(moduleId)}</div>`;
    }

    if (typeof body !== "string") {
      Diagnostics.warn("[ModuleLoader] module render returned non-string output", moduleId);
      body = String(body ?? "");
    }

    Lifecycle.emit("module:load", { moduleId, status: record.quarantined ? "quarantined" : "loaded" });
    if (window.Runtime?.updateRuntimeState) {
      window.Runtime.updateRuntimeState({ moduleHealth: getHealth(), loadedFeatures });
    }

    return `
      <div class="module" data-module="${Diagnostics.escapeText(moduleId)}">
        <div class="features">${features}</div>
        <div class="content">${body}</div>
      </div>
    `;
  }

  return {
    load,
    getHealth,
    setModuleEnabled
  };

})();

window.ModuleLoader = ModuleLoader;