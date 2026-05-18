window.ModuleRegistry = window.ModuleRegistry || {};

window.ModuleRegistry.home = {
  render: () => {
    return `
      <div style="font-size:20px; font-weight:600;">
        Home
      </div>

      <div style="margin-top:10px; color:#64748b;">
        Welcome to WebbyPlatform OS
      </div>
    `;
  }
};