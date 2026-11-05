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
   <header v-if="user" class="topbar"><div class="breadcrumb">Workspace <span>/</span><strong>{{ $route.meta.title }}</strong></div><div class="topbar-actions"><span class="admin-pill" :title="rolesLabel"><Icon name="shield" :size="14"/>{{ rolesLabel }}</span><details v-if="can('LOST_FOUND_BOARD')" class="notification-control"><summary class="button button-secondary button-small" @click="loadNotifications">Notifications <span v-if="unreadNotificationCount" class="notification-badge">{{ unreadNotificationCount }}</span></summary><div class="notification-popover"><p v-if="!notifications.length" class="muted">No notices yet.</p><button v-for="notice in notifications" :key="notice.event_id||notice.eventId" type="button" class="notification-entry" @click="openNotification(notice)"><span>{{ notificationLabel(notice.event_type||notice.eventType) }}</span><small>{{ formatNotificationDate(notice.created_at||notice.createdAt) }}</small><b v-if="!(notice.read_at||notice.readAt)">New</b></button></div></details><button class="button button-secondary button-small" :disabled="checkingSession" @click="refreshAccess">Refresh access</button>
    <details v-if="can('MEMBER_CREATE')||can('FLAT_CREATE')||can('OWNER_REGISTER')" class="quick-add" @keydown.esc="closeQuickAddFromKeyboard" @focusout="closeQuickAddOnBlur"><summary class="button button-small"><Icon name="plus" :size="17"/>Create new</summary><div class="quick-add-menu"><router-link v-if="can('MEMBER_CREATE')" to="/members/new" @click="closeQuickAdd"><Icon name="people"/>Add member</router-link><router-link v-if="can('FLAT_CREATE')" to="/flats/new" @click="closeQuickAdd"><Icon name="building"/>Add flat</router-link><router-link v-if="can('OWNER_REGISTER')" to="/owners" @click="closeQuickAdd"><Icon name="home"/>Register owner</router-link></div></details>
   </div></header>
   <header v-else class="guest-header"><router-link to="/" class="brand"><span class="brand-mark"><Icon name="building" :size="26"/></span><span>emerald<span class="brand-subtitle">HOUSING</span></span></router-link><span class="guest-caption">A place for everyone.</span></header>
   <main id="main-content" class="shell main-content" tabindex="-1" ref="main">
    <StatusMessage :message="$store.state.notice"/><StatusMessage :message="sessionError" error/>
    <div v-if="checkingSession" class="session-loading" role="status"><span class="loading-spinner"></span>Getting your workspace ready...</div>
    <div v-else-if="sessionError&&!user" class="connection-panel"><Icon name="refresh" :size="32"/><h1>Let's reconnect.</h1><p>We couldn't reach your workspace. Check your connection and try again.</p><button class="button" @click="checkSession">Try again <Icon name="refresh" :size="16"/></button></div>
    <router-view v-else :key="$route.fullPath+($route.name==='login'?'':'|'+accessKey)" @signed-in="signedIn"/>
   </main>
   <footer class="shell app-footer"><span><span class="footer-dot"></span>Emerald Housing</span><span>Thoughtfully managed. Better together.</span></footer>
   <nav v-if="user" class="mobile-nav" aria-label="Mobile navigation"><router-link v-for="item in navigation" :key="item.path" :to="item.path" active-class="selected"><Icon :name="item.icon"/><span>{{ item.title }}</span></router-link><button @click="signOut" :disabled="signingOut"><Icon name="logout"/><span>Sign out</span></button></nav>
  </div>
 </div>
