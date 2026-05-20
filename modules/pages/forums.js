(() => {
  const state = {
    threads: [],
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

  function getThreadReplies(thread) {
    return state.posts.filter((post) => post.metadata?.threadId === thread.id && post.status !== "trash");
  }

  function renderThread(thread, userSystem) {
    const replies = getThreadReplies(thread);
    const canCreatePost = userSystem?.can("forum.post.create");
    const canEditThread = userSystem?.can("forum.thread.edit");
    const canClose = userSystem?.can("forum.thread.close");
    const canPin = userSystem?.can("forum.thread.pin");
    const canUnpin = userSystem?.can("forum.thread.unpin");
    const canTrashThread = userSystem?.can("forum.thread.moveTrash");

    const pinned = thread.metadata?.pinned === true;
    const closed = thread.status === "closed";

    return `
      <article class="cms-card forum-thread">
        <header>
          <div class="thread-title">
            ${pinned ? "<strong>[Pinned]</strong>" : ""} ${Diagnostics.escapeText(thread.title)}
          </div>
          <div class="thread-meta">
            <span>Author: ${Diagnostics.escapeText(thread.authorId || "unknown")}</span>
            <span>${Diagnostics.escapeText(formatDate(thread.createdAt))}</span>
            <span>Status: ${Diagnostics.escapeText(thread.status)}</span>
          </div>
        </header>

        <div class="forum-body">${Diagnostics.escapeText(thread.body || "No description.")}</div>

        <div class="forum-replies">
          <h4>Replies (${replies.length})</h4>
          ${replies.length
            ? replies
                .slice(-3)
                .map((reply) => `
                  <div class="forum-reply">
                    <div class="reply-meta">
                      <span>${Diagnostics.escapeText(reply.authorId || "unknown")}</span>
                      <span>${Diagnostics.escapeText(formatDate(reply.createdAt))}</span>
                    </div>
                    <div>${Diagnostics.escapeText(reply.body)}</div>
                    ${userSystem?.can("forum.post.edit") ? `<button onclick="window.ForumModuleUI.editPost('${Diagnostics.escapeText(reply.id)}')">Edit Reply</button>` : ""}
                    ${userSystem?.can("forum.post.moveTrash") ? `<button onclick="window.ForumModuleUI.deletePost('${Diagnostics.escapeText(reply.id)}')">Trash Reply</button>` : ""}
                  </div>
                `)
                .join("")
            : `<p class="muted">No replies yet.</p>`}
        </div>

        <div class="forum-actions">
          ${canCreatePost && !closed ? `
            <form onsubmit="window.ForumModuleUI.createReply(event, '${Diagnostics.escapeText(thread.id)}')">
              <label>
                Reply
                <textarea id="forumReplyBody-${Diagnostics.escapeText(thread.id)}" placeholder="Write your reply" required></textarea>
              </label>
              <button type="submit">Post Reply</button>
            </form>
          ` : `
            ${closed ? `<p class="muted">This thread is closed for replies.</p>` : `<p class="muted">Sign in with permissions to reply.</p>`}
          `}
        </div>

        <div class="forum-management">
          ${canEditThread ? `<button onclick="window.ForumModuleUI.editThread('${Diagnostics.escapeText(thread.id)}')">Edit Thread</button>` : ""}
          ${canClose ? `<button onclick="window.ForumModuleUI.toggleThreadStatus('${Diagnostics.escapeText(thread.id)}', '${closed ? "open" : "closed"}')">${closed ? "Reopen" : "Close"}</button>` : ""}
          ${pinned && canUnpin ? `<button onclick="window.ForumModuleUI.toggleThreadPin('${Diagnostics.escapeText(thread.id)}', false)">Unpin</button>` : ""}
          ${!pinned && canPin ? `<button onclick="window.ForumModuleUI.toggleThreadPin('${Diagnostics.escapeText(thread.id)}', true)">Pin</button>` : ""}
          ${canTrashThread ? `<button onclick="window.ForumModuleUI.moveThreadTrash('${Diagnostics.escapeText(thread.id)}')">Move to Trash</button>` : ""}
        </div>
      </article>
    `;
  }

  function renderThreadList(userSystem) {
    if (!state.loaded) {
      return `<div class="cms-card"><p>Loading forums…</p></div>`;
    }

    if (!state.threads.length) {
      return `
        <div class="cms-card">
          <h3>No threads yet</h3>
          <p class="muted">Create the first discussion thread to start the community.</p>
        </div>
      `;
    }

    return state.threads.map((thread) => renderThread(thread, userSystem)).join("");
  }

  async function refreshForum() {
    const contentSystem = window.ContentCoreSystem;
    const userSystem = window.UserCoreSystem;

    if (!contentSystem || !userSystem) {
      state.message = "The forum system is unavailable.";
      state.loaded = true;
      updateForumPage();
      return;
    }

    try {
      const threads = await contentSystem.listContent("forumThread", {});
      const posts = await contentSystem.listContent("forumPost", {});
      state.threads = Array.isArray(threads)
        ? threads
            .filter((thread) => thread.status !== "trash")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      state.posts = Array.isArray(posts) ? posts : [];
      state.loaded = true;
      state.message = "";
    } catch (error) {
      state.loaded = true;
      state.message = "Unable to load forum data.";
    }

    updateForumPage();
  }

  function updateForumPage() {
    const listContainer = document.getElementById("forumThreadContainer");
    if (listContainer) {
      listContainer.innerHTML = renderThreadList(window.UserCoreSystem);
    }

    const statusEl = document.getElementById("forumStatusMessage");
    if (statusEl) {
      statusEl.innerHTML = renderStatusMessage();
    }
  }

  window.ForumModuleUI = {
    async createThread(event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      if (!userSystem?.can("forum.thread.create") || !contentSystem) {
        state.message = "You do not have permission to create a thread.";
        updateForumPage();
        return false;
      }

      const title = document.getElementById("forumThreadTitle")?.value || "Untitled thread";
      const body = document.getElementById("forumThreadBody")?.value || "";
      const currentUser = userSystem.getCurrentUser?.();

      try {
        await contentSystem.createContent("forumThread", {
          title,
          body,
          status: "open",
          authorId: currentUser?.id || "guest",
          metadata: {
            pinned: false
          }
        });
        state.message = "Thread created successfully.";
        document.getElementById("forumThreadForm")?.reset();
        await refreshForum();
      } catch (error) {
        state.message = "Unable to create thread.";
        updateForumPage();
      }

      return false;
    },

    async createReply(event, threadId) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      if (!userSystem?.can("forum.post.create") || !contentSystem) {
        state.message = "You do not have permission to reply.";
        updateForumPage();
        return false;
      }

      const fieldId = `forumReplyBody-${threadId}`;
      const body = document.getElementById(fieldId)?.value || "";
      if (!body.trim()) {
        state.message = "Reply content is required.";
        updateForumPage();
        return false;
      }

      const currentUser = userSystem.getCurrentUser?.();
      try {
        await contentSystem.createContent("forumPost", {
          title: `Reply to ${threadId}`,
          body,
          status: "visible",
          authorId: currentUser?.id || "guest",
          metadata: {
            threadId
          }
        });
        state.message = "Reply posted successfully.";
        const field = document.getElementById(fieldId);
        if (field) field.value = "";
        await refreshForum();
      } catch (error) {
        state.message = "Unable to post reply.";
        updateForumPage();
      }

      return false;
    },

    async editThread(threadId) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!userSystem?.can("forum.thread.edit") || !contentSystem) {
        state.message = "You do not have permission to edit this thread.";
        updateForumPage();
        return;
      }

      const thread = state.threads.find((item) => String(item.id) === String(threadId));
      if (!thread) {
        state.message = "Thread not found.";
        updateForumPage();
        return;
      }

      const title = window.prompt("Update thread title:", thread.title) || thread.title;
      const body = window.prompt("Update thread body:", thread.body) || thread.body;

      try {
        await contentSystem.updateContent("forumThread", threadId, { title, body });
        state.message = "Thread updated.";
        await refreshForum();
      } catch (error) {
        state.message = "Unable to update the thread.";
        updateForumPage();
      }
    },

    async toggleThreadStatus(threadId, status) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!userSystem?.can("forum.thread.close") || !contentSystem) {
        state.message = "You do not have permission to change thread status.";
        updateForumPage();
        return;
      }

      try {
        await contentSystem.updateContent("forumThread", threadId, { status });
        state.message = `Thread ${Diagnostics.escapeText(status)}`;
        await refreshForum();
      } catch (error) {
        state.message = "Unable to update thread status.";
        updateForumPage();
      }
    },

    async toggleThreadPin(threadId, pinned) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!contentSystem || !userSystem?.can(pinned ? "forum.thread.pin" : "forum.thread.unpin")) {
        state.message = "You do not have permission to change pin state.";
        updateForumPage();
        return;
      }

      const thread = state.threads.find((item) => String(item.id) === String(threadId));
      if (!thread) {
        state.message = "Thread not found.";
        updateForumPage();
        return;
      }

      const metadata = { ...(thread.metadata || {}), pinned };
      try {
        await contentSystem.updateContent("forumThread", threadId, { metadata });
        state.message = pinned ? "Thread pinned." : "Thread unpinned.";
        await refreshForum();
      } catch (error) {
        state.message = "Unable to change pin state.";
        updateForumPage();
      }
    },

    async moveThreadTrash(threadId) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!contentSystem || !userSystem?.can("forum.thread.moveTrash")) {
        state.message = "You do not have permission to move this thread to trash.";
        updateForumPage();
        return;
      }

      try {
        await contentSystem.updateContent("forumThread", threadId, { status: "trash" });
        state.message = "Thread moved to trash.";
        await refreshForum();
      } catch (error) {
        state.message = "Unable to move thread to trash.";
        updateForumPage();
      }
    },

    async editPost(postId) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!contentSystem || !userSystem?.can("forum.post.edit")) {
        state.message = "You do not have permission to edit this reply.";
        updateForumPage();
        return;
      }

      const post = state.posts.find((item) => String(item.id) === String(postId));
      if (!post) {
        state.message = "Reply not found.";
        updateForumPage();
        return;
      }

      const body = window.prompt("Update reply:", post.body) || post.body;
      try {
        await contentSystem.updateContent("forumPost", postId, { body });
        state.message = "Reply updated.";
        await refreshForum();
      } catch (error) {
        state.message = "Unable to update reply.";
        updateForumPage();
      }
    },

    async deletePost(postId) {
      const contentSystem = window.ContentCoreSystem;
      const userSystem = window.UserCoreSystem;
      if (!contentSystem || !userSystem?.can("forum.post.moveTrash")) {
        state.message = "You do not have permission to trash this reply.";
        updateForumPage();
        return;
      }

      try {
        await contentSystem.updateContent("forumPost", postId, { status: "trash" });
        state.message = "Reply moved to trash.";
        await refreshForum();
      } catch (error) {
        state.message = "Unable to move reply to trash.";
        updateForumPage();
      }
    }
  };

  ModuleSDK.registerPage("forums", {
    title: "Forums",
    render: () => {
      const userSystem = window.UserCoreSystem;
      const contentSystem = window.ContentCoreSystem;
      const canCreateThread = userSystem?.can("forum.thread.create");

      if (!contentSystem || !userSystem) {
        return `
          <section class="cms-page">
            <h1>Forums</h1>
            <p class="muted">Forum system is unavailable.</p>
          </section>
        `;
      }

      if (!state.loaded) {
        refreshForum().catch(() => {
          state.loaded = true;
          state.message = "Unable to load forum content.";
          updateForumPage();
        });
      }

      return `
        <section class="cms-page">
          <h1>Forums</h1>
          <p class="muted">Community conversations are managed through the content system.</p>

          <div id="forumStatusMessage">${renderStatusMessage()}</div>

          <div class="cms-card">
            <h3>Create Thread</h3>
            ${canCreateThread ? `
              <form id="forumThreadForm" onsubmit="window.ForumModuleUI.createThread(event)">
                <label>
                  Title
                  <input id="forumThreadTitle" type="text" placeholder="Thread subject" required />
                </label>
                <label>
                  Message
                  <textarea id="forumThreadBody" placeholder="Thread description" required></textarea>
                </label>
                <button type="submit">Start Thread</button>
              </form>
            ` : `
              <p class="muted">Sign in with permissions to start new threads.</p>
            `}
          </div>

          <div id="forumThreadContainer">
            ${renderThreadList(userSystem)}
          </div>
        </section>
      `;
    }
  });
})();
