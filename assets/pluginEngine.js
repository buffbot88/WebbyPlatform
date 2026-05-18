const PluginEngine = (() => {

  const plugins = new Map();

  function register(id, plugin) {
    plugins.set(id, plugin);
    plugin?.init?.();
  }

  function mountAll(ctx = {}) {
    for (const p of plugins.values()) {
      p?.mount?.(ctx);
    }
  }

  function trigger(event, data) {
    for (const p of plugins.values()) {
      p?.onEvent?.(event, data);
    }
  }

  return {
    register,
    mountAll,
    trigger
  };

})();

window.PluginEngine = PluginEngine;