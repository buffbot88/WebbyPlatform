ModuleSDK.registerPage("forums", {

  title: "Forums",

  render: () => {
    return `
      <section class="cms-page">

        <h1>Forums</h1>

        <p class="muted">
          Forums module placeholder. Future topics, categories, posts,
          and moderation tools should stay inside this module.
        </p>

        <div class="cms-card">
          <h3>Community System Ready</h3>
          <p>The forum module route is mounted cleanly through PlatformCore.</p>
        </div>

      </section>
    `;
  }

});