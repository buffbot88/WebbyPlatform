const LayoutEngine = (() => {

  async function load(name) {
    const res = await fetch(`./layouts/${name}.html`);
    if (!res.ok) return `<div>Missing layout: ${name}</div>`;
    return await res.text();
  }

  function inject(layout, content) {
    return layout.replace("{{slot:main}}", content);
  }

  return {
    load,
    inject
  };

})();

window.LayoutEngine = LayoutEngine;