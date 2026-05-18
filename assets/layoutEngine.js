const LayoutEngine = (() => {

  const defaultLayout = "default";
  const slotMarker = "{{slot:main}}";
  const layoutNameRx = /^[a-z0-9_-]+$/;

  async function load(name) {
    const layoutName = layoutNameRx.test(name) ? name : defaultLayout;
    if (!layoutNameRx.test(name)) {
      Diagnostics.warn("[LayoutEngine] invalid layout name, falling back to default", name);
    }

    const res = await fetch(`./layouts/${layoutName}.html`);
    if (!res.ok) {
      Diagnostics.warn("[LayoutEngine] missing layout file", layoutName);
      if (layoutName !== defaultLayout) {
        return load(defaultLayout);
      }
      return `<div class="layout-error">Missing layout: ${Diagnostics.escapeText(layoutName)}</div>`;
    }

    return await res.text();
  }

  function inject(layout, content) {
    if (typeof layout !== "string") {
      Diagnostics.warn("[LayoutEngine] invalid layout content", layout);
      layout = "";
    }

    if (layout.includes(slotMarker)) {
      return layout.replaceAll(slotMarker, content);
    }

    Diagnostics.warn("[LayoutEngine] missing slot placeholder", layout);
    return `<div class="layout-fallback">${content}</div>`;
  }

  return {
    load,
    inject
  };

})();

window.LayoutEngine = LayoutEngine;