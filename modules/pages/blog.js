ModuleSDK.registerPage("blog", {

  title: "Blog",

  render: () => {
    return `
      <section class="cms-page">

        <h1>Blog</h1>

        <p class="muted">
          Blog module placeholder. Future blog logic should live here,
          isolated from PlatformCore.
        </p>

        <div class="cms-card">
          <h3>Module Ready</h3>
          <p>This page proves the blog route, registry entry, and module contract work.</p>
        </div>

      </section>
    `;
  }

});