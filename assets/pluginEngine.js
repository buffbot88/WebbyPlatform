const PluginEngine = (() => {

  const plugins = new Map();

  function register(id, plugin) {
    if (!id || typeof plugin !== "object") {
      Diagnostics.warn("[PluginEngine] invalid plugin registration", { id, plugin });
      return;
    }

    plugins.set(id, plugin);

    try {
      plugin?.init?.();
    } catch (err) {
      Diagnostics.error("[PluginEngine] plugin init failed", { id, error: err });
    }
  }

  function mountAll(ctx = {}) {
    for (const [id, p] of plugins.entries()) {
      try {
        p?.mount?.(ctx);
      } catch (err) {
        Diagnostics.error("[PluginEngine] plugin mount failed", { id, error: err });
      }
    }
  }

  function trigger(event, data) {
    for (const [id, p] of plugins.entries()) {
      try {
        p?.onEvent?.(event, data);
      } catch (err) {
        Diagnostics.error("[PluginEngine] plugin event failed", { id, event, error: err });
      }
    }
  }

  return {
    register,
    mountAll,
    trigger
  };

})();

window.PluginEngine = PluginEngine;