</template>
<script>
import {focusElement,closeDisclosure,closeDisclosureOnBlur} from './util/keyboard.cjs';
import {safeRedirect} from './util/route-guards.cjs';import {permits,identityKey} from './util/access.cjs';import access from './util/access-mixin';
import StatusMessage from './components/StatusMessage.vue';import Icon from './components/Icon.vue';import {mapState} from 'vuex';import {api} from './services/api';
export default {
 name:'EmeraldApp',mixins:[access],components:{StatusMessage,Icon},
 data(){return {notifications:[]};},
 computed:{
  ...mapState('session',{user:'user',checkingSession:'checking',signingOut:'signingOut',sessionError:'error'}),
  unreadNotificationCount(){return this.notifications.filter(n=>!(n.read_at||n.readAt)).length;},
  accessKey(){return identityKey(this.user);},
  rolesLabel(){return this.user&&this.user.roles?this.user.roles.join(', '):'Society account';},
  navigation(){return [
   ['/', 'Overview','grid',true],['/profile','My profile','people',this.user&&this.user.memberId&&this.canRead('MEMBER_VIEW')],
   ['/members','Members','people',this.canRead('MEMBER_VIEW')],['/flats','Flats','building',this.canRead('FLAT_VIEW')],
   ['/family','Family','people',this.canRead('FAMILY_VIEW')],['/owners','Owners & flats','home',this.canRead('MEMBER_VIEW')],['/building','Society & floors','layers',this.can('SOCIETY_VIEW')],['/notices','Notices','clock',['LOST_FOUND_BOARD','LOST_FOUND_REPORT','LOST_FOUND_ADMIN'].some(p=>this.can(p))],['/account-security','Account security','shield',true],['/assistant','Housing assistant','clock',true],['/rental','Rent & operations','home',['RENT_VIEW','RENT_MANAGE','MAINTENANCE_VIEW','MAINTENANCE_CREATE','LEASE_VIEW','LEASE_MANAGE','VIEWING_VIEW','VIEWING_BOOK','VIEWING_MANAGE'].some(p=>this.can(p)||this.can(p,'OWN_FLATS'))],
   ['/users','Users','people',this.can('USER_VIEW')],['/roles','Roles','shield',this.can('ROLE_VIEW')],
   ['/permissions','Permissions','layers',this.can('PERMISSION_VIEW')],['/audit','Audit history','clock',this.can('AUDIT_VIEW')]
  ].filter(item=>item[3]).map(([path,title,icon])=>({path,title,icon}));}
 },
 created(){window.addEventListener('emerald-session-expired',this.sessionExpired);document.addEventListener('visibilitychange',this.notificationVisibilityChanged);this.syncNotificationPolling();},beforeUnmount(){this.stopNotificationPolling();document.removeEventListener('visibilitychange',this.notificationVisibilityChanged);window.removeEventListener('emerald-session-expired',this.sessionExpired);},
 methods:{
  async loadNotifications(){if(!this.user||!this.can('LOST_FOUND_BOARD')){this.notifications=[];return;}try{const [lost,community]=await Promise.all([api.lostFoundNotifications(),api.noticeNotifications()]);this.notifications=[...lost.map(n=>({...n,noticeKind:'LOST_FOUND'})),...community.map(n=>({...n,noticeKind:'COMMUNITY'}))].sort((a,b)=>new Date(b.created_at||b.createdAt)-new Date(a.created_at||a.createdAt));}catch{this.notifications=[];}},
  stopNotificationPolling(){if(this.notificationTimer){window.clearInterval(this.notificationTimer);this.notificationTimer=null;}},
  syncNotificationPolling(){this.stopNotificationPolling();if(!this.user||!this.can('LOST_FOUND_BOARD')||document.hidden)return;this.notificationTimer=window.setInterval(()=>this.loadNotifications(),30000);},
  notificationVisibilityChanged(){if(document.hidden)this.stopNotificationPolling();else{this.syncNotificationPolling();this.loadNotifications();}},
  notificationLabel(type){return ({LostFoundReportPublished:'A Lost & Found notice was published',LostFoundClaimSubmitted:'A claim was submitted',LostFoundReportResolved:'A report was resolved',CommunityNoticePublished:'A community notice was published'})[type]||'Community notice';},
  formatNotificationDate(value){if(!value)return '';const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleString();},
  async openNotification(notice){const eventId=notice.event_id||notice.eventId;const reportId=notice.report_id||notice.reportId||notice.notice_id||notice.noticeId;if(eventId){try{if(notice.noticeKind==='COMMUNITY')await api.markNoticeNotificationRead(eventId);else await api.markLostFoundNotificationRead(eventId);}catch{}}await this.loadNotifications();if(this.$route.path!=='/')await this.$router.push('/');this.$nextTick(()=>window.dispatchEvent(new CustomEvent('emerald-notice-focus',{detail:{reportId}})));},
  focusMain(){this.$nextTick(()=>focusElement(this.$refs.main));},closeQuickAddFromKeyboard:closeDisclosure,closeQuickAddOnBlur:closeDisclosureOnBlur,
  closeQuickAdd(event){const menu=event.target.closest('details');if(menu)menu.open=false;},
  async checkSession(){const user=await this.$store.dispatch('session/restore',{force:true});if(user&&this.$route.name==='login')await this.signedIn();},
  async refreshAccess(){await this.$store.dispatch('session/restore',{force:true});if(!this.user)await this.$router.replace({name:'login'});else if(!permits(this.user,this.$route.meta))await this.$router.replace({name:'access-denied'});else{await this.$router.replace('/');this.$store.commit('notice','Workspace access refreshed.');}},
  async signedIn(){await this.$router.replace(safeRedirect(this.$route.query.redirect));this.focusMain();},
  async sessionExpired(){if(this.expiring)return;this.expiring=true;try{const redirect=this.$route.fullPath;await this.$store.dispatch('session/expire');await this.$router.replace({name:'login',query:{redirect}});this.$store.commit('notice','Your session expired. Please sign in again.');this.$nextTick(()=>focusElement(document.getElementById('username')));}finally{this.expiring=false;}},
  async signOut(){if(this.signingOut)return;try{await this.$store.dispatch('session/logout');await this.$router.replace({name:'login'});this.$store.commit('notice','');this.$nextTick(()=>focusElement(document.getElementById('username')));}catch{/* Session errors are shown for retry. */}}
 },watch:{user(value){if(value)this.loadNotifications();else this.notifications=[];this.syncNotificationPolling();},$route(){this.$store.commit('notice','');this.focusMain();}}
};
</script>
<style scoped>
.notification-control{position:relative}.notification-control>summary{list-style:none;cursor:pointer}.notification-control>summary::-webkit-details-marker{display:none}.notification-badge{display:inline-grid;place-items:center;min-width:19px;height:19px;margin-left:5px;border-radius:50%;background:#b34f43;color:#fff;font-size:11px}.notification-popover{position:absolute;z-index:20;right:0;top:calc(100% + 8px);width:min(340px,90vw);max-height:360px;overflow:auto;padding:10px;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 34px #1e35201f}.notification-entry{display:grid;width:100%;gap:4px;padding:10px;text-align:left;background:transparent;border:0;border-bottom:1px solid var(--line);cursor:pointer}.notification-entry:hover{background:#f4f7f4}.notification-entry small{color:var(--muted)}.notification-entry b{color:#176b50;font-size:11px}
@media(max-width:700px){.notification-popover{right:auto;left:0;width:min(340px,calc(100vw - 32px))}}
</style>
