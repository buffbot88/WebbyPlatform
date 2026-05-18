const Runtime = (() => {

  const state = {
    route: null
  };

  let booted = false;

  const el = (id) => document.getElementById(id);

  async function init() {

    await RegistryEngine.load();

    PluginEngine.mountAll({ state });

    AdminSystemCore.init();

    booted = true;

    navigate("home");
  }

  async function navigate(name) {

    if (!booted) return;

    const route = RegistryEngine.resolveRoute(name);
    if (!route) return;

    if (!AdminSystemCore.requireAuth(route)) return;

    const layout = await LayoutEngine.load(route.layout || "default");

    const moduleHTML = ModuleLoader.load(route, { state });

    const finalHTML = LayoutEngine.inject(layout, moduleHTML);

    const app = el("app");
    if (app) app.innerHTML = finalHTML;

    state.route = name;

    PluginEngine.trigger("route", route);
  }

  return {
    init,
    navigate
  };

})();

window.Runtime = Runtime;