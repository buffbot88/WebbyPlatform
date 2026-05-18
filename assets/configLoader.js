const ConfigLoader = (() => {

  let config = null;
  const defaults = {
    siteName: "WebbyPlatform OS",
    theme: "light-blue",
    features: {},
    admin: { enabled: false },
    settings: {}
  };
  const OVERRIDE_KEY = "webby_config_override";

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
      typeof value.admin.enabled === "boolean" &&
      typeof value.settings === "object" &&
      value.settings !== null
    );
  }

  function loadOverride() {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (err) {
      Diagnostics.warn("[ConfigLoader] invalid config override", err);
      localStorage.removeItem(OVERRIDE_KEY);
      return null;
    }
  }

  function mergeConfig(base, override) {
    if (!override || typeof override !== "object") return base;
    return normalize({
      ...base,
      ...override,
      features: {
        ...base.features,
        ...(typeof override.features === "object" && override.features !== null ? override.features : {})
      },
      admin: {
        ...base.admin,
        ...(typeof override.admin === "object" && override.admin !== null ? override.admin : {})
      },
      settings: {
        ...base.settings,
        ...(typeof override.settings === "object" && override.settings !== null ? override.settings : {})
      }
    });
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

    const override = loadOverride();
    if (override) {
      const merged = mergeConfig(config, override);
      if (validate(merged)) {
        config = merged;
      } else {
        Diagnostics.warn("[ConfigLoader] override invalid, ignoring", override);
      }
    }

    return config;
  }

  function apply(value) {
    if (!validate(value)) {
      return { success: false, error: "Invalid configuration payload" };
    }
    const normalized = normalize(value);
    config = normalized;
    try {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(normalized));
    } catch (err) {
      Diagnostics.warn("[ConfigLoader] failed to persist config override", err);
    }
    Diagnostics.info("[ConfigLoader] configuration applied via admin editor", normalized);
    return { success: true };
  }

  function reset() {
    localStorage.removeItem(OVERRIDE_KEY);
    config = { ...defaults };
    Diagnostics.info("[ConfigLoader] configuration reset to defaults");
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
    getSetting,
    apply,
    reset,
    validate
  };

})();

window.ConfigLoader = ConfigLoader;