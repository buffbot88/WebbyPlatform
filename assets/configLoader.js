const ConfigLoader = (() => {

  let config = null;

  async function load() {
    const res = await fetch("/config.json");
    if (!res.ok) throw new Error("[ConfigLoader] failed");

    config = await res.json();
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