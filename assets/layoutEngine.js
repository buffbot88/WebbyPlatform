const LayoutEngine = (() => {

  const defaultLayout = "default";
  const slotMarker = "{{slot:main}}";
  const layoutNameRx = /^[a-z0-9_-]+$/;

  async function load(name, visited = new Set()) {
    const layoutName = layoutNameRx.test(name) ? name : defaultLayout;
    if (!layoutNameRx.test(name)) {
      Diagnostics.warn("[LayoutEngine] invalid layout name, falling back to default", name);
    }

    if (visited.has(layoutName)) {
      Diagnostics.error("[LayoutEngine] recursive layout detected", layoutName);
      Lifecycle.emit("layout:mount", { layout: layoutName, status: "recursive" });
      return `<div class="layout-error">Recursive layout detected: ${Diagnostics.escapeText(layoutName)}</div>`;
    }

    visited.add(layoutName);
    const res = await fetch(`./layouts/${layoutName}.html`);
    if (!res.ok) {
      Diagnostics.warn("[LayoutEngine] missing layout file", layoutName);
      if (layoutName !== defaultLayout) {
        const fallback = await load(defaultLayout, visited);
        Lifecycle.emit("layout:mount", { layout: defaultLayout, status: "fallback" });
        return fallback;
      }
      Lifecycle.emit("layout:mount", { layout: layoutName, status: "missing" });
      return `<div class="layout-error">Missing layout: ${Diagnostics.escapeText(layoutName)}</div>`;
    }

    const text = await res.text();
    const occurrences = (text.match(new RegExp(slotMarker, "g")) || []).length;
    if (occurrences === 0) {
      Diagnostics.warn("[LayoutEngine] layout missing slot placeholder", layoutName);
    }
    if (occurrences > 1) {
      Diagnostics.warn("[LayoutEngine] malformed slot structure in layout", { layout: layoutName, occurrences });
    }

    Lifecycle.emit("layout:mount", { layout: layoutName, status: "mounted", slots: occurrences });
    return text;
  }

  function inject(layout, content) {
    if (typeof layout !== "string") {
      Diagnostics.warn("[LayoutEngine] invalid layout content", layout);
      layout = "";
    }

    const occurrences = (layout.match(new RegExp(slotMarker, "g")) || []).length;
    if (occurrences === 0) {
      Diagnostics.warn("[LayoutEngine] missing slot placeholder", layout);
      return `<div class="layout-fallback">${content}</div>`;
    }

    if (occurrences > 1) {
      Diagnostics.warn("[LayoutEngine] multiple slot placeholders detected", { occurrences });
    }

    return layout.replaceAll(slotMarker, content);
  }

  return {
    load,
    inject
  };

})();

window.LayoutEngine = LayoutEngine;