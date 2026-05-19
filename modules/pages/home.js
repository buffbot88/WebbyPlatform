ModuleSDK.registerPage("home", {

  title: "Home",

  render: () => {
    return `
      <section class="cms-hero">

        <div class="cms-kicker">
          WebbyPlatform CMS
        </div>

        <h1>
          Build a modular website from one stable PlatformCore.
        </h1>

        <p>
          This frontend gateway is ready for blogs, forums, calendars,
          accounts, community tools, and future installable modules.
        </p>

      </section>

      <section class="cms-grid">

        <button class="cms-card" onclick="Runtime.navigate('blog')">
          <h3>Blog</h3>
          <p>Publish articles, updates, and long-form content.</p>
        </button>

        <button class="cms-card" onclick="Runtime.navigate('forums')">
          <h3>Forums</h3>
          <p>Community discussions, categories, and threaded topics.</p>
        </button>

        <button class="cms-card" onclick="Runtime.navigate('calendar')">
          <h3>Calendar</h3>
          <p>Events, scheduling, reminders, and public dates.</p>
        </button>

        <button class="cms-card" onclick="Runtime.navigate('account')">
          <h3>Account</h3>
          <p>User login, signup, profiles, and permissions.</p>
        </button>

      </section>
    `;
  }

});