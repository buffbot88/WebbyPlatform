window.ModuleRegistry = window.ModuleRegistry || {};

window.ModuleRegistry.settings = {
  render: () => {
    return `
      <div style="font-size:20px; font-weight:600;">
        Settings
      </div>

      <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px; max-width:400px;">

        <label>
          Website Name
          <input id="siteName" style="width:100%; padding:6px;" placeholder="WebbyPlatform" />
        </label>

        <label style="display:flex; align-items:center; gap:8px;">
          Enable Chat
          <input id="chatToggle" type="checkbox" />
        </label>

        <button onclick="Settings.save?.()" style="padding:8px; background:#2563eb; color:white; border:none; border-radius:6px;">
          Save
        </button>

      </div>
    `;
  }
};