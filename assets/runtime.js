const Runtime = (() => {

  const state = {
    route: null,
    recovery: {
      bootFallbackRoute: null,
      routeFailures: {},
      crashCount: 0,
      routeHistory: [],
      recoveryMode: false,
      diagnosticsOnly: false,
      pluginDisabled: false,
      moduleDisabled: false,
      layoutFallbackUsed: false
    }
  };

  const safeMode = {
    safeBoot: false,
    pluginDisableMode: false,
    diagnosticsOnlyBoot: false,
    moduleDisableMode: false,
    fallbackLayoutBootMode: false
  };

  const sharedState = {
    activeRoute: null,
    currentLayout: null,
    loadedModules: [],
    loadedPlugins: [],
    loadedFeatures: [],
    featureFlags: {},
    config: {},
    safeMode: { ...safeMode },
    diagnostics: { logs: 0, warnings: 0, errors: 0 },
    registry: {},
    moduleHealth: [],
    pluginHealth: [],
    booted: false
  };

  let booted = false;
  let lastRouteAttempt = null;

  const MAX_ROUTE_FAILURES = 3;
  const MAX_ROUTE_HISTORY = 10;
  const ROUTE_LOOP_WINDOW_MS = 30000;
  const MAX_RUNTIME_CRASHES = 5;

  const el = (id) => document.getElementById(id);

  function getHashRoute() {
    return window.location.hash?.replace(/^#/, "") || "home";
  }

  function getFallbackRouteName() {
    return Object.keys(RegistryEngine.getAll() || {})
      .find(name => RegistryEngine.resolveRoute(name)) || null;
  }

  function pruneRouteHistory() {
    const threshold = Date.now() - ROUTE_LOOP_WINDOW_MS;
    state.recovery.routeHistory = state.recovery.routeHistory.filter(entry => entry.timestamp >= threshold);
  }

  function detectRouteLoop(name) {
    pruneRouteHistory();
    const recent = state.recovery.routeHistory.filter(entry => entry.route === name);
    if (recent.length >= MAX_ROUTE_FAILURES) {
      state.recovery.diagnosticsOnly = true;
      safeMode.diagnosticsOnlyBoot = true;
      Diagnostics.warn("[Runtime] detected repeated route attempts, enabling diagnostics-only boot mode", { route: name, attempts: recent.length });
      return true;
    }
    return false;
  }

  function trackRouteAttempt(name, success = true) {
    const entry = { route: name, timestamp: Date.now(), success };
    state.recovery.routeHistory.push(entry);
    if (state.recovery.routeHistory.length > MAX_ROUTE_HISTORY) {
      state.recovery.routeHistory.shift();
    }
    pruneRouteHistory();

    if (!success) {
      state.recovery.routeFailures[name] = (state.recovery.routeFailures[name] || 0) + 1;
      if (state.recovery.routeFailures[name] >= MAX_ROUTE_FAILURES) {
        state.recovery.recoveryMode = true;
        Diagnostics.warn("[Runtime] route entering recovery after repeated failures", { route: name, count: state.recovery.routeFailures[name] });
      }
    }
  }

  function recordRuntimeCrash(err) {
    state.recovery.crashCount += 1;
    if (state.recovery.crashCount >= MAX_RUNTIME_CRASHES) {
      state.recovery.diagnosticsOnly = true;
      safeMode.diagnosticsOnlyBoot = true;
      Diagnostics.warn("[Runtime] entering diagnostics-only safe mode after repeated crashes", { count: state.recovery.crashCount });
    }
  }

  function cloneValue(item) {
    if (item === null || typeof item !== "object") return item;
    try {
      return JSON.parse(JSON.stringify(item));
    } catch (err) {
      return item;
    }
  }

  function buildSharedState(update = {}) {
    const config = update.config ?? ConfigLoader.get() ?? {};
    const registry = update.registry ?? RegistryEngine.getAll() ?? {};
    const moduleHealth = update.moduleHealth ?? ModuleLoader.getHealth();
    const pluginHealth = update.pluginHealth ?? PluginEngine.getHealth();
    const featureFlags = update.featureFlags ?? config.features ?? {};

    const loadedModules = Array.from(new Set(
      update.loadedModules ?? moduleHealth.map((entry) => entry.moduleId)
    ));
    const loadedPlugins = Array.from(new Set(
      update.loadedPlugins ?? pluginHealth.map((entry) => entry.pluginId)
    ));
    const loadedFeatures = Array.from(new Set(
      update.loadedFeatures ?? sharedState.loadedFeatures ?? []
    ));

    return {
      activeRoute: update.activeRoute ?? state.route ?? sharedState.activeRoute,
      currentLayout: update.currentLayout ?? sharedState.currentLayout,
      loadedModules,
      loadedPlugins,
      loadedFeatures,
      featureFlags: cloneValue(featureFlags),
      config: cloneValue(config),
      safeMode: { ...safeMode, ...sharedState.safeMode, ...(update.safeMode || {}) },
      diagnostics: {
        logs: Diagnostics.getLogs().length,
        warnings: Diagnostics.getWarnings().length,
        errors: Diagnostics.getErrors().length
      },
      registry: cloneValue(registry),
      moduleHealth: cloneValue(moduleHealth),
      pluginHealth: cloneValue(pluginHealth),
      booted
    };
  }

  function normalizeHealthRecords(records) {
    return (records || []).map((entry) => ({
      id: entry.moduleId || entry.pluginId || null,
      quarantined: !!entry.quarantined,
      disabled: !!entry.disabled,
      status: entry.status || null
    })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  function normalizeRegistry(routes) {
    return Object.entries(routes || {}).sort().map(([key, route]) => ({
      key,
      enabled: route.enabled !== false,
      layout: route.layout || null,
      auth: route.auth === true,
      id: route.id || key
    }));
  }

  function detectStateDrift() {
    const actual = {
      config: ConfigLoader.get(),
      registry: RegistryEngine.getAll(),
      moduleHealth: ModuleLoader.getHealth(),
      pluginHealth: PluginEngine.getHealth(),
      safeMode: { ...safeMode },
      activeRoute: state.route,
      booted,
      diagnostics: {
        logs: Diagnostics.getLogs().length,
        warnings: Diagnostics.getWarnings().length,
        errors: Diagnostics.getErrors().length
      }
    };

    const drift = [];
    if (JSON.stringify(actual.config) !== JSON.stringify(sharedState.config)) drift.push("config");
    if (JSON.stringify(normalizeRegistry(actual.registry)) !== JSON.stringify(normalizeRegistry(sharedState.registry))) drift.push("registry");
    if (JSON.stringify(normalizeHealthRecords(actual.moduleHealth)) !== JSON.stringify(normalizeHealthRecords(sharedState.moduleHealth))) drift.push("moduleHealth");
    if (JSON.stringify(normalizeHealthRecords(actual.pluginHealth)) !== JSON.stringify(normalizeHealthRecords(sharedState.pluginHealth))) drift.push("pluginHealth");
    if (JSON.stringify(actual.safeMode) !== JSON.stringify(sharedState.safeMode)) drift.push("safeMode");
    if (actual.activeRoute !== sharedState.activeRoute) drift.push("activeRoute");
    if (actual.booted !== sharedState.booted) drift.push("booted");
    if (actual.diagnostics.logs !== sharedState.diagnostics.logs) drift.push("diagnostics.logs");
    if (actual.diagnostics.warnings !== sharedState.diagnostics.warnings) drift.push("diagnostics.warnings");
    if (actual.diagnostics.errors !== sharedState.diagnostics.errors) drift.push("diagnostics.errors");

    if (drift.length) {
      Diagnostics.warn("[Runtime] shared state drift detected", { drift });
    }
    return drift;
  }

  function validateSharedState() {
    const drift = detectStateDrift();
    if (drift.length) {
      updateRuntimeState();
    }
    return { drift, shared: cloneValue(sharedState) };
  }

  function injectFailure(type) {
    switch (type) {
      case "missing-module": {
        ModuleLoader.load({ id: "__validation_missing_module__", layout: "default", features: [] }, { state });
        break;
      }
      case "invalid-route": {
        navigate("__validation_invalid_route__", { updateHash: false });
        break;
      }
      case "plugin-crash": {
        const crashPlugin = {
          init() {},
          mount() {
            throw new Error("Injected plugin crash");
          }
        };
        PluginEngine.register("__validation_plugin_crash__", crashPlugin);
        PluginEngine.mountAll({ state });
        break;
      }
      case "malformed-config": {
        ConfigLoader.apply({ bad: "payload" });
        break;
      }
      default: {
        Diagnostics.warn("[Runtime] unknown failure injection type", { type });
      }
    }
    updateRuntimeState();
  }

  async function runRecoveryValidation() {
    await navigate("__validation_invalid_route__", { updateHash: false });
    await navigate("__validation_invalid_route__", { updateHash: false });
    await navigate("__validation_invalid_route__", { updateHash: false });
    return validateSharedState();
  }

  function auditNavigationIntegrity() {
    const registry = RegistryEngine.getAll() || {};
    const issues = [];
    const ids = new Map();

    Object.entries(registry).forEach(([name, route]) => {
      const id = typeof route?.id === "string" && route.id.trim() ? route.id : name;
      if (ids.has(id)) {
        issues.push(`duplicate route id ${id} between ${ids.get(id)} and ${name}`);
      } else {
        ids.set(id, name);
      }
      if (route?.type !== "page") {
        issues.push(`route ${name} has invalid type ${route?.type}`);
      }
      if (typeof route?.layout !== "string" || !route.layout.trim()) {
        issues.push(`route ${name} missing or invalid layout`);
      }
      if (!window.ModuleRegistry?.[id]) {
        issues.push(`route ${name} points to missing module ${id}`);
      }
    });

    const fallback = getFallbackRouteName();
    if (!fallback) {
      issues.push("no fallback route available");
    }

    const currentHash = getHashRoute();
    if (currentHash && !RegistryEngine.resolveRoute(currentHash)) {
      issues.push(`hash route ${currentHash} is not resolvable`);
    }

    if (issues.length) {
      Diagnostics.warn("[Runtime] navigation integrity issues detected", { issues });
    }
    return { issues, fallback };
  }

  async function runStabilityCheck(iterations = 3) {
    const routeNames = Object.keys(RegistryEngine.getAll() || {});
    const pluginIds = PluginEngine.getHealth().map(entry => entry.pluginId);
    const moduleIds = ModuleLoader.getHealth().map(entry => entry.moduleId);
    const report = [];

    const togglePlugin = (id) => {
      const record = PluginEngine.getHealth().find(entry => entry.pluginId === id);
      if (!record) return false;
      return PluginEngine.setPluginEnabled(id, !record.disabled);
    };

    const toggleModule = (id) => {
      const record = ModuleLoader.getHealth().find(entry => entry.moduleId === id);
      if (!record) return false;
      return ModuleLoader.setModuleEnabled(id, !record.adminDisabled);
    };

    for (let idx = 0; idx < iterations; idx += 1) {
      const route = routeNames[idx % routeNames.length];
      if (route) {
        await navigate(route, { updateHash: false });
      }

      if (pluginIds.length) {
        const pluginId = pluginIds[idx % pluginIds.length];
        const before = PluginEngine.getHealth().find(entry => entry.pluginId === pluginId);
        const toggled = togglePlugin(pluginId);
        togglePlugin(pluginId);
        report.push({ type: "plugin-toggle", pluginId, toggled, beforeState: before });
      }

      if (moduleIds.length) {
        const moduleId = moduleIds[idx % moduleIds.length];
        const before = ModuleLoader.getHealth().find(entry => entry.moduleId === moduleId);
        const toggled = toggleModule(moduleId);
        toggleModule(moduleId);
        report.push({ type: "module-toggle", moduleId, toggled, beforeState: before });
      }

      const drift = validateSharedState().drift;
      report.push({ iteration: idx + 1, drift });
    }

    if (report.some(item => item.drift && item.drift.length)) {
      Diagnostics.warn("[Runtime] stability check detected drift during repeated operations", { report });
    }

    return report;
  }

  async function runSystemValidationSuite(options = {}) {
    const initial = validateSharedState();
    const navigation = auditNavigationIntegrity();
    const failures = [];
    for (const type of ["missing-module", "invalid-route", "plugin-crash", "malformed-config"]) {
      injectFailure(type);
      failures.push({ type, drift: validateSharedState().drift });
    }
    const recovery = await runRecoveryValidation();
    const stability = await runStabilityCheck(options.iterations || 3);

    const summary = { initial, navigation, failures, recovery, stability };
    Diagnostics.info("[Runtime] system validation suite completed", summary);
    return summary;
  }

  function updateRuntimeState(update = {}) {
    const nextState = buildSharedState(update);
    Object.assign(sharedState, nextState);
    detectStateDrift();
    if (window.RuntimeInspector?.refresh) {
      window.RuntimeInspector.refresh();
    }
    if (window.AdminSystemCore?.refresh) {
      window.AdminSystemCore.refresh();
    }
    if (window.AdminSystemCore?.updateButtonState) {
      window.AdminSystemCore.updateButtonState();
    }
    return cloneValue(sharedState);
  }

  async function init() {
    Lifecycle.emit("boot:start", { state: "starting" });
    try {
      await ConfigLoader.load();
      await RegistryEngine.load();

      if (!RegistryEngine.validate()) {
        throw new Error("No valid registry routes loaded");
      }

      state.recovery.bootFallbackRoute = getFallbackRouteName();
      if (!state.recovery.bootFallbackRoute) {
        Diagnostics.warn("[Runtime] no safe boot fallback route available");
      }

      PluginEngine.mountAll({ state });
      updateRuntimeState({
        config: ConfigLoader.get(),
        registry: RegistryEngine.getAll(),
        safeMode: { ...safeMode },
        loadedFeatures: [],
        activeRoute: state.route,
        currentLayout: null,
        moduleHealth: ModuleLoader.getHealth(),
        pluginHealth: PluginEngine.getHealth()
      });

      AdminSystemCore.init();
      booted = true;
      updateRuntimeState({ booted });

      const routeName = getHashRoute();
      await navigate(routeName, { updateHash: false, bootPhase: true });

      Lifecycle.emit("boot:complete", { state: "complete" });

      window.addEventListener("hashchange", () => {
        const nextRoute = getHashRoute();
        if (nextRoute !== state.route) {
          navigate(nextRoute, { updateHash: false });
        }
      });
    } catch (err) {
      recordRuntimeCrash(err);
      Diagnostics.error("[Runtime] initialization failed", err);
      Lifecycle.emit("runtime:error", { message: err.message || "Runtime initialization failed", error: err });
      Diagnostics.renderError("PlatformCore failed to initialize. Check the console for errors.");
    }
  }

  async function navigate(name, options = {}) {

    if (!booted) return;

    const { updateHash = true, bootPhase = false } = options;
    const targetName = typeof name === "string" ? name : state.recovery.bootFallbackRoute;
    if (!targetName) {
      Diagnostics.error("[Runtime] no target route provided to navigate");
      return;
    }

    if (detectRouteLoop(targetName)) {
      Diagnostics.warn("[Runtime] route loop detected, preserving current state", targetName);
      return;
    }

    let route = RegistryEngine.resolveRoute(targetName);

    if (!route) {
      const fallback = state.recovery.bootFallbackRoute || getFallbackRouteName();
      if (!fallback) {
        Diagnostics.error("[Runtime] no valid route available", targetName);
        trackRouteAttempt(targetName, false);
        Diagnostics.renderError("No valid route available.");
        return;
      }
      if (fallback === targetName) {
        Diagnostics.error("[Runtime] no route available after fallback", targetName);
        trackRouteAttempt(targetName, false);
        Diagnostics.renderError("No valid route available.");
        return;
      }
      Diagnostics.warn("[Runtime] route not found, falling back", targetName);
      trackRouteAttempt(targetName, false);
      route = RegistryEngine.resolveRoute(fallback);
    }

    if (!route) {
      Diagnostics.renderError("Unable to resolve a route for rendering.");
      return;
    }

    if (!AdminSystemCore.requireAuth(route)) return;

    try {
      const layout = await LayoutEngine.load(route.layout || "default");
      const moduleHTML = ModuleLoader.load(route, { state });
      const finalHTML = LayoutEngine.inject(layout, moduleHTML);

      const app = el("app");
      if (app) app.innerHTML = finalHTML;

      state.route = route.id;
      updateRuntimeState({ activeRoute: route.id, currentLayout: route.layout, loadedFeatures: route.features || [] });
      trackRouteAttempt(route.id, true);
      if (updateHash && route.id) {
        const targetHash = `#${route.id}`;
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }

      Lifecycle.emit("route:change", { route });
      PluginEngine.trigger("route", route);
    } catch (err) {
      state.recovery.routeFailures[targetName] = (state.recovery.routeFailures[targetName] || 0) + 1;
      recordRuntimeCrash(err);
      Diagnostics.error("[Runtime] navigation failed", { route: targetName, error: err });
      Lifecycle.emit("runtime:error", { message: err.message || "Navigation failed", error: err });
      if (!bootPhase && targetName !== state.recovery.bootFallbackRoute && state.recovery.bootFallbackRoute) {
        Diagnostics.warn("[Runtime] retrying with safe boot fallback route", state.recovery.bootFallbackRoute);
        await navigate(state.recovery.bootFallbackRoute, { updateHash, bootPhase: true });
      } else {
        Diagnostics.renderError("Route rendering failed. Check diagnostics for details.");
      }
    }
  }

  function getState() {
    return {
      route: state.route,
      booted,
      safeMode: { ...safeMode },
      recovery: { ...state.recovery }
    };
  }

  function getSharedState() {
    return cloneValue(sharedState);
  }

  return {
    init,
    navigate,
    getState,
    getSharedState,
    updateRuntimeState,
    validateSharedState,
    injectFailure,
    auditNavigationIntegrity,
    runRecoveryValidation,
    runStabilityCheck,
    runSystemValidationSuite,
    safeMode
  };

})();

window.Runtime = Runtime;