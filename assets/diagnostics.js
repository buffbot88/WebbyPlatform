const Diagnostics = (() => {
  function escapeText(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function info(message, data) {
    console.info("[Diagnostics]", message, data ?? "");
  }

  function warn(message, data) {
    console.warn("[Diagnostics]", message, data ?? "");
  }

  function error(message, data) {
    console.error("[Diagnostics]", message, data ?? "");
  }

  function renderError(message) {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
      <div class="platform-error" style="padding:24px; color:#b91c1c; background:#fee2e2; border:1px solid #fca5a5; border-radius:12px;">
        <strong>PlatformCore error:</strong>
        <div style="margin-top:8px;">${escapeText(message)}</div>
      </div>
    `;
  }

  return {
    info,
    warn,
    error,
    renderError,
    escapeText
  };
})();

window.Diagnostics = Diagnostics;
