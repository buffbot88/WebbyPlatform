const SearchCoreSystem = (() => {
  const STORE = "searchIndex";
  const TYPES = ["blogPost", "forumThread", "forumPost", "calendarEvent", "page"];

  function text(value) {
    return String(value == null ? "" : value).toLowerCase();
  }

  function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map((item) => String(item).trim()).filter(Boolean);
    return String(tags || "").split(",").map((item) => item.trim()).filter(Boolean);
  }

  function normalizeContentRecord(item) {
    const metadata = item.metadata && typeof item.metadata === "object" ? item.metadata : {};
    return {
      id: item.id,
      contentType: item.contentType,
      title: item.title || "",
      body: item.body || "",
      status: item.status || "",
      authorId: item.authorId || "",
      category: metadata.category || "General",
      tags: normalizeTags(metadata.tags),
      featured: metadata.featured === true,
      publishedAt: metadata.publishedAt || item.createdAt || "",
      updatedAt: item.updatedAt || item.createdAt || "",
      link: linkFor(item.contentType)
    };
  }

  function linkFor(type) {
    if (type === "blogPost") return "#blog";
    if (type === "calendarEvent") return "#calendar";
    if (type === "forumThread" || type === "forumPost") return "#forums";
    return "#home";
  }

  function matches(item, criteria = {}) {
    if (criteria.contentType && item.contentType !== criteria.contentType) return false;
    if (criteria.status && item.status !== criteria.status) return false;
    if (criteria.category && criteria.category !== "All" && item.category !== criteria.category) return false;
    if (criteria.authorId && item.authorId !== criteria.authorId) return false;
    if (criteria.tag && !item.tags.includes(criteria.tag)) return false;
    const q = text(criteria.query);
    if (q) {
      const haystack = text([item.title, item.body, item.category, item.tags.join(" "), item.authorId].join(" "));
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  function score(item, criteria = {}) {
    let value = 0;
    const q = text(criteria.query);
    if (q && text(item.title).includes(q)) value += 5;
    if (item.featured) value += 3;
    value += Math.max(0, new Date(item.updatedAt || item.publishedAt || 0).getTime() / 10000000000000);
    return value;
  }

  async function buildIndex() {
    if (!window.ContentCoreSystem?.listContent) return [];
    const groups = await Promise.all(TYPES.map((type) => window.ContentCoreSystem.listContent(type, {}).catch(() => [])));
    const index = groups.flat().map(normalizeContentRecord);
    if (window.DataCoreSystem?.clear && window.DataCoreSystem?.put) {
      await window.DataCoreSystem.clear(STORE).catch(() => false);
      for (const item of index) {
        await window.DataCoreSystem.put(STORE, { id: `${item.contentType}-${item.id}`, ...item }).catch(() => null);
      }
    }
    return index;
  }

  async function search(criteria = {}) {
    const index = await buildIndex();
    return index
      .filter((item) => matches(item, criteria))
      .sort((a, b) => score(b, criteria) - score(a, criteria));
  }

  async function trending(limit = 6) {
    const results = await search({});
    return results
      .filter((item) => item.status === "published" || item.status === "open")
      .sort((a, b) => {
        const featuredDelta = Number(b.featured) - Number(a.featured);
        if (featuredDelta !== 0) return featuredDelta;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      })
      .slice(0, Number(limit) || 6);
  }

  function renderResults(items) {
    if (!Array.isArray(items) || !items.length) return `<div class="search-empty">No matching content.</div>`;
    return `
      <div class="search-results">
        ${items.map((item) => `
          <a class="search-result" href="${item.link}">
            <strong>${Diagnostics.escapeText(item.title || "Untitled")}</strong>
            <span>${Diagnostics.escapeText(item.contentType)} · ${Diagnostics.escapeText(item.category || "General")}</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  async function init() {
    if (window.Runtime?.updateRuntimeState) {
      window.Runtime.updateRuntimeState({ searchReady: true });
    }
  }

  return {
    init,
    buildIndex,
    search,
    trending,
    renderResults
  };
})();

window.SearchCoreSystem = SearchCoreSystem;
