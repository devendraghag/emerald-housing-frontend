// Factory keeps pending promises private to each store instance.
function createSessionModule(auth, errorMessage, { now = Date.now, maxAge = 60000 } = {}) {
  let checkedAt = null;
  let pending = null;
  let revision = 0;
  return {
    namespaced: true,
    state: () => ({ user: null, initialized: false, checking: false, signingOut: false, error: '' }),
    getters: { authenticated: state => Boolean(state.user) },
    mutations: {
      patch(state, values) { Object.assign(state, values); },
      clear(state) { Object.assign(state, { user: null, initialized: true, checking: false, error: '' }); },
    },
    actions: {
      restore({ state, commit }, { force = false } = {}) {
        if (pending) return pending;
        const fresh = checkedAt !== null && now() - checkedAt < maxAge;
        if (state.initialized && !force && (!state.user || fresh)) return Promise.resolve(state.user);
        const current = revision;
        commit('patch', { checking: !state.user, error: '' });
        pending = Promise.resolve().then(() => auth.current())
          .then(user => {
            if (current === revision) {
              checkedAt = now();
              commit('patch', { user, initialized: true });
            }
            return current === revision ? user : null;
          })
          .catch(error => {
            if (current === revision) {
              checkedAt = null;
              commit('patch', {
                user: null, initialized: true,
                error: (error.response && error.response.status === 401) ? '' : errorMessage(error),
              });
              commit('referenceData', { society: null, floors: [] }, { root: true });
            }
            return null;
          })
          .finally(() => { pending = null; if (current === revision) commit('patch', { checking: false }); });
        return pending;
      },
      async login({ commit }, credentials) {
        const user = await auth.login(credentials.username.trim(), credentials.password);
        revision++;
        checkedAt = now();
        commit('patch', { user, initialized: true, checking: false, error: '' });
        return user;
      },
      async logout({ commit, dispatch }) {
        commit('patch', { signingOut: true, error: '' });
        try { await auth.logout(); await dispatch('expire'); }
        catch (error) { commit('patch', { error: errorMessage(error) }); throw error; }
        finally { commit('patch', { signingOut: false }); }
      },
      expire({ commit }) {
        revision++;
        checkedAt = null;
        commit('clear');
        commit('referenceData', { society: null, floors: [] }, { root: true });
      },
    },
  };
}
module.exports = { createSessionModule };
