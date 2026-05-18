const Settings = (() => {

  const configKey = "webby_config";

  function get() {
    return JSON.parse(localStorage.getItem(configKey) || "{}");
  }

  function set(data) {
    localStorage.setItem(configKey, JSON.stringify(data));
  }

  function save() {
    const name = document.getElementById("siteName")?.value;
    const chat = document.getElementById("chatToggle")?.checked;

    const config = {
      siteName: name,
      chatEnabled: chat
    };

    set(config);

    location.reload();
  }

  return { get, set, save };

})();

window.Settings = Settings;