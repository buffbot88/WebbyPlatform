const LayoutEngine = (() => {

  const loading = new Set();

  async function load(name = "default") {
    const layoutName = typeof name === "string" && name.trim()
      ? name.trim()
      : "default";

    if (loading.has(layoutName)) {
      Diagnostics?.warn?.("[LayoutEngine] recursive layout load blocked", { layoutName });
      return fallbackLayout();
    }

    loading.add(layoutName);

    try {
      const res = await fetch(`./layouts/${layoutName}.html`);

      if (!res.ok) {
        Diagnostics?.warn?.("[LayoutEngine] layout missing, using fallback", { layoutName });
        return fallbackLayout();
      }

      const html = await res.text();

      if (!html.includes("{{slot:main}}")) {
        Diagnostics?.warn?.("[LayoutEngine] layout missing main slot", { layoutName });
        return `${html}<main id="layout-slot">{{slot:main}}</main>`;
      }

      Lifecycle?.emit?.("layout:mount", {
        layout: layoutName
      });

      return html;

    } catch (err) {
      Diagnostics?.error?.("[LayoutEngine] layout load failed", {
        layoutName,
        error: err?.message || String(err)
      });

      return fallbackLayout();

    } finally {
      loading.delete(layoutName);
    }
  }

  function fallbackLayout() {
    return `
      <div class="layout layout-default">
        <header class="system-header">
          <div class="system-brand">WebbyPlatform OS</div>
          <nav class="system-actions">{{slot:nav}}</nav>
        </header>

        <main id="layout-slot">
          {{slot:main}}
        </main>
      </div>
    `;
  }

  function inject(layout, content) {
    return String(layout || fallbackLayout())
      .replace("{{slot:main}}", content || "")
      .replace("{{slot:nav}}", Runtime?.renderPublicNav?.() || "");
  }

  return {
    load,
    inject
  };

})();

window.LayoutEngine = LayoutEngine;