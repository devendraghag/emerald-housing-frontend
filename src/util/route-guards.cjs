function safeRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  let path;
  try { path = decodeURIComponent(value.split(/[?#]/)[0]); }
  catch { return '/'; }
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') ||
      /[\u0000-\u0020]/.test(path) || /^\/login\/*$/i.test(path)) return '/';
  return value;
}
const { permits } = require('./access.cjs');
function createAuthGuard(store) {
  return async to => {
    // Await cookie-session restoration before resolving protected route components.
    await store.dispatch('session/restore', { force: Boolean(to.meta.permissions || to.meta.allPermissions) });
    const authenticated = store.getters['session/authenticated'];
    const requiresAuth = Boolean(to.meta.requiresAuth) ||
      (to.matched || []).some(record => record.meta.requiresAuth);
    if (requiresAuth && !authenticated) {
      return { name: 'login', query: { redirect: to.fullPath }, replace: true };
    }
    if (requiresAuth && authenticated && !permits(store.state.session.user, to.meta)) return { name: 'access-denied', replace: true };
    if (to.meta.guestOnly && authenticated) return safeRedirect(to.query.redirect);
    return true;
  };
}
module.exports = { safeRedirect, createAuthGuard };
