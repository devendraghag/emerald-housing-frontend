<template>
  <a class="skip-link" href="#main-content" @click="focusMain">Skip to content</a>
  <div class="app-layout" :class="{ 'is-guest': !user }">
    <aside v-if="user" class="sidebar" aria-label="Workspace sidebar">
      <div class="brand"><span class="brand-mark"><Icon name="building" :size="26" /></span><span>emerald<span class="brand-subtitle">HOUSING SOCIETY</span></span></div>
      <div class="workspace-card"><span class="workspace-monogram">E</span><div><strong>Emerald Housing</strong><small>Society management</small></div><Icon name="shield" :size="17" /></div>
      <span class="nav-label">WORKSPACE</span>
      <nav class="app-nav" aria-label="Main navigation">
        <router-link to="/" exact-active-class="selected"><Icon name="grid" /><span>Overview</span><Icon class="nav-arrow" name="chevron" :size="14" /></router-link>
        <router-link to="/members" active-class="selected"><Icon name="people" /><span>Members</span><Icon class="nav-arrow" name="chevron" :size="14" /></router-link>
        <router-link to="/flats" active-class="selected"><Icon name="building" /><span>Flats</span><Icon class="nav-arrow" name="chevron" :size="14" /></router-link>
        <router-link to="/vue-options" active-class="selected"><Icon name="layers" /><span>Vue Options API</span></router-link>
      </nav>
      <div class="sidebar-note"><strong>A little more connected.</strong><p>People, homes, and everything that brings them together.</p></div>
      <div class="sidebar-account"><span class="account-avatar">{{ user.username.slice(0, 1).toUpperCase() }}</span><div><strong>Administrator</strong><small>Community admin</small></div><button class="icon-button" :disabled="signingOut" @click="signOut" :aria-label="signingOut ? 'Signing out' : 'Sign out'"><Icon name="logout" /></button></div>
    </aside>
    <div class="workspace-main">
      <header v-if="user" class="topbar"><div class="breadcrumb">Workspace <span>/</span><strong>{{ $route.meta.title }}</strong></div><div class="topbar-actions"><span class="admin-pill"><Icon name="shield" :size="14" /> Admin workspace</span><details class="quick-add" @keydown.esc="closeQuickAddFromKeyboard" @focusout="closeQuickAddOnBlur"><summary class="button button-small"><Icon name="plus" :size="17" /> Create new</summary><div class="quick-add-menu"><router-link to="/members/new" @click="closeQuickAdd"><Icon name="people" /> Add member</router-link><router-link to="/flats/new" @click="closeQuickAdd"><Icon name="building" /> Add flat</router-link></div></details></div></header>
      <header v-else class="guest-header"><router-link to="/" class="brand"><span class="brand-mark"><Icon name="building" :size="26" /></span><span>emerald<span class="brand-subtitle">HOUSING</span></span></router-link><span class="guest-caption">A place for everyone.</span></header>
      <main id="main-content" class="shell main-content" tabindex="-1" ref="main">
        <StatusMessage :message="$store.state.notice" /><StatusMessage :message="sessionError" error />
        <div v-if="checkingSession" class="session-loading" role="status"><span class="loading-spinner"></span>Getting your workspace ready...</div>
        <div v-else-if="sessionError && !user" class="connection-panel"><Icon name="refresh" :size="32" /><h1>Let's reconnect.</h1><p>We couldn't reach your workspace. Check your connection and try again.</p><button class="button" @click="checkSession">Try again <Icon name="refresh" :size="16" /></button></div>
        <router-view v-else :key="$route.fullPath" @signed-in="signedIn" />
      </main>
      <footer class="shell app-footer"><span><span class="footer-dot"></span> Emerald Housing</span><span><router-link v-if="user" to="/vue-options">Vue Options API</router-link><span v-else>Thoughtfully managed. Better together.</span></span></footer>
      <nav v-if="user" class="mobile-nav" aria-label="Mobile navigation"><router-link to="/" exact-active-class="selected"><Icon name="grid" /><span>Overview</span></router-link><router-link to="/members" active-class="selected"><Icon name="people" /><span>Members</span></router-link><router-link to="/flats" active-class="selected"><Icon name="building" /><span>Flats</span></router-link><button @click="signOut" :disabled="signingOut"><Icon name="logout" /><span>Sign out</span></button></nav>
    </div>
  </div>
</template>
<script>
import { focusElement, closeDisclosure, closeDisclosureOnBlur } from "./util/keyboard.cjs";
import StatusMessage from "./components/StatusMessage.vue";
import Icon from "./components/Icon.vue";
import { mapState } from "vuex";
import { safeRedirect } from "./util/route-guards.cjs";

export default {
  name: "EmeraldApp",
  components: { StatusMessage, Icon },
  computed: {
    ...mapState('session', { user: 'user', checkingSession: 'checking', signingOut: 'signingOut', sessionError: 'error' }),
  },
  created() {
    window.addEventListener('emerald-session-expired', this.sessionExpired);

  },
  beforeUnmount() { window.removeEventListener('emerald-session-expired', this.sessionExpired); },
  methods: {
    focusMain() { this.$nextTick(() => focusElement(this.$refs.main)); },
    closeQuickAddFromKeyboard: closeDisclosure,
    closeQuickAddOnBlur: closeDisclosureOnBlur,
    closeQuickAdd(event) { const menu = event.target.closest('details'); if (menu) menu.open = false; },
    async checkSession() {
      const user = await this.$store.dispatch('session/restore', { force: true });
      if (user && this.$route.name === 'login') await this.signedIn();
    },
    async signedIn() {
      await this.$router.replace(safeRedirect(this.$route.query.redirect));
      this.focusMain();
    },
    async sessionExpired() {
      const redirect = this.$route.fullPath;
      await this.$store.dispatch('session/expire');
      await this.$router.replace({ name: 'login', query: { redirect } });
      this.$store.commit('notice', 'Your session expired. Please sign in again.');
      this.$nextTick(() => focusElement(document.getElementById('username')));
    },
    async signOut() {
      if (this.signingOut) return;
      try {
        await this.$store.dispatch('session/logout');
        await this.$router.replace({ name: 'login' });
        this.$store.commit('notice', '');
        this.$nextTick(() => focusElement(document.getElementById('username')));
      } catch { /* The store exposes the sign-out error for retry. */ }
    },
  },
  watch: {
    $route() {
      this.$store.commit("notice", "");
      this.focusMain();
    },
  },
};
</script>

