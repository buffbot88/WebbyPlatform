window.ModuleRegistry = window.ModuleRegistry || {};

window.ModuleRegistry.dashboard = {
  render: () => {
    return `
      <div style="font-size:20px; font-weight:600;">
        Dashboard
      </div>

      <div style="margin-top:10px; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">

        <div style="padding:12px; background:white; border-radius:8px;">
          System Status
        </div>

        <div style="padding:12px; background:white; border-radius:8px;">
          Users
        </div>

        <div style="padding:12px; background:white; border-radius:8px;">
          Activity
        </div>

      </div>
    `;
  }
};