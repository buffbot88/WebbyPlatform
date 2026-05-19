// UserCoreSystem is a local development identity layer.
// Production authentication must be implemented through a secure backend/API.
const UserCoreSystem = (() => {

  const STORAGE_USERS = "WebbyPlatform.Users";
  const STORAGE_SESSION = "WebbyPlatform.UserSession";

  const DEFAULT_USERS = [
    {
      username: "admin",
      password: "admin123",
      displayName: "Platform Admin",
      bio: "Administrative authority for local development.",
      role: "admin"
    },
    {
      username: "mod",
      password: "mod123",
      displayName: "Community Moderator",
      bio: "Moderator authority for forum workflows.",
      role: "moderator"
    },
    {
      username: "user",
      password: "user123",
      displayName: "Regular User",
      bio: "Standard user account for testing public workflows.",
      role: "user"
    }
  ];

  const ROLE_CAPABILITIES = {
    guest: [
      "platform.account.access"
    ],
    user: [
      "platform.account.access",
      "user.profile.view",
      "user.profile.edit",
      "user.login",
      "user.logout",
      "user.register",
      "forum.thread.create",
      "forum.post.create"
    ],
    moderator: [
      "platform.account.access",
      "user.profile.view",
      "user.profile.edit",
      "user.login",
      "user.logout",
      "user.register",
      "forum.thread.create",
      "forum.post.create",
      "forum.thread.edit",
      "forum.thread.close",
      "forum.thread.pin",
      "forum.thread.unpin",
      "forum.thread.moveTrash",
      "forum.post.edit",
      "forum.post.moveTrash"
    ],
    admin: [
      "platform.account.access",
      "user.profile.view",
      "user.profile.edit",
      "user.login",
      "user.logout",
      "user.register",
      "forum.thread.create",
      "forum.post.create",
      "forum.thread.edit",
      "forum.thread.close",
      "forum.thread.pin",
      "forum.thread.unpin",
      "forum.thread.moveTrash",
      "forum.post.edit",
      "forum.post.moveTrash",
      "platform.admin.access",
      "platform.admin.manage"
    ]
  };

  let users = [];
  let currentUser = null;
  let statusMessage = null;

  function clone(value) {
    if (value === null || typeof value !== "object") return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function normalizeUsername(username) {
    return typeof username === "string" ? username.trim().toLowerCase() : "";
  }

  function normalizeUser(user) {
    return {
      username: normalizeUsername(user.username),
      password: typeof user.password === "string" ? user.password : "",
      displayName: typeof user.displayName === "string" && user.displayName.trim()
        ? user.displayName.trim()
        : normalizeUsername(user.username) || "New User",
      bio: typeof user.bio === "string" ? user.bio.trim() : "",
      avatar: typeof user.avatar === "string" ? user.avatar : "",
      joinedAt: typeof user.joinedAt === "string" ? user.joinedAt : new Date().toISOString(),
      role: typeof user.role === "string" && user.role.trim() ? user.role.trim() : "user",
      capabilities: Array.isArray(user.capabilities)
        ? user.capabilities.filter((item) => typeof item === "string" && item.trim())
        : []
    };
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(STORAGE_USERS);
      const parsed = raw ? JSON.parse(raw) : [];
      users = Array.isArray(parsed)
        ? parsed.map(normalizeUser)
        : [];
    } catch (err) {
      Diagnostics?.warn?.("[UserCoreSystem] failed to load users", err);
      users = [];
    }
  }

  function saveUsers() {
    try {
      localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    } catch (err) {
      Diagnostics?.warn?.("[UserCoreSystem] failed to save users", err);
    }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION);
      const session = raw ? JSON.parse(raw) : null;
      if (session && typeof session.username === "string") {
        const found = users.find((entry) => entry.username === normalizeUsername(session.username));
        currentUser = found || null;
      } else {
        currentUser = null;
      }
    } catch (err) {
      Diagnostics?.warn?.("[UserCoreSystem] failed to restore session", err);
      currentUser = null;
    }
  }

  function saveSession() {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify({ username: currentUser.username }));
      } else {
        localStorage.removeItem(STORAGE_SESSION);
      }
    } catch (err) {
      Diagnostics?.warn?.("[UserCoreSystem] failed to persist session", err);
    }
  }

  function seedDefaultUsers() {
    if (users.length > 0) return;
    users = DEFAULT_USERS.map((entry) => normalizeUser({ ...entry, joinedAt: new Date().toISOString() }));
    saveUsers();
  }

  function getRoleCapabilities(role) {
    return Array.from(new Set([...(ROLE_CAPABILITIES[role] || []), ...(ROLE_CAPABILITIES.user || [])]));
  }

  function getCurrentUser() {
    return currentUser ? clone({
      username: currentUser.username,
      displayName: currentUser.displayName,
      bio: currentUser.bio,
      avatar: currentUser.avatar,
      joinedAt: currentUser.joinedAt,
      role: currentUser.role,
      capabilities: currentUser.capabilities || []
    }) : null;
  }

  function isAuthenticated() {
    return !!currentUser;
  }

  function hasRole(role) {
    return typeof role === "string" && currentUser?.role === role;
  }

  function getCapabilities() {
    if (!currentUser) return [...ROLE_CAPABILITIES.guest];
    return Array.from(new Set([
      ...getRoleCapabilities(currentUser.role),
      ...(currentUser.capabilities || [])
    ]));
  }

  function can(capability) {
    if (typeof capability !== "string" || !capability.trim()) return false;
    return getCapabilities().includes(capability);
  }

  function findUser(username) {
    const normalized = normalizeUsername(username);
    return users.find((entry) => entry.username === normalized) || null;
  }

  function setStatusMessage(message) {
    statusMessage = typeof message === "string" ? message : null;
  }

  function authenticate(username, password) {
    const user = findUser(username);
    if (!user || user.password !== password) {
      setStatusMessage("Invalid username or password.");
      return false;
    }
    currentUser = user;
    setStatusMessage("Signed in successfully.");
    saveSession();
    persistUserState();
    Lifecycle.emit("user:login", { user: getCurrentUser() });
    return true;
  }

  function register({ username, password, displayName, bio }) {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername || !password || password.length < 3) {
      setStatusMessage("Username and password are required. Password must be at least 3 characters.");
      return false;
    }

    if (findUser(normalizedUsername)) {
      setStatusMessage("That username is already in use.");
      return false;
    }

    const newUser = normalizeUser({
      username: normalizedUsername,
      password,
      displayName,
      bio,
      role: "user",
      joinedAt: new Date().toISOString(),
      avatar: ""
    });

    users.push(newUser);
    saveUsers();

    currentUser = newUser;
    saveSession();
    setStatusMessage("Registration complete. You are now signed in.");
    persistUserState();
    Lifecycle.emit("user:register", { user: getCurrentUser() });
    return true;
  }

  function logout() {
    if (!currentUser) return false;
    const previousUser = currentUser;
    currentUser = null;
    saveSession();
    setStatusMessage("Logged out successfully.");
    persistUserState();
    Lifecycle.emit("user:logout", { user: clone(previousUser) });
    return true;
  }

  function updateProfile({ displayName, bio }) {
    if (!currentUser) {
      setStatusMessage("No authenticated user.");
      return false;
    }

    currentUser.displayName = typeof displayName === "string" ? displayName.trim() : currentUser.displayName;
    currentUser.bio = typeof bio === "string" ? bio.trim() : currentUser.bio;
    saveUsers();
    setStatusMessage("Profile updated successfully.");
    persistUserState();
    Lifecycle.emit("user:profile:update", { user: getCurrentUser() });
    return true;
  }

  function getSessionState() {
    return {
      currentUser: getCurrentUser(),
      currentRole: currentUser?.role || "guest",
      userCapabilities: getCapabilities(),
      isAuthenticated: isAuthenticated()
    };
  }

  function getRouteDeniedReason(route) {
    if (!route) return "invalid route";
    if (!isAuthenticated()) {
      if (route.auth || (Array.isArray(route.roles) && route.roles.length) || (Array.isArray(route.capabilities) && route.capabilities.length)) {
        return "authentication required";
      }
      return null;
    }

    if (Array.isArray(route.roles) && route.roles.length) {
      if (!route.roles.some((role) => hasRole(role))) {
        return `requires role: ${route.roles.join(", ")}`;
      }
    }

    if (Array.isArray(route.capabilities) && route.capabilities.length) {
      const missing = route.capabilities.filter((cap) => !can(cap));
      if (missing.length) {
        return `missing capability: ${missing.join(", ")}`;
      }
    }

    return null;
  }

  function isRouteAccessible(route) {
    const denied = getRouteDeniedReason(route);
    return denied === null;
  }

  function persistUserState() {
    if (window.Runtime?.updateRuntimeState) {
      window.Runtime.updateRuntimeState(getSessionState());
    }
  }

  function init() {
    loadUsers();
    seedDefaultUsers();
    loadSession();
    persistUserState();
  }

  function getStatusMessage() {
    return statusMessage || "";
  }

  const UserCoreSystemUI = {
    loginUser(event) {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      const username = document.getElementById("accountLoginUsername")?.value;
      const password = document.getElementById("accountLoginPassword")?.value;
      const success = authenticate(username, password);
      window.Runtime?.navigate("account", { updateHash: false });
      return false;
    },
    registerUser(event) {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      const username = document.getElementById("accountRegisterUsername")?.value;
      const password = document.getElementById("accountRegisterPassword")?.value;
      const displayName = document.getElementById("accountRegisterName")?.value;
      const bio = document.getElementById("accountRegisterBio")?.value;
      const success = register({ username, password, displayName, bio });
      window.Runtime?.navigate("account", { updateHash: false });
      return false;
    },
    logoutUser() {
      logout();
      window.Runtime?.navigate("account", { updateHash: false });
    },
    updateProfileUser(event) {
      if (event && typeof event.preventDefault === "function") event.preventDefault();
      const displayName = document.getElementById("accountProfileName")?.value;
      const bio = document.getElementById("accountProfileBio")?.value;
      const success = updateProfile({ displayName, bio });
      if (success) {
        window.Runtime?.navigate("account", { updateHash: false });
      }
      return false;
    },
    getStatusMessage
  };

  return {
    init,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    can,
    getCapabilities,
    getSessionState,
    isRouteAccessible,
    getRouteDeniedReason,
    login: authenticate,
    logout,
    register,
    updateProfile,
    getStatusMessage,
    UserCoreSystemUI
  };

})();

window.UserCoreSystem = UserCoreSystem;
window.UserCoreSystemUI = UserCoreSystem.UserCoreSystemUI;
