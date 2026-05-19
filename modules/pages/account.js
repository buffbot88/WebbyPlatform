ModuleSDK.registerPage("account", {

  title: "Account",

  render: () => {
    const userSystem = window.UserCoreSystem;
    const currentUser = userSystem?.getCurrentUser?.();
    const authenticated = userSystem?.isAuthenticated?.() ?? false;
    const statusMessage = userSystem?.getStatusMessage?.() || "";
    const capabilities = userSystem?.getCapabilities?.() || [];

    function renderStatus() {
      if (!statusMessage) return "";
      return `
        <div class="cms-alert">
          ${Diagnostics.escapeText(statusMessage)}
        </div>
      `;
    }

    if (!userSystem) {
      return `
        <section class="cms-page">
          <h1>Account</h1>
          <p class="muted">Identity system is not available.</p>
        </section>
      `;
    }

    if (!authenticated) {
      return `
        <section class="cms-page">
          <h1>Account</h1>
          <p class="muted">Sign in or register to manage your profile and access protected features.</p>

          ${renderStatus()}

          <div class="cms-grid">
            <div class="cms-card">
              <h3>Sign In</h3>
              <form onsubmit="window.UserCoreSystemUI.loginUser(event)">
                <label>
                  Username
                  <input id="accountLoginUsername" type="text" placeholder="username" required />
                </label>
                <label>
                  Password
                  <input id="accountLoginPassword" type="password" placeholder="password" required />
                </label>
                <button type="submit">Sign In</button>
              </form>
            </div>

            <div class="cms-card">
              <h3>Register</h3>
              <form onsubmit="window.UserCoreSystemUI.registerUser(event)">
                <label>
                  Username
                  <input id="accountRegisterUsername" type="text" placeholder="username" required />
                </label>
                <label>
                  Password
                  <input id="accountRegisterPassword" type="password" placeholder="password" required />
                </label>
                <label>
                  Display name
                  <input id="accountRegisterName" type="text" placeholder="Display name" />
                </label>
                <label>
                  Bio
                  <textarea id="accountRegisterBio" placeholder="Short bio"></textarea>
                </label>
                <button type="submit">Create Account</button>
              </form>
            </div>
          </div>
        </section>
      `;
    }

    const joinedAt = currentUser?.joinedAt ? new Date(currentUser.joinedAt).toLocaleString() : "Unknown";
    return `
      <section class="cms-page">
        <h1>Account Profile</h1>
        <p class="muted">Manage your profile information, view your role, and review granted capabilities.</p>

        ${renderStatus()}

        <div class="cms-profile-summary cms-card">
          <div class="profile-header">
            <div class="profile-avatar">${Diagnostics.escapeText((currentUser?.displayName || currentUser?.username || "?").slice(0, 1).toUpperCase())}</div>
            <div>
              <div class="profile-name">${Diagnostics.escapeText(currentUser?.displayName || currentUser?.username)}</div>
              <div class="profile-meta">Role: ${Diagnostics.escapeText(currentUser?.role || "guest")}</div>
              <div class="profile-meta">Joined: ${Diagnostics.escapeText(joinedAt)}</div>
            </div>
          </div>

          <div class="profile-bio">${Diagnostics.escapeText(currentUser?.bio || "No bio yet.")}</div>
        </div>

        <div class="cms-card">
          <h3>Update Profile</h3>
          <form onsubmit="window.UserCoreSystemUI.updateProfileUser(event)">
            <label>
              Display name
              <input id="accountProfileName" type="text" value="${Diagnostics.escapeText(currentUser?.displayName || "")}" />
            </label>
            <label>
              Bio
              <textarea id="accountProfileBio">${Diagnostics.escapeText(currentUser?.bio || "")}</textarea>
            </label>
            <button type="submit">Save Profile</button>
          </form>
        </div>

        <div class="cms-card">
          <h3>Capabilities</h3>
          <ul>
            ${capabilities.map((cap) => `<li>${Diagnostics.escapeText(cap)}</li>`).join("")}
          </ul>
        </div>

        <div class="cms-card">
          <button onclick="window.UserCoreSystemUI.logoutUser()">Logout</button>
        </div>
      </section>
    `;
  }

});