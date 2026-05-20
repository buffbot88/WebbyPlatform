(() => {
  const state = {
    posts: [],
    threads: [],
    events: [],
    activities: [],
    trending: [],
    loaded: false,
    widgetHtml: {}
  };

  function escape(value) {
    return Diagnostics.escapeText(value == null ? "" : String(value));
  }

  function formatDate(iso) {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
  }

  function builderConfig() {
    return window.HomepageBuilderSystem?.getConfig?.() || window.HomepageBuilderSystem?.getDefaults?.() || {
      hero: {
        kicker: "WebbyPlatform CMS",
        title: "Build a modular website from one stable PlatformCore.",
        body: "This frontend gateway is ready for blogs, forums, calendars, accounts, community tools, and future installable modules."
      },
      sections: []
    };
  }

  function renderListSection(title, content, sectionId = "") {
    return `
      <div class="cms-card home-section" ${sectionId ? `data-home-section="${escape(sectionId)}"` : ""}>
        <h3>${escape(title)}</h3>
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
      const [posts, threads, events, activities, trending] = await Promise.all([
        contentSystem.listContent("blogPost", { status: "published" }),
        contentSystem.listContent("forumThread", {}),
        contentSystem.listContent("calendarEvent", { status: "published" }),
        window.ActivityFeedCoreSystem?.listRecent?.(6) || Promise.resolve([]),
        window.SearchCoreSystem?.trending?.(5) || Promise.resolve([])
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

      state.activities = Array.isArray(activities) ? activities : [];
      state.trending = Array.isArray(trending) ? trending : [];
      await refreshWidgets();

      state.loaded = true;
    } catch (error) {
      state.loaded = true;
    }

    updateHomePage();
  }

  async function refreshWidgets() {
    const sections = builderConfig().sections || [];
    const widgetSections = sections.filter((section) => section.enabled !== false && section.type === "widget" && section.widgetId);
    const entries = await Promise.all(widgetSections.map(async (section) => {
      const html = await window.WidgetCoreSystem?.renderWidget?.(section.widgetId).catch(() => "");
      return [section.id, html || `<div class="builder-empty">Widget is unavailable.</div>`];
    }));
    state.widgetHtml = Object.fromEntries(entries);
  }

  function renderBlogSummary() {
    if (!state.loaded) return `<p class="muted">Loading latest blog posts...</p>`;
    if (!state.posts.length) return `<p class="muted">No published blog posts are available yet.</p>`;
    return `
      <ul>
        ${state.posts
          .map((post) => `<li>${escape(post.title)} <span class="muted">(${formatDate(post.createdAt)})</span></li>`)
          .join("")}
      </ul>
    `;
  }

  function renderForumSummary() {
    if (!state.loaded) return `<p class="muted">Loading recent threads...</p>`;
    if (!state.threads.length) return `<p class="muted">No forum threads are available yet.</p>`;
    return `
      <ul>
        ${state.threads
          .map((thread) => `<li>${escape(thread.title)} <span class="muted">(${formatDate(thread.createdAt)})</span></li>`)
          .join("")}
      </ul>
    `;
  }

  function renderEventSummary() {
    if (!state.loaded) return `<p class="muted">Loading upcoming events...</p>`;
    if (!state.events.length) return `<p class="muted">No upcoming events are scheduled.</p>`;
    return `
      <ul>
        ${state.events
          .map((event) => `
            <li>
              ${escape(event.title)}
              <span class="muted">(${escape(formatDate(event.metadata?.eventDate || event.createdAt))})</span>
            </li>
          `)
          .join("")}
      </ul>
    `;
  }

  function renderActivitySummary() {
    if (!state.loaded) return `<p class="muted">Loading recent activity...</p>`;
    if (window.ActivityFeedCoreSystem?.renderActivityFeed) {
      return window.ActivityFeedCoreSystem.renderActivityFeed(state.activities);
    }
    return `<p class="muted">Activity feed is unavailable.</p>`;
  }

  function renderTrendingSummary() {
    if (!state.loaded) return `<p class="muted">Loading featured content...</p>`;
    if (window.SearchCoreSystem?.renderResults) {
      return window.SearchCoreSystem.renderResults(state.trending);
    }
    return `<p class="muted">Discovery tools are unavailable.</p>`;
  }

  function renderHero() {
    const hero = builderConfig().hero || {};
    return `
      <section class="cms-hero">
        <div class="cms-kicker">${escape(hero.kicker || "WebbyPlatform CMS")}</div>
        <h1>${escape(hero.title || "Build a modular website from one stable PlatformCore.")}</h1>
        <p>${escape(hero.body || "")}</p>
      </section>
    `;
  }

  function renderModuleLinks() {
    const routes = (window.NavigationBuilderSystem?.getPublicItems?.() || [])
      .filter((item) => ["blog", "forums", "calendar", "account"].includes(item.route));
    const fallback = [
      ["blog", "Blog", "Publish articles, updates, and long-form content."],
      ["forums", "Forums", "Community discussions, categories, and threaded topics."],
      ["calendar", "Calendar", "Events, scheduling, reminders, and public dates."],
      ["account", "Account", "User login, signup, profiles, and permissions."]
    ];
    const items = routes.length
      ? routes.map((item) => [item.route, item.label, descriptionForRoute(item.route)])
      : fallback;

    return `
      <section class="cms-grid">
        ${items.map(([route, label, description]) => `
          <button class="cms-card" onclick="Runtime.navigate('${escape(route)}')">
            <h3>${escape(label)}</h3>
            <p>${escape(description)}</p>
          </button>
        `).join("")}
      </section>
    `;
  }

  function descriptionForRoute(route) {
    const descriptions = {
      blog: "Publish articles, updates, and long-form content.",
      forums: "Community discussions, categories, and threaded topics.",
      calendar: "Events, scheduling, reminders, and public dates.",
      account: "User login, signup, profiles, and permissions."
    };
    return descriptions[route] || "Open this section.";
  }

  function renderSection(section) {
    if (!section || section.enabled === false) return "";
    if (section.type === "hero") return renderHero();
    if (section.type === "moduleLinks") return renderModuleLinks();
    if (section.type === "blogPreview") return renderListSection(section.title, `<div id="homeBlogSummary">${renderBlogSummary()}</div>`, section.id);
    if (section.type === "forumPreview") return renderListSection(section.title, `<div id="homeForumSummary">${renderForumSummary()}</div>`, section.id);
    if (section.type === "calendarPreview") return renderListSection(section.title, `<div id="homeEventSummary">${renderEventSummary()}</div>`, section.id);
    if (section.type === "activityFeed") return renderListSection(section.title, `<div id="homeActivitySummary">${renderActivitySummary()}</div>`, section.id);
    if (section.type === "featuredContent") return renderListSection(section.title, `<div id="homeTrendingSummary">${renderTrendingSummary()}</div>`, section.id);
    if (section.type === "widget") {
      return `<section data-home-section="${escape(section.id)}">${state.widgetHtml[section.id] || `<div class="cms-card builder-empty">Loading widget...</div>`}</section>`;
    }
    return "";
  }

  function groupSections(htmlItems) {
    const grouped = [];
    let cardGroup = [];
    htmlItems.forEach(({ section, html }) => {
      const isCard = ["blogPreview", "forumPreview", "calendarPreview"].includes(section.type);
      if (isCard) {
        cardGroup.push(html);
        return;
      }
      if (cardGroup.length) {
        grouped.push(`<section class="cms-grid">${cardGroup.join("")}</section>`);
        cardGroup = [];
      }
      grouped.push(html);
    });
    if (cardGroup.length) grouped.push(`<section class="cms-grid">${cardGroup.join("")}</section>`);
    return grouped.join("");
  }

  function updateHomePage() {
    const root = document.getElementById("homeBuilderRoot");
    if (root) root.innerHTML = renderHome();
  }

  function renderHome() {
    const sections = (builderConfig().sections || [])
      .filter((section) => section.enabled !== false)
      .sort((a, b) => a.order - b.order);
    const htmlItems = sections
      .map((section) => ({ section, html: renderSection(section) }))
      .filter((item) => item.html);
    return groupSections(htmlItems);
  }

  window.HomeModuleUI = {
    refresh: refreshHome
  };

  ModuleSDK.registerPage("home", {
    title: "Home",
    render: () => {
      if (!state.loaded) {
        refreshHome().catch(() => {
          state.loaded = true;
          updateHomePage();
        });
      } else {
        refreshWidgets().then(updateHomePage).catch(() => null);
      }

      return `<div id="homeBuilderRoot" class="page-shell">${renderHome()}</div>`;
    }
  });
})();
