const Runtime = (() => {

  const state = {
    route: null
  };

  let booted = false;

  const el = (id) => document.getElementById(id);

  function getHashRoute() {
    return window.location.hash?.replace(/^#/, "") || "home";
  }

  function getFallbackRouteName() {
    return Object.keys(RegistryEngine.getAll() || {})
      .find(name => RegistryEngine.resolveRoute(name)) || null;
  }

  async function init() {
    try {
      await ConfigLoader.load();
      await RegistryEngine.load();

      if (!RegistryEngine.validate()) {
        throw new Error("No valid registry routes loaded");
      }

      PluginEngine.mountAll({ state });
      AdminSystemCore.init();
      booted = true;

      const routeName = getHashRoute();
      await navigate(routeName, { updateHash: false });

      window.addEventListener("hashchange", () => {
        const nextRoute = getHashRoute();
        if (nextRoute !== state.route) {
          navigate(nextRoute, { updateHash: false });
        }
      });
    } catch (err) {
      Diagnostics.error("[Runtime] initialization failed", err);
      Diagnostics.renderError("PlatformCore failed to initialize. Check the console for errors.");
    }
  }

  async function navigate(name, options = {}) {

    if (!booted) return;

    const { updateHash = true } = options;
    let route = RegistryEngine.resolveRoute(name);

    if (!route) {
      const fallback = getFallbackRouteName();
      if (!fallback) {
        Diagnostics.error("[Runtime] no valid route available", name);
        Diagnostics.renderError("No valid route available.");
        return;
      }
      Diagnostics.warn("[Runtime] route not found, falling back", name);
      route = RegistryEngine.resolveRoute(fallback);
    }

    if (!route) {
      Diagnostics.renderError("Unable to resolve a route for rendering.");
      return;
    }

    if (!AdminSystemCore.requireAuth(route)) return;

    const layout = await LayoutEngine.load(route.layout || "default");
    const moduleHTML = ModuleLoader.load(route, { state });
    const finalHTML = LayoutEngine.inject(layout, moduleHTML);

    const app = el("app");
    if (app) app.innerHTML = finalHTML;

    state.route = route.id;
    if (updateHash && route.id) {
      const targetHash = `#${route.id}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }

    PluginEngine.trigger("route", route);
  }

  return {
    init,
    navigate
  };

})();

window.Runtime = Runtime;