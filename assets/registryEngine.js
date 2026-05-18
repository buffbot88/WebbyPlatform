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

  function getRaw(name) {
    if (typeof name !== "string") return { ...registry };
    return registry[name] ? { ...registry[name] } : null;
  }

  function resolveRoute(name) {
    if (typeof name !== "string") return null;
    const route = validRoutes[name];
    if (!route || route.type !== "page") return null;
    if (route.enabled === false) return null;
    return normalizeRoute(name, route);
  }

  function setRouteEnabled(name, enabled) {
    if (!validRoutes[name]) return false;
    if (typeof enabled !== "boolean") return false;
    registry[name] = { ...registry[name], enabled };
    validRoutes[name] = normalizeRoute(name, { ...validRoutes[name], enabled });
    Diagnostics.info("[RegistryEngine] route enabled state updated", { route: name, enabled });
    return true;
  }

  function updateRoute(name, updates) {
    if (!validRoutes[name] || !updates || typeof updates !== "object") return false;
    const merged = { ...registry[name], ...updates };
    if (!isValidRoute(name, merged)) return false;
    registry[name] = merged;
    validRoutes[name] = normalizeRoute(name, merged);
    Diagnostics.info("[RegistryEngine] route updated via admin", { route: name, updates });
    return true;
  }

  function validate() {
    return Object.keys(validRoutes).length > 0;
  }

  function inspect() {
    const report = {
      duplicateRoutes: [],
      invalidContracts: [],
      disabledRoutes: [],
      missingLayouts: [],
      missingModules: []
    };

    const ids = new Map();
    for (const [name, route] of Object.entries(registry || {})) {
      const routeId = typeof route?.id === "string" && route.id.trim() ? route.id : name;
      if (ids.has(routeId)) {
        report.duplicateRoutes.push(`${routeId} appears as ${ids.get(routeId)} and ${name}`);
      } else {
        ids.set(routeId, name);
      }

      if (!isValidRoute(name, route)) {
        report.invalidContracts.push(`${name} has invalid route contract`);
      }

      if (route?.enabled === false) {
        report.disabledRoutes.push(name);
      }

      if (typeof route?.layout !== "string" || !route.layout.trim()) {
        report.missingLayouts.push(name);
      }

      if (!window.ModuleRegistry?.[routeId]) {
        report.missingModules.push(name);
      }
    }

    return report;
  }

  return {
    load,
    getAll,
    getRaw,
    resolveRoute,
    setRouteEnabled,
    updateRoute,
    validate,
    inspect
  };

})();

window.RegistryEngine = RegistryEngine;