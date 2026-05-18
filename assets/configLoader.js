const ConfigLoader = (() => {

  let config = null;
  const defaults = {
    siteName: "WebbyPlatform OS",
    theme: "light-blue",
    features: {},
    admin: { enabled: false },
    settings: {}
  };

  function normalize(value) {
    if (!value || typeof value !== "object") return { ...defaults };
    return {
      siteName: typeof value.siteName === "string" ? value.siteName : defaults.siteName,
      theme: typeof value.theme === "string" ? value.theme : defaults.theme,
      features: typeof value.features === "object" && value.features !== null ? value.features : { ...defaults.features },
      admin: typeof value.admin === "object" && value.admin !== null ? {
        enabled: typeof value.admin.enabled === "boolean" ? value.admin.enabled : defaults.admin.enabled
      } : { ...defaults.admin },
      settings: typeof value.settings === "object" && value.settings !== null ? value.settings : { ...defaults.settings }
    };
  }

  function validate(value) {
    return (
      value &&
      typeof value.siteName === "string" &&
      typeof value.theme === "string" &&
      typeof value.features === "object" &&
      value.features !== null &&
      typeof value.admin === "object" &&
      value.admin !== null &&
      typeof value.admin.enabled === "boolean"
    );
  }

  async function load() {
    try {
      const res = await fetch("./config.json");
      if (!res.ok) throw new Error(`[ConfigLoader] fetch failed: ${res.status}`);

      const data = await res.json();
      config = normalize(data);

      if (!validate(config)) {
        Diagnostics.warn("[ConfigLoader] invalid config shape, using defaults", data);
        config = { ...defaults };
      }
    } catch (err) {
      Diagnostics.error("[ConfigLoader] load failed", err);
      config = { ...defaults };
    }

    return config;
  }

  function get() {
    return config;
  }

  function getFeature(key) {
    return config?.features?.[key];
  }

  function getSetting(key) {
    return config?.settings?.[key];
  }

  return {
    load,
    get,
    getFeature,
    getSetting
  };

})();

window.ConfigLoader = ConfigLoader;