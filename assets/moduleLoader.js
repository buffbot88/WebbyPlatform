const ModuleLoader = (() => {

  function load(route, ctx = {}) {

    const mod = window.ModuleRegistry?.[route.id];

    if (!mod?.render) {
      return `<div>Missing module: ${route.id}</div>`;
    }

    const features = FeatureEngine.resolve(route.features, ctx);

    const body = mod.render(ctx);

    return `
      <div class="module">
        <div class="features">${features}</div>
        <div class="content">${body}</div>
      </div>
    `;
  }

  return { load };

})();

window.ModuleLoader = ModuleLoader;