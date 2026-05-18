# WebbyPlatform OS

A lightweight, modular JavaScript platform for building web applications with an engine-based architecture. WebbyPlatform OS provides a clean abstraction for routing, module loading, feature management, and plugin extensibility without heavy frameworks.

## Overview

WebbyPlatform OS is built on a **modular engine architecture** that separates concerns into independent, composable systems:

- **Registry Engine** - Manages routes and page definitions
- **Config Loader** - Loads application configuration
- **Feature Engine** - Manages feature registration and rendering
- **Plugin Engine** - Extensibility through a plugin system
- **Layout Engine** - Loads and injects HTML layout templates
- **Module Loader** - Dynamically loads page modules
- **Admin System** - Built-in authentication and admin panel
- **Runtime** - Core navigation and state management

## Repository Structure

```
.
├── index.html              # Application entry point
├── config.json             # Application configuration
├── registry.json           # Route and page definitions
├── assets/                 # Core engine and system files
│   ├── runtime.js          # Runtime initialization and navigation
│   ├── registryEngine.js   # Route registry management
│   ├── configLoader.js     # Config loading
│   ├── featureEngine.js    # Feature registration/resolution
│   ├── pluginEngine.js     # Plugin system
│   ├── layoutEngine.js     # Layout template management
│   ├── moduleLoader.js     # Module loading
│   ├── adminSystemCore.js  # Authentication system
│   ├── settings.js         # Global settings
│   └── theme.css           # Styling
├── layouts/                # HTML layout templates
│   ├── default.html        # Default layout
│   └── dashboard.html      # Dashboard layout
└── modules/
    └── pages/              # Page modules
        ├── home.js         # Home page
        ├── dashboard.js    # Dashboard page
        └── settings.js     # Settings page
```

## Features

- **Engine-Based Architecture** - Modular, composable systems with single responsibilities
- **Config-Driven** - Application behavior controlled via `config.json` and `registry.json`
- **Plugin System** - Extensible plugin architecture for custom functionality
- **Routing** - Route-based navigation with layouts and page modules
- **Feature Management** - Dynamic feature registration and rendering
- **Authentication** - Built-in admin authentication system
- **Multiple Layouts** - Support for different layout templates per page
- **No Heavy Dependencies** - Vanilla JavaScript, no framework bloat

## Getting Started

1. **Open the application** - Serve `index.html` with an HTTP server (e.g., `python3 -m http.server`)
2. **Navigate** - Use the navigation buttons to move between Home, Dashboard, and Settings pages
3. **Login** - Access protected pages by logging in via the admin modal (default: username `admin`, password `admin123`)
4. **Customize** - Modify `config.json`, `registry.json`, layouts, or page modules to extend functionality

## Configuration

### config.json

Controls application settings:

```json
{
  "siteName": "WebbyPlatform OS",
  "theme": "light-blue",
  "features": {
    "chat": true
  },
  "admin": {
    "enabled": true
  }
}
```

### registry.json

Defines pages and routes:

```json
{
  "home": {
    "id": "home",
    "type": "page",
    "layout": "default",
    "auth": false,
    "enabled": true,
    "features": []
  }
}
```

## Page Modules

Each page module registers itself to `window.ModuleRegistry`:

```javascript
window.ModuleRegistry.home = {
  render: (ctx) => {
    return `<div>Page content here</div>`;
  }
};
```

## Extending the Platform

### Create a New Page

1. Add entry to `registry.json`
2. Create module file in `modules/pages/`
3. Register module to `window.ModuleRegistry`
4. Include script in `index.html`

### Create a Plugin

```javascript
PluginEngine.register("my-plugin", {
  init: () => { /* Initialize */ },
  mount: (ctx) => { /* Mount functionality */ },
  onEvent: (event, data) => { /* Handle events */ }
});
```

### Add a Feature

```javascript
FeatureEngine.register("my-feature", (ctx) => {
  return `<div>Feature content</div>`;
});
```

## Browser Storage

- Admin authentication state stored in `localStorage` under key `admin_auth`
- Can be extended for other persistent data needs

## License

MIT
