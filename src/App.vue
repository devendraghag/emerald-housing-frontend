<template>
 <a class="skip-link" href="#main-content" @click="focusMain">Skip to content</a>
 <div class="app-layout" :class="{'is-guest':!user}">
  <aside v-if="user" class="sidebar" aria-label="Workspace sidebar">
   <div class="brand"><span class="brand-mark"><Icon name="building" :size="26"/></span><span>emerald<span class="brand-subtitle">HOUSING SOCIETY</span></span></div>
   <div class="workspace-card"><span class="workspace-monogram">E</span><div><strong>Emerald Housing</strong><small>Society workspace</small></div><Icon name="shield" :size="17"/></div>
   <span class="nav-label">WORKSPACE</span>
   <nav class="app-nav" aria-label="Main navigation"><router-link v-for="item in navigation" :key="item.path" :to="item.path" active-class="selected" :exact-active-class="item.path==='/'?'selected':undefined"><Icon :name="item.icon"/><span>{{ item.title }}</span></router-link></nav>
   <div class="sidebar-note"><strong>A little more connected.</strong><p>People, homes, and everything that brings them together.</p></div>
   <div class="sidebar-account"><span class="account-avatar">{{ user.username.slice(0,1).toUpperCase() }}</span><div><strong>{{ user.username }}</strong><small>{{ rolesLabel }}</small></div><button class="icon-button" :disabled="signingOut" @click="signOut" :aria-label="signingOut?'Signing out':'Sign out'"><Icon name="logout"/></button></div>
  </aside>
  <div class="workspace-main">
   <header v-if="user" class="topbar"><div class="breadcrumb">Workspace <span>/</span><strong>{{ $route.meta.title }}</strong></div><div class="topbar-actions"><span class="admin-pill" :title="rolesLabel"><Icon name="shield" :size="14"/>{{ rolesLabel }}</span><button class="button button-secondary button-small" :disabled="checkingSession" @click="refreshAccess">Refresh access</button>
    <details v-if="can('MEMBER_CREATE')||can('FLAT_CREATE')||can('OWNER_REGISTER')" class="quick-add" @keydown.esc="closeQuickAddFromKeyboard" @focusout="closeQuickAddOnBlur"><summary class="button button-small"><Icon name="plus" :size="17"/>Create new</summary><div class="quick-add-menu"><router-link v-if="can('MEMBER_CREATE')" to="/members/new" @click="closeQuickAdd"><Icon name="people"/>Add member</router-link><router-link v-if="can('FLAT_CREATE')" to="/flats/new" @click="closeQuickAdd"><Icon name="building"/>Add flat</router-link><router-link v-if="can('OWNER_REGISTER')" to="/owners" @click="closeQuickAdd"><Icon name="home"/>Register owner</router-link></div></details>
   </div></header>
   <header v-else class="guest-header"><router-link to="/" class="brand"><span class="brand-mark"><Icon name="building" :size="26"/></span><span>emerald<span class="brand-subtitle">HOUSING</span></span></router-link><span class="guest-caption">A place for everyone.</span></header>
   <main id="main-content" class="shell main-content" tabindex="-1" ref="main">
    <StatusMessage :message="$store.state.notice"/><StatusMessage :message="sessionError" error/>
    <div v-if="checkingSession" class="session-loading" role="status"><span class="loading-spinner"></span>Getting your workspace ready...</div>
    <div v-else-if="sessionError&&!user" class="connection-panel"><Icon name="refresh" :size="32"/><h1>Let's reconnect.</h1><p>We couldn't reach your workspace. Check your connection and try again.</p><button class="button" @click="checkSession">Try again <Icon name="refresh" :size="16"/></button></div>
    <router-view v-else :key="$route.fullPath+($route.name==='login'?'':'|'+accessKey)" @signed-in="signedIn"/>
   </main>
   <footer class="shell app-footer"><span><span class="footer-dot"></span>Emerald Housing</span><span><router-link v-if="user" to="/vue-options">Vue Options API</router-link><span v-else>Thoughtfully managed. Better together.</span></span></footer>
   <nav v-if="user" class="mobile-nav" aria-label="Mobile navigation"><router-link v-for="item in navigation" :key="item.path" :to="item.path" active-class="selected"><Icon :name="item.icon"/><span>{{ item.title }}</span></router-link><button @click="signOut" :disabled="signingOut"><Icon name="logout"/><span>Sign out</span></button></nav>
  </div>
 </div>
