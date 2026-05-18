const RegistryEngine = (() => {

  let registry = {};

  async function load() {
    const res = await fetch("/registry.json");
    registry = await res.json();
    return registry;
  }

  function getAll() {
    return registry;
  }

  function resolveRoute(name) {
    const r = registry[name];
    if (!r || r.type !== "page") return null;
    if (r.enabled === false) return null;
    return r;
  }

  function validate() {
    return !!registry;
  }

  return {
    load,
    getAll,
    resolveRoute,
    validate
  };

})();

window.RegistryEngine = RegistryEngine;