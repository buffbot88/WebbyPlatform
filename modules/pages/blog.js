(() => {
  const state = {
    posts: [],
    loaded: false,
    message: ""
  };

  function formatDate(iso) {
    if (!iso) return "Unknown";
    const date = new Date(iso);
    return isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
  }

  function renderStatusMessage() {
    return state.message ? `<div class="cms-alert">${Diagnostics.escapeText(state.message)}</div>` : "";
  }

  function renderPostList(userSystem) {
    if (!state.loaded) {
      return `<div class="cms-card"><p>Loading blog posts…</p></div>`;
    }

    if (!state.posts.length) {
      return `
        <div class="cms-card">
          <h3>No blog posts yet</h3>
          <p class="muted">There are no published blog posts to display.</p>
        </div>
      `;
    }

    return state.posts
      .map((post) => {
        const canEdit = userSystem?.can("blog.post.edit");
        const canPublish = userSystem?.can("blog.post.publish");
        const isDraft = post.status !== "published";
        return `
          <article class="cms-card blog-post">
            <header>
              <h3>${Diagnostics.escapeText(post.title)}</h3>
              <div class="post-meta">
                <span>Author: ${Diagnostics.escapeText(post.authorId || "unknown")}</span>
                <span>${Diagnostics.escapeText(formatDate(post.createdAt))}</span>
                <span>Status: ${Diagnostics.escapeText(post.status)}</span>
              </div>
            </header>
            <div class="blog-body">${post.body || "<em>No content</em>"}</div>
            <footer>
              ${canEdit ? `<button onclick="window.BlogModuleUI.editPost('${Diagnostics.escapeText(post.id)}')">Edit</button>` : ""}
              ${canPublish ? `<button onclick="window.BlogModuleUI.togglePostStatus('${Diagnostics.escapeText(post.id)}','${isDraft ? "published" : "draft"}')">${isDraft ? "Publish" : "Unpublish"}</button>` : ""}
            </footer>
          </article>
        `;
      })
      .join("");
  }

  async function refreshPosts() {
    const contentSystem = window.ContentCoreSystem;
    const userSystem = window.UserCoreSystem;

    if (!contentSystem || !userSystem) {
      state.message = "Blog system is unavailable.";
      state.loaded = true;
      updateBlogPage();
      return;
    }

    try {
      const canManage = userSystem.can("blog.post.edit") || userSystem.can("blog.post.publish");
      const criteria = canManage ? {} : { status: "published" };
      const posts = await contentSystem.listContent("blogPost", criteria);
      state.posts = Array.isArray(posts)
        ? posts.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      state.loaded = true;
      state.message = "";
    } catch (error) {
      state.loaded = true;
      state.message = "Unable to load blog posts.";
    }

    updateBlogPage();
  }

  function updateBlogPage() {
    const listContainer = document.getElementById("blogListContainer");
    if (listContainer) {
      listContainer.innerHTML = renderPostList(window.UserCoreSystem);
    }
    const statusEl = document.getElementById("blogStatusMessage");
    if (statusEl) {
      statusEl.innerHTML = renderStatusMessage();
    }
  }

  window.BlogModuleUI = {
    async createPost(event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      if (!userSystem?.can("blog.post.create") || !contentSystem) {
        state.message = "You do not have permission to create blog posts.";
        updateBlogPage();
        return false;
      }

      const title = document.getElementById("blogCreateTitle")?.value || "Untitled";
      const body = document.getElementById("blogCreateBody")?.value || "";
      const status = document.getElementById("blogCreateStatus")?.value || "draft";
      const currentUser = userSystem.getCurrentUser?.();

      try {
        await contentSystem.createContent("blogPost", {
          title,
          body,
          status,
          authorId: currentUser?.id || "guest"
        });
        state.message = "Blog post saved successfully.";
        document.getElementById("blogCreateForm")?.reset();
        await refreshPosts();
      } catch (error) {
        state.message = "Unable to save the blog post.";
        updateBlogPage();
      }

      return false;
    },

    async togglePostStatus(id, status) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!contentSystem || !userSystem?.can("blog.post.publish")) {
        state.message = "You do not have permission to update post status.";
        updateBlogPage();
        return;
      }

      try {
        await contentSystem.updateContent("blogPost", id, { status });
        state.message = `Blog post status updated to ${Diagnostics.escapeText(status)}.`;
        await refreshPosts();
      } catch (error) {
        state.message = "Unable to update post status.";
        updateBlogPage();
      }
    },

    async editPost(id) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!contentSystem || !userSystem?.can("blog.post.edit")) {
        state.message = "You do not have permission to edit this post.";
        updateBlogPage();
        return;
      }

      const post = state.posts.find((entry) => String(entry.id) === String(id));
      if (!post) {
        state.message = "Blog post not found.";
        updateBlogPage();
        return;
      }

      const title = window.prompt("Update post title:", post.title) || post.title;
      const body = window.prompt("Update post body:", post.body) || post.body;

      try {
        await contentSystem.updateContent("blogPost", id, { title, body });
        state.message = "Blog post updated.";
        await refreshPosts();
      } catch (error) {
        state.message = "Unable to update the blog post.";
        updateBlogPage();
      }
    }
  };

  ModuleSDK.registerPage("blog", {
    title: "Blog",
    render: () => {
      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      const canCreate = userSystem?.can("blog.post.create");
      const canManage = userSystem?.can("blog.post.edit") || userSystem?.can("blog.post.publish");

      if (!contentSystem || !userSystem) {
        return `
          <section class="cms-page">
            <h1>Blog</h1>
            <p class="muted">Blog system is unavailable.</p>
          </section>
        `;
      }

      if (!state.loaded) {
        refreshPosts().catch(() => {
          state.loaded = true;
          state.message = "Unable to load blog content.";
          updateBlogPage();
        });
      }

      return `
        <section class="cms-page">
          <h1>Blog</h1>
          <p class="muted">Browse published articles and manage posts through the content system.</p>

          <div id="blogStatusMessage">${renderStatusMessage()}</div>

          ${canCreate ? `
            <div class="cms-card">
              <h3>Create Blog Post</h3>
              <form id="blogCreateForm" onsubmit="window.BlogModuleUI.createPost(event)">
                <label>
                  Title
                  <input id="blogCreateTitle" type="text" placeholder="Post title" required />
                </label>
                <label>
                  Body
                  <textarea id="blogCreateBody" placeholder="Post body" required></textarea>
                </label>
                <label>
                  Status
                  <select id="blogCreateStatus">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <button type="submit">Save Post</button>
              </form>
            </div>
          ` : `
            <div class="cms-card">
              <h3>Blog contributions</h3>
              <p class="muted">Sign in with permissions to create blog posts.</p>
            </div>
          `}

          <div id="blogListContainer">
            ${renderPostList(userSystem)}
          </div>

          ${canManage ? `
            <div class="cms-card">
              <h4>Management</h4>
              <p class="muted">You can edit or publish posts using the controls on each item.</p>
            </div>
          ` : ""}
        </section>
      `;
    }
  });
})();
