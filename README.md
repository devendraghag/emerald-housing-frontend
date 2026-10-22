# Emerald Housing frontend

Vue 3 JavaScript frontend for the sibling emerald-housing backend. Follows the reference project's Options API, Vue Router, Vuex, Axios, reusable single-file components and an independent Emerald visual design.

## Run

```powershell
npm.cmd install
npm.cmd run serve
```

Open http://localhost:8083. Start the backend and its dependencies separately. The development proxy forwards /api to the existing gateway at http://localhost:8080.

```powershell
npm.cmd test
npm.cmd run build
```

The dist folder contains the production build. Serve it with history fallback to index.html and reverse proxy /api to the gateway on the same origin.

## Features

- Society overview and floors.
- Server-paginated member and flat directories.
- Create, edit and confirm deactivation of members and flats.
- Assign owner, tenant or resident memberships, view history and end memberships.
- Form validation, backend validation messages, loading, retry and empty states.

The frontend includes admin sign-in, session restoration, session expiry handling and sign-out. It uses Gateway session cookies and fetches CSRF tokens for mutations, including login and logout. Credentials are never stored in browser storage.

For Docker Desktop Kubernetes, keep this running in a backend terminal:

```powershell
kubectl --context docker-desktop port-forward service/api-gateway 8080:8080 -n emerald-housing
```

Start the frontend in a separate terminal with npm.cmd run serve and open http://localhost:8083. Sign in using the application admin credentials printed during backend provisioning, not PostgreSQL credentials. The development proxy keeps browser API requests on the frontend origin; no separate CORS configuration is needed for this setup. Restart the port-forward if a Gateway rollout disconnects it.

## Structure and versions

- src/views: feature pages using Vue Options API.
- src/components: shared messages and form controls.
- src/router: routes, page titles and history navigation.
- src/store: shared society/floor data and success notices.
- src/services/api.js: centralized backend requests.
- src/util: request mapping and error handling.
- src/assets/style: responsive Emerald theme with no government design system.
- tests: request contract and error handling checks.

Retained reference versions: Vue 3.2.45, Router 4.1.6, Vuex 4.1.0, Vue CLI 4.5.19. Axios uses 1.7.9. Vue CLI retains the reference webpack build stack; the scripts include its required OpenSSL compatibility option and work on Windows.

The API contracts come from the existing Java controllers and DTOs. Live end-to-end validation needs the running Gateway, its backend dependencies, and a provisioned admin account.

## Responsive workspace

The workspace adapts to desktop, tablet and phone widths. Desktop uses sidebar navigation; phones use a fixed bottom navigation bar and directory cards. Login includes password visibility, while forms have touch-friendly controls and visible focus states. Animations respect reduced-motion preferences.

The overview loads actual member/flat totals and offers floor selection to view that floor's flats. Member and flat directories support instant search and status filters on the currently loaded page (not a global server search), refresh and pagination. Feature routes load on demand to keep the initial bundle smaller.

## JavaScript and Vue patterns

- Axios provides one configured HTTP client, CSRF/session interceptors, promise responses, and cancellable directory/floor requests.
- Vuex owns session state through the namespaced session module; actions restore/login/logout and mutations update state. Shared getters derive sorted floors without mutating the original array.
- Router metadata and an asynchronous beforeEach guard protect workspace routes, preserve the requested destination, and redirect authenticated users away from login. The backend remains responsible for authorization.
- Options API computed properties derive filtered records and 10-item pages. Methods handle events and async operations; created loads page data, beforeUnmount cancels requests and removes listeners, and watchers respond to route changes.
- ES modules, destructuring, spread syntax, template literals, async/await, Promise.all, Object.assign, Object.entries, and array map/filter/find/sort/slice/flatMap are used where needed.
- Session state uses gateway cookies; passwords and session tokens are never persisted in browser storage.

## Accessibility validation status

The source includes labels, fieldset legends, table headers and captions, keyboard focus styles, status regions, and contrast regression checks. Run npm.cmd test and npm.cmd run build for automated source checks. These checks are not a WAVE report or a declaration of WCAG conformance.

To complete WAVE validation, run the official WAVE browser extension on localhost:8083 (the online scanner cannot reach a local authenticated application). Check login, overview, member/flat directories, add/edit forms, and memberships, including empty, error, loading, and pagination states. Review all errors, contrast errors, and alerts; then manually check keyboard operation, focus order, zoom/reflow, and screen reader announcements. A browser connection and authenticated backend session are required to verify the protected screens.

### Overview WAVE report review (20 October 2026)

The supplied screenshot reports 0 errors, 0 contrast errors, 24 very-small-text alerts, 3 redundant-link alerts, and 1 noscript alert. Text sizes now have a 12px minimum across breakpoints; mobile Refresh retains visible text. The sidebar brand no longer duplicates Overview navigation, and the sidebar welcome shortcut is removed. The banner no longer repeats a nearby call to action; building exploration remains on the floors card and member creation remains in Everyday essentials and Create new. Repeated links in separate navigation contexts may still need manual review. The noscript message is intentionally retained so users understand why the application cannot run with JavaScript disabled. These changes require a fresh WAVE scan; the screenshot records the previous state.

## Router protection

All workspace routes declare meta.requiresAuth, while /login uses meta.guestOnly. The global asynchronous beforeEach guard restores the gateway cookie session before allowing access, including when a protected URL is opened directly. Guests are redirected to login with their requested URL preserved; authenticated users are redirected away from login. Redirects are restricted to local paths and checked for encoded external paths and login loops.

Authenticated session checks are cached for up to 60 seconds and revalidated on the next navigation; API 401 responses still trigger immediate session expiry. Nested parent route protection is honored. Reference data is cleared when validation fails or the session expires. Router afterEach updates the page title only after successful navigation.

Run npm.cmd test for integration tests using Vue Router memory history and the real Vuex session module. The backend must still enforce authentication and authorization for every API request.

## Vue Options API playground

Sign in and open **Vue Options API** in the sidebar or footer (/vue-options). Interactive examples use local state only. See [the feature coverage guide](docs/vue-options-api.md) for examples, source locations, version requirements and context-dependent features.
