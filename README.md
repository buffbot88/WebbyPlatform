# WebbyPlatform

WebbyPlatform is a React + Vite site builder prototype designed to explore platform state management, plugin-driven action workflows, and audit/replayable editing flows.

## Repository Structure

- `frontend/` - React application with site builder modules and platform core state.
- `frontend/src/core/platform/` - Platform core layer with action validation, audit logging, persistence, and plugin runtime support.
- `frontend/src/modules/site-builder/` - Site editing UI, context integration, and renderer components.

## Getting Started

From the `frontend` directory:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Notes

- The application uses Vite, React, and browser storage for audit log persistence.
- Platform runtime features are implemented in `frontend/src/core/platform`.
- The project is intended as a prototype for centralized state, plugins, and action-driven workflows.
