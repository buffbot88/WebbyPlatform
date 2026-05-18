const ModuleLoader = (() => {

  function load(route, ctx = {}) {
    if (!route || typeof route !== "object") {
      return `<div class="module-error">Invalid route configuration</div>`;
    }

    const moduleId = route.id || "unknown";
    const mod = window.ModuleRegistry?.[moduleId];

    if (!mod || typeof mod.render !== "function") {
      Diagnostics.warn("[ModuleLoader] missing module", moduleId);
      return `<div class="module-error">Missing module: ${Diagnostics.escapeText(moduleId)}</div>`;
    }

    const features = FeatureEngine.resolve(route.features, ctx);
    let body = "";

    try {
      body = mod.render(ctx);
    } catch (err) {
      Diagnostics.error("[ModuleLoader] module render failed", { id: moduleId, error: err });
      body = `<div class="module-error">Module render failed: ${Diagnostics.escapeText(moduleId)}</div>`;
    }

    if (typeof body !== "string") {
      Diagnostics.warn("[ModuleLoader] module render returned non-string output", moduleId);
      body = String(body ?? "");
    }

    return `
      <div class="module" data-module="${Diagnostics.escapeText(moduleId)}">
        <div class="features">${features}</div>
        <div class="content">${body}</div>
      </div>
    `;
  }

  return { load };

})();

window.ModuleLoader = ModuleLoader;