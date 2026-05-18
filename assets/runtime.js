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
      AdminSystemCore.init();
      booted = true;

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

  return {
    init,
    navigate,
    getState,
    safeMode
  };

})();

window.Runtime = Runtime;