</template>
<script>
import {focusElement,closeDisclosure,closeDisclosureOnBlur} from './util/keyboard.cjs';
import {safeRedirect} from './util/route-guards.cjs';import {permits,identityKey} from './util/access.cjs';import access from './util/access-mixin';
import StatusMessage from './components/StatusMessage.vue';import Icon from './components/Icon.vue';import {mapState} from 'vuex';
export default {
 name:'EmeraldApp',mixins:[access],components:{StatusMessage,Icon},
 computed:{
  ...mapState('session',{user:'user',checkingSession:'checking',signingOut:'signingOut',sessionError:'error'}),
  accessKey(){return identityKey(this.user);},
  rolesLabel(){return this.user&&this.user.roles?this.user.roles.join(', '):'Society account';},
  navigation(){return [
   ['/', 'Overview','grid',true],['/profile','My profile','people',this.user&&this.user.memberId&&this.canRead('MEMBER_VIEW')],
   ['/members','Members','people',this.canRead('MEMBER_VIEW')],['/flats','Flats','building',this.canRead('FLAT_VIEW')],
   ['/family','Family','people',this.canRead('FAMILY_VIEW')],['/owners','Owners & flats','home',this.canRead('MEMBER_VIEW')],
   ['/users','Users','people',this.can('USER_VIEW')],['/roles','Roles','shield',this.can('ROLE_VIEW')],
   ['/permissions','Permissions','layers',this.can('PERMISSION_VIEW')],['/audit','Audit history','clock',this.can('AUDIT_VIEW')]
  ].filter(item=>item[3]).map(([path,title,icon])=>({path,title,icon}));}
 },
 created(){window.addEventListener('emerald-session-expired',this.sessionExpired);},beforeUnmount(){window.removeEventListener('emerald-session-expired',this.sessionExpired);},
 methods:{
  focusMain(){this.$nextTick(()=>focusElement(this.$refs.main));},closeQuickAddFromKeyboard:closeDisclosure,closeQuickAddOnBlur:closeDisclosureOnBlur,
  closeQuickAdd(event){const menu=event.target.closest('details');if(menu)menu.open=false;},
  async checkSession(){const user=await this.$store.dispatch('session/restore',{force:true});if(user&&this.$route.name==='login')await this.signedIn();},
  async refreshAccess(){await this.$store.dispatch('session/restore',{force:true});if(!this.user)await this.$router.replace({name:'login'});else if(!permits(this.user,this.$route.meta))await this.$router.replace({name:'access-denied'});else{await this.$router.replace('/');this.$store.commit('notice','Workspace access refreshed.');}},
  async signedIn(){await this.$router.replace(safeRedirect(this.$route.query.redirect));this.focusMain();},
  async sessionExpired(){if(this.expiring)return;this.expiring=true;try{const redirect=this.$route.fullPath;await this.$store.dispatch('session/expire');await this.$router.replace({name:'login',query:{redirect}});this.$store.commit('notice','Your session expired. Please sign in again.');this.$nextTick(()=>focusElement(document.getElementById('username')));}finally{this.expiring=false;}},
  async signOut(){if(this.signingOut)return;try{await this.$store.dispatch('session/logout');await this.$router.replace({name:'login'});this.$store.commit('notice','');this.$nextTick(()=>focusElement(document.getElementById('username')));}catch{/* Session errors are shown for retry. */}}
 },watch:{$route(){this.$store.commit('notice','');this.focusMain();}}
};
</script>
