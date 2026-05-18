const RegistryEngine = (() => {

  let registry = {};
  let validRoutes = {};

  function normalizeRoute(name, route) {
    return {
      id: typeof route.id === "string" && route.id.trim() ? route.id : name,
      type: route.type,
      layout: typeof route.layout === "string" && route.layout.trim() ? route.layout : "default",
      auth: typeof route.auth === "boolean" ? route.auth : false,
      enabled: typeof route.enabled === "boolean" ? route.enabled : true,
      features: Array.isArray(route.features) ? route.features : []
    };
  }

  function isValidRoute(name, route) {
    if (!route || typeof route !== "object") return false;
    if (typeof name !== "string" || !name.trim()) return false;
    if (route.type !== "page") return false;
    if (route.id !== undefined && typeof route.id !== "string") return false;
    if (route.auth !== undefined && typeof route.auth !== "boolean") return false;
    if (route.enabled !== undefined && typeof route.enabled !== "boolean") return false;
    if (route.features !== undefined && !Array.isArray(route.features)) return false;
    if (route.layout !== undefined && typeof route.layout !== "string") return false;
    return true;
  }

  function buildValidRoutes(source) {
    const result = {};
    for (const [name, route] of Object.entries(source || {})) {
      if (!isValidRoute(name, route)) {
        Diagnostics.warn("[RegistryEngine] invalid route entry", { name, route });
        continue;
      }
      result[name] = normalizeRoute(name, route);
    }
    return result;
  }

  async function load() {
    try {
      const res = await fetch("./registry.json");
      if (!res.ok) throw new Error(`[RegistryEngine] fetch failed: ${res.status}`);

      const data = await res.json();
      if (!data || typeof data !== "object") throw new Error("[RegistryEngine] invalid registry payload");

      registry = data;
      validRoutes = buildValidRoutes(registry);
      if (!validate()) {
        Diagnostics.warn("[RegistryEngine] no valid registry routes were loaded");
      }
    } catch (err) {
      Diagnostics.error("[RegistryEngine] load failed", err);
      registry = {};
      validRoutes = {};
    }

    return validRoutes;
  }

  function getAll() {
    return validRoutes;
  }

  function resolveRoute(name) {
    if (typeof name !== "string") return null;
    const route = validRoutes[name];
    if (!route || route.type !== "page") return null;
    if (route.enabled === false) return null;
    return normalizeRoute(name, route);
  }

  function validate() {
    return Object.keys(validRoutes).length > 0;
  }

  return {
    load,
    getAll,
    resolveRoute,
    validate
  };

})();

window.RegistryEngine = RegistryEngine;