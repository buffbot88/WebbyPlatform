const DataCoreSystem = (() => {

  const ENDPOINT = "./api/data.php";
  const ALLOWED_STORES = [
    "users",
    "profiles",
    "sessions",
    "forumThreads",
    "forumPosts",
    "blogPosts",
    "calendarEvents",
    "notifications",
    "reactions",
    "bookmarks",
    "activityFeed",
    "conversations",
    "messages",
    "reports",
    "moderationLogs",
    "userWarnings",
    "userSuspensions",
    "reputation",
    "userBadges",
    "mediaLibrary",
    "contentCategories",
    "contentTags",
    "contentRevisions",
    "searchIndex",
    "settings",
    "moduleData",
    "packages"
  ];
  const ALLOWED_ACTIONS = new Set(["list", "get", "put", "update", "remove", "clear", "export"]);

  let ready = false;
  let dataStores = [...ALLOWED_STORES];

  function logError(message, data) {
    Diagnostics?.error?.("[DataCoreSystem] " + message, data || {});
  }

  function logWarn(message, data) {
    Diagnostics?.warn?.("[DataCoreSystem] " + message, data || {});
  }

  function validateStore(store) {
    if (typeof store !== "string" || !ALLOWED_STORES.includes(store)) {
      throw new Error(`Invalid or unsupported store: ${String(store)}`);
    }
    return store;
  }

  function validateAction(action) {
    if (typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
      throw new Error(`Invalid action: ${String(action)}`);
    }
    return action;
  }

  function updateRuntimeState() {
    if (window.Runtime?.updateRuntimeState) {
      window.Runtime.updateRuntimeState({
        dataReady: ready,
        dataMode: "php-file-db",
        dataStores: [...dataStores]
      });
    }
  }

  async function request(action, payload = {}) {
    validateAction(action);
    if (!payload.store) {
      throw new Error("Store name is required.");
    }
    validateStore(payload.store);

    const body = {
      action,
      store: payload.store,
      id: payload.id,
      record: payload.record,
      patch: payload.patch
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Data API request failed (${response.status})` + (text ? `: ${text}` : ""));
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      logError("API request failed", { action, store: payload.store, error: err?.message || String(err) });
      throw err;
    }
  }

  async function init() {
    ready = true;
    updateRuntimeState();
    return {
      dataReady: ready,
      dataMode: "php-file-db",
      dataStores: [...dataStores]
    };
  }

  async function list(store) {
    validateStore(store);
    const result = await request("list", { store });
    return Array.isArray(result.records) ? result.records : [];
  }

  async function get(store, id) {
    validateStore(store);
    if (typeof id !== "string" && typeof id !== "number") {
      throw new Error("Record id is required for get().");
    }
    const result = await request("get", { store, id });
    return result.record ?? null;
  }

  async function put(store, record) {
    validateStore(store);
    if (!record || typeof record !== "object") {
      throw new Error("Record object is required for put().");
    }
    const result = await request("put", { store, record });
    return result.record ?? null;
  }

  async function update(store, id, patch) {
    validateStore(store);
    if (typeof id !== "string" && typeof id !== "number") {
      throw new Error("Record id is required for update().");
    }
    if (!patch || typeof patch !== "object") {
      throw new Error("Patch object is required for update().");
    }
    const result = await request("update", { store, id, patch });
    return result.record ?? null;
  }

  async function remove(store, id) {
    validateStore(store);
    if (typeof id !== "string" && typeof id !== "number") {
      throw new Error("Record id is required for remove().");
    }
    const result = await request("remove", { store, id });
    return result.success === true;
  }

  async function clear(store) {
    validateStore(store);
    const result = await request("clear", { store });
    return result.success === true;
  }

  async function exportStore(store) {
    validateStore(store);
    const result = await request("export", { store });
    return result.store ?? { records: [] };
  }

  return {
    init,
    list,
    get,
    put,
    update,
    remove,
    clear,
    exportStore,
    getStores: () => [...dataStores],
    isReady: () => ready,
    getMode: () => "php-file-db"
  };

})();

window.DataCoreSystem = DataCoreSystem;
