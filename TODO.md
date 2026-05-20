# WebbyOS Staged Roadmap v0.46-v0.50

This roadmap is the execution source of truth. Work must proceed by version stage, not as one giant migration.

## Product identity rule
- WebbyOS must not ship visible branding, wording, comments, demo copy, docs, CSS class names, labels, or placeholder text that references external forum, CMS, social, or publishing platforms.
- External products may be internal UX inspiration only and must not appear in the repository or UI.
- Do not use competitor/script names or external-brand phrases in WebbyOS copy.

## v0.46 - Admin CP Productization
Status: COMPLETE

Goal: Finish Admin CP as the professional control center.

- [x] Remove all external platform references.
- [x] Fix Admin CP duplicate pages.
- [x] Fix placeholder sublinks.
- [x] Ensure each category and sublink renders correct content.
- [x] Clarify Registry vs Modules.
- [x] Clarify Appearance vs Homepage.
- [x] Remove or hide raw Config editor.
- [x] Polish Admin CP workflows.
- [x] Improve section inventory dashboards.
- [x] Validate all Admin CP navigation by static render-key coverage.
- [x] Fixed AdminCP malformed inline handler crash.
- [x] Added safe JS argument escaping helper.
- [x] Updated AdminCP click handlers to avoid broken quoted arguments.
- [x] Verified AdminCP categories and sublinks click without SyntaxError.
- [x] Moved Navigation into Site and kept Builders focused on homepage/widgets/layout controls.

Validation:
- [x] JS syntax checks pass.
- [x] Public site loads.
- [x] Admin CP opens in a real admin session.
- [x] All Admin CP categories and sublinks render.
- [x] No external platform names remain.
- [x] No console errors.
- [x] No direct data endpoint usage outside `DataCoreSystem`.
- [x] No `localStorage` or IndexedDB added.
- [x] Final category click pass: Overview, Site, Community, Content, Users & Roles, Permissions, Appearance, Builders, Extensions, Maintenance, System.
- [x] Final representative sublink click pass: Site > General, Site > Navigation, Community > Forums, Content > Blog, Content > Calendar, Content > Categories, Appearance > Theme, Builders > Homepage, Builders > Widgets, Extensions > Packages, System > Runtime, System > Registry, System > Diagnostics.
- [x] Final console pass: no SyntaxError and no diagnostics errors or warnings.
- [x] Final source and stored-data branding audit clean as of May 20, 2026.

## v0.47 - Public Module UX Foundations
Status: READY TO START

Rules:
- Do not move files.
- Do not split modules into folders.
- Do not refactor PlatformCore.
- Preserve existing module globals.
- Preserve existing content record types.
- No external platform references.

Goal: Make public modules feel like real systems.

- [ ] Home becomes a CMS/community portal.
- [ ] Forums get structured forum UX.
- [ ] Blog gets editorial/news-style UX.
- [ ] Calendar gets actual calendar/event views.
- [ ] Account gets social profile/account center.
- [ ] Add internal module views/subviews.
- [ ] Reduce stacked one-page feel.
- [ ] Add breadcrumbs/internal navigation where useful.
- [ ] Keep current data types unchanged.

## v0.48 - Stability + Runtime Hardening
Goal: Stabilize before structural refactor.

Rules:
- Stabilization only.
- No `/Core` migration yet.
- No public module folder split yet.

- [ ] Performance checks.
- [ ] Render/listener cleanup.
- [ ] Package lifecycle safety.
- [ ] Diagnostics expansion.
- [ ] Search/index strategy review.
- [ ] Runtime recovery checks.
- [ ] Navigation regression checks.
- [ ] DataCore persistence checks.
- [ ] Module interaction checks.

## v0.49 - Structure + Refactor Era
Goal: Perform controlled structure migration.

- [ ] Create `/Core` folders.
- [ ] Move core JS files carefully.
- [ ] Update `index.html` script paths.
- [ ] Preserve globals: `window.Runtime`, `window.AdminSystemCore`, `window.ContentCoreSystem`, `window.UserCoreSystem`, `window.DataCoreSystem`, `window.PackageCoreSystem`.
- [ ] Split `AdminSystemCore` into AdminCore files.
- [ ] Split public modules into folders only after routes are stable.
- [ ] Preserve old record types: `blogPost`, `forumThread`, `forumPost`, `calendarEvent`.
- [ ] Do not migrate database records in this pass.

## v0.50 - Refactor Validation + Product Cohesion
Goal: Validate migration and product cohesion.

- [ ] Post-refactor integrity audit.
- [ ] Dead file/path detection.
- [ ] Compatibility shim verification.
- [ ] Route/registry audit.
- [ ] Admin console audit.
- [ ] Public module UX audit.
- [ ] Data persistence audit.
- [ ] Package ecosystem audit.
- [ ] Performance regression audit.
- [ ] Production direction report.
