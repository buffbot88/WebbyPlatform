(() => {
  const state = {
    posts: [],
    threads: [],
    events: [],
    loaded: false
  };

  function formatDate(iso) {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
  }

  function renderListSection(title, content) {
    return `
      <div class="cms-card home-section">
        <h3>${Diagnostics.escapeText(title)}</h3>
        ${content}
      </div>
    `;
  }

  async function refreshHome() {
    const contentSystem = window.ContentCoreSystem;
    if (!contentSystem) {
      state.loaded = true;
      return;
    }

    try {
      const [posts, threads, events] = await Promise.all([
        contentSystem.listContent("blogPost", { status: "published" }),
        contentSystem.listContent("forumThread", {}),
        contentSystem.listContent("calendarEvent", { status: "published" })
      ]);

      state.posts = Array.isArray(posts)
        ? posts
            .filter((post) => post.status === "published")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
        : [];

      state.threads = Array.isArray(threads)
        ? threads
            .filter((thread) => thread.status !== "trash")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
        : [];

      state.events = Array.isArray(events)
        ? events
            .filter((event) => event.status === "published")
            .sort((a, b) => new Date(a.metadata?.eventDate || a.createdAt).getTime() - new Date(b.metadata?.eventDate || b.createdAt).getTime())
            .slice(0, 3)
        : [];

      state.loaded = true;
    } catch (error) {
      state.loaded = true;
    }

    updateHomePage();
  }

  function renderBlogSummary() {
    if (!state.loaded) {
      return `<p class="muted">Loading latest blog posts…</p>`;
    }
    if (!state.posts.length) {
      return `<p class="muted">No published blog posts are available yet.</p>`;
    }
    return `
      <ul>
        ${state.posts
          .map((post) => `<li>${Diagnostics.escapeText(post.title)} <span class="muted">(${formatDate(post.createdAt)})</span></li>`)
          .join("")}
      </ul>
    `;
  }

  function renderForumSummary() {
    if (!state.loaded) {
      return `<p class="muted">Loading recent threads…</p>`;
    }
    if (!state.threads.length) {
      return `<p class="muted">No forum threads are available yet.</p>`;
    }
    return `
      <ul>
        ${state.threads
          .map((thread) => `<li>${Diagnostics.escapeText(thread.title)} <span class="muted">(${formatDate(thread.createdAt)})</span></li>`)
          .join("")}
      </ul>
    `;
  }

  function renderEventSummary() {
    if (!state.loaded) {
      return `<p class="muted">Loading upcoming events…</p>`;
    }
    if (!state.events.length) {
      return `<p class="muted">No upcoming events are scheduled.</p>`;
    }
    return `
      <ul>
        ${state.events
          .map((event) => `
            <li>
              ${Diagnostics.escapeText(event.title)}
              <span class="muted">(${Diagnostics.escapeText(formatDate(event.metadata?.eventDate || event.createdAt))})</span>
            </li>
          `)
          .join("")}
      </ul>
    `;
  }

  function updateHomePage() {
    const postsContainer = document.getElementById("homeBlogSummary");
    const threadsContainer = document.getElementById("homeForumSummary");
    const eventsContainer = document.getElementById("homeEventSummary");

    if (postsContainer) postsContainer.innerHTML = renderBlogSummary();
    if (threadsContainer) threadsContainer.innerHTML = renderForumSummary();
    if (eventsContainer) eventsContainer.innerHTML = renderEventSummary();
  }

  ModuleSDK.registerPage("home", {
    title: "Home",
    render: () => {
      if (!state.loaded) {
        refreshHome().catch(() => {
          state.loaded = true;
          updateHomePage();
        });
      }

      return `
        <section class="cms-hero">
          <div class="cms-kicker">WebbyPlatform CMS</div>
          <h1>Build a modular website from one stable PlatformCore.</h1>
          <p>This frontend gateway is ready for blogs, forums, calendars, accounts, community tools, and future installable modules.</p>
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

        <section class="cms-grid">
          ${renderListSection("Latest Blog Posts", `<div id="homeBlogSummary">${renderBlogSummary()}</div>`) }
          ${renderListSection("Latest Forum Threads", `<div id="homeForumSummary">${renderForumSummary()}</div>`) }
          ${renderListSection("Upcoming Events", `<div id="homeEventSummary">${renderEventSummary()}</div>`) }
        </section>
      `;
    }
  });
})();
