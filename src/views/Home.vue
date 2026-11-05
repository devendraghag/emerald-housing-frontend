<template>
 <div class="overview-page">
  <header class="overview-intro">
   <div class="overview-intro-copy">
    <span class="page-kicker">EMERALD HOUSING · OVERVIEW</span>
    <h1 class="page-title">Welcome home<span class="title-dot">.</span></h1>
    <p class="lead">A clear view of your community, your home, and what needs your attention.</p>
    <div class="overview-date"><Icon name="clock" :size="15"/>{{ todayLabel }}<span class="overview-date-dot"></span><span>{{ can('SOCIETY_VIEW')?'Society workspace':'Your flat community' }}</span></div>
   </div>
   <button class="button button-secondary refresh-button overview-refresh" :disabled="loading" @click="load"><Icon name="refresh" :class="{spinning:loading}" :size="16"/>{{ loading?'Refreshing':'Refresh overview' }}</button>
  </header>

  <p class="sr-only" role="status" aria-atomic="true">{{ loading?'Refreshing overview...':refreshedAt?'Overview updated.':'' }}</p>
  <StatusMessage :message="error" error retry @retry="load"/>

  <section class="overview-hero">
   <div class="overview-hero-copy">
    <span class="overview-hero-eyebrow"><span></span> A LITTLE MORE CONNECTED</span>
    <h2>Your community,<br/><em>all in one place.</em></h2>
    <p>Stay close to the updates and everyday details that make Emerald feel like home.</p>
    <div class="overview-hero-actions">
     <router-link v-if="can('LOST_FOUND_BOARD')" to="/notices" class="button button-light">Explore notices <Icon name="arrow" :size="16"/></router-link>
     <a v-if="can('SOCIETY_VIEW')" href="#floor-explorer" class="overview-hero-link">Explore the building <Icon name="arrow" :size="15"/></a>
    </div>
   </div>
   <div class="overview-hero-art" aria-hidden="true">
    <div class="overview-orbit overview-orbit-one"></div><div class="overview-orbit overview-orbit-two"></div>
    <div class="overview-building-art"><div class="overview-building-roof"></div><div class="overview-building-windows"><i v-for="n in 12" :key="n"></i></div><div class="overview-building-door"></div></div>
    <div class="overview-art-label"><span></span> Better together</div>
    <div class="overview-art-note"><Icon name="home" :size="17"/><span><strong>{{ can('SOCIETY_VIEW')?$store.state.floors.length:'Your home' }}</strong><small>{{ can('SOCIETY_VIEW')?'floors in your community':'connected to Emerald' }}</small></span></div>
   </div>
  </section>

  <section v-if="can('LOST_FOUND_BOARD')" class="overview-notices panel">
   <div class="overview-section-heading">
    <div class="overview-notice-intro"><span class="overview-board-mark"><Icon name="layers" :size="20"/></span><div><span class="page-kicker">FOR YOUR FLAT</span><h2 class="section-title">Notice board</h2><p class="muted">Updates shared with members of your active flats.</p></div></div>
    <div class="overview-section-actions"><span class="overview-notice-total">{{ notices.length }} {{ notices.length===1?'notice':'notices' }}</span><router-link to="/notices" class="button button-secondary button-small">View all <Icon name="arrow" :size="14"/></router-link></div>
   </div>
   <StatusMessage :message="noticeError" error/>
   <div v-if="noticeLoading" class="overview-loading"><span class="loading-spinner"></span>Loading notices…</div>
   <div v-else-if="!notices.length" class="overview-empty"><span class="overview-empty-icon"><Icon name="layers" :size="23"/></span><div><strong>Nothing new on your board</strong><p>Published notices for your flats will appear here.</p></div><router-link v-if="can('LOST_FOUND_REPORT')" to="/notices" class="link-button">Report an item</router-link></div>
   <div v-else class="overview-notice-list">
    <article v-for="notice in notices" :id="'notice-'+notice.id" :key="notice.id" class="overview-notice-card" tabindex="-1">
     <div class="overview-notice-main">
      <div class="overview-notice-heading"><span class="overview-notice-kind" :class="notice.reportType==='FOUND'?'is-found':'is-lost'"><Icon :name="notice.reportType==='FOUND'?'check':'search'" :size="14"/>{{ notice.reportType==='FOUND'?'Found item':'Lost item' }}</span><span class="status">{{ noticeStatus(notice.status) }}</span></div>
      <div class="notice-seen-row"><span class="notice-seen-badge" :class="{'is-unseen':!isNoticeSeen(notice)}">{{ isNoticeSeen(notice)?'Seen':'Not seen yet' }}</span><button v-if="!isNoticeSeen(notice)" class="notice-seen-action" type="button" @click="markNoticeSeen(notice)">Mark seen</button></div>
      <h3>{{ notice.itemType==='OTHER'?notice.itemOther:notice.itemType }}</h3>
      <p class="overview-notice-description">{{ notice.description }}</p>
      <div class="overview-notice-meta"><span><Icon name="home" :size="14"/>{{ notice.location }}</span><span><Icon name="clock" :size="14"/>{{ formatNoticeDate(notice.occurredAt) }}</span></div>
     </div>
     <img v-if="notice.noticeKind!=='COMMUNITY'&&notice.photoUrl" class="overview-notice-photo" :src="notice.photoUrl" alt="Photo attached to notice" loading="lazy">
     <form v-if="notice.noticeKind!=='COMMUNITY'&&can('LOST_FOUND_REPORT')&&['PUBLISHED','CLAIM_RECEIVED'].includes(notice.status)" class="overview-claim-form" @submit.prevent="claimNotice(notice)">
      <label class="field">Think this could be yours? Add a detail only the owner would know.<textarea v-model="claimText[notice.id]" class="text-input" maxlength="2000" rows="2" required></textarea></label>
      <button class="button button-small" :disabled="claimingNotice===notice.id">{{ claimingNotice===notice.id?'Sending…':'Submit a claim' }}</button>
     </form>
    </article>
   </div>
  </section>

  <section class="overview-stats" :aria-busy="loading" aria-label="Community summary">
   <router-link v-if="canRead('MEMBER_VIEW')" to="/members" class="overview-stat-card"><span class="overview-stat-icon stat-plum"><Icon name="people" :size="21"/></span><span class="overview-stat-label">{{ can('MEMBER_VIEW')?'Community members':'My registered record' }}</span><strong>{{ memberTotal===null?'—':memberTotal }}</strong><span class="overview-stat-foot">People in your permitted directory<Icon name="arrow" :size="14"/></span></router-link>
   <router-link v-if="canRead('FLAT_VIEW')" to="/flats" class="overview-stat-card"><span class="overview-stat-icon stat-peach"><Icon name="building" :size="21"/></span><span class="overview-stat-label">{{ can('FLAT_VIEW')?'Registered flats':'My permitted flats' }}</span><strong>{{ flatTotal===null?'—':flatTotal }}</strong><span class="overview-stat-foot">Homes in your permitted directory<Icon name="arrow" :size="14"/></span></router-link>
   <a v-if="can('SOCIETY_VIEW')" href="#floor-explorer" class="overview-stat-card"><span class="overview-stat-icon stat-green"><Icon name="layers" :size="21"/></span><span class="overview-stat-label">Society floors</span><strong>{{ loading&&!$store.state.floors.length?'—':$store.state.floors.length }}</strong><span class="overview-stat-foot">Explore your building<Icon name="arrow" :size="14"/></span></a>
  </section>

  <div class="overview-workspace-grid" :class="{ 'is-personal': !can('SOCIETY_VIEW') }">
   <section v-if="can('SOCIETY_VIEW')" class="overview-building panel" id="floor-explorer">
    <div class="overview-section-heading"><div><span class="page-kicker">GET TO KNOW YOUR SPACE</span><h2 class="section-title">Explore your building</h2><p class="muted">Choose a floor to view its permitted flats.</p></div><span class="overview-floor-count"><strong>{{ $store.state.floors.length }}</strong><small>floors</small></span></div>
    <div v-if="$store.state.society" class="overview-society"><span class="overview-society-icon"><Icon name="building" :size="21"/></span><div><strong>{{ $store.state.society.societyName }}</strong><small>Emerald Housing Society</small></div><Icon name="check" :size="17"/></div>
    <div class="floor-list"><button v-for="floor in pagedFloors" :key="floor.floorNumber" :disabled="!canRead('FLAT_VIEW')" :class="{selected:selectedFloor===floor.floorNumber}" :aria-pressed="selectedFloor===floor.floorNumber" @click="selectFloor(floor.floorNumber)"><span>FLOOR</span>{{ String(floor.floorNumber).padStart(2,'0') }}</button></div>
    <Pagination :page="floorPage" :pages="floorPages" label="Floors pagination" @change="floorPage=$event"/>
    <div v-if="selectedFloor!==null" class="floor-results" aria-live="polite"><div class="section-heading"><strong>Floor {{ selectedFloor }}</strong><router-link to="/flats">View directory<Icon name="arrow" :size="14"/></router-link></div><p v-if="floorLoading" class="body-text">Finding flats...</p><StatusMessage v-else-if="floorError" :message="floorError" error retry @retry="selectFloor(selectedFloor)"/><div v-else-if="floorFlats.length" class="flat-chips"><router-link v-for="flat in pagedFloorFlats" :key="flat.flatId" :to="'/flats/'+flat.flatId"><Icon name="home" :size="16"/>{{ flat.flatNumber }}</router-link></div><p v-else class="body-text">No permitted flats on this floor.</p><Pagination :page="flatPage" :pages="flatPages" :disabled="floorLoading" label="Floor flats pagination" @change="flatPage=$event"/></div>
   </section>

   <section class="overview-quick-actions panel"><span class="page-kicker">MAKE YOURSELF AT HOME</span><h2 class="section-title">Everyday essentials</h2><p class="muted">The things you need to manage home and community.</p>
    <router-link v-if="can('LOST_FOUND_BOARD')" to="/notices" class="overview-action"><span class="overview-action-icon action-green"><Icon name="layers" :size="18"/></span><span><strong>Community notices</strong><small>See updates and report an item</small></span><Icon name="chevron" :size="16"/></router-link>
    <router-link v-if="can('MEMBER_CREATE')" to="/members/new" class="overview-action"><span class="overview-action-icon action-plum"><Icon name="people" :size="18"/></span><span><strong>Add a member</strong><small>Register someone in the community</small></span><Icon name="chevron" :size="16"/></router-link>
    <router-link v-if="can('FLAT_CREATE')" to="/flats/new" class="overview-action"><span class="overview-action-icon action-peach"><Icon name="building" :size="18"/></span><span><strong>Register a flat</strong><small>Add a home to the directory</small></span><Icon name="chevron" :size="16"/></router-link>
    <router-link v-if="canRead('FAMILY_VIEW')" to="/family" class="overview-action"><span class="overview-action-icon action-blue"><Icon name="people" :size="18"/></span><span><strong>Family details</strong><small>View permitted family records</small></span><Icon name="chevron" :size="16"/></router-link>
    <router-link v-if="canRead('MEMBER_VIEW')" to="/owners" class="overview-action"><span class="overview-action-icon action-gold"><Icon name="home" :size="18"/></span><span><strong>Owners &amp; flats</strong><small>Ownership and history</small></span><Icon name="chevron" :size="16"/></router-link>
    <div v-if="refreshedAt" class="overview-updated"><Icon name="clock" :size="13"/> Updated {{ refreshedAt }}</div>
   </section>
  </div>
 </div>
</template>
<script>
import access from '../util/access-mixin';import Pagination from '../components/Pagination.vue';import {pageItems,pageCount} from '../util/pagination.cjs';import Icon from '../components/Icon.vue';import StatusMessage from '../components/StatusMessage.vue';import {api,errorMessage} from '../services/api';
export default {
 mixins:[access],components:{Icon,StatusMessage,Pagination},data:()=>({loading:false,error:'',memberTotal:null,flatTotal:null,refreshedAt:'',todayLabel:new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date()),selectedFloor:null,floorFlats:[],floorLoading:false,floorError:'',floorRequest:0,floorPage:0,flatPage:0,notices:[],noticeNotifications:[],lostFoundNotifications:[],locallySeenNoticeKeys:[],noticeLoading:false,noticeError:'',claimText:{},claimingNotice:null}),
 computed:{floorPages(){return pageCount(this.$store.state.floors.length);},pagedFloors(){return pageItems(this.$store.getters.sortedFloors,this.floorPage);},flatPages(){return pageCount(this.floorFlats.length);},pagedFloorFlats(){return pageItems(this.floorFlats,this.flatPage);}},
 created(){this.load();if(this.can('LOST_FOUND_BOARD'))this.loadNotices();},mounted(){window.addEventListener('emerald-notice-focus',this.focusNoticeFromNotification);},beforeUnmount(){if(this.floorController)this.floorController.abort();this.floorRequest++;window.removeEventListener('emerald-notice-focus',this.focusNoticeFromNotification);},
 methods:{
  async loadNotices(){this.noticeLoading=true;try{const [community,lostFound,communityEvents,lostFoundEvents]=await Promise.all([api.noticeBoard(),api.lostFoundBoard(),api.noticeNotifications(),api.lostFoundNotifications()]);this.noticeNotifications=communityEvents;this.lostFoundNotifications=lostFoundEvents;this.notices=[...community.map(n=>({...n,noticeKind:'COMMUNITY'})),...lostFound.map(n=>({...n,noticeKind:'LOST_FOUND'}))].sort((a,b)=>new Date(b.createdAt||b.occurredAt)-new Date(a.createdAt||a.occurredAt));}catch(e){this.noticeError=errorMessage(e);}finally{this.noticeLoading=false;}},
  noticeEvents(notice){const community=notice.noticeKind==='COMMUNITY';const rows=community?this.noticeNotifications:this.lostFoundNotifications;return rows.filter(event=>String(event[community?'notice_id':'report_id']||event[community?'noticeId':'reportId'])===String(notice.id)&&String(event.event_type||event.eventType)===(community?'CommunityNoticePublished':'LostFoundReportPublished'));},
  isNoticeSeen(notice){const key=notice.noticeKind+':'+notice.id;const events=this.noticeEvents(notice);return this.locallySeenNoticeKeys.includes(key)||(events.length>0&&events.every(event=>event.read_at||event.readAt));},
  async markNoticeSeen(notice){const community=notice.noticeKind==='COMMUNITY';const events=this.noticeEvents(notice);try{await Promise.all(events.filter(event=>!(event.read_at||event.readAt)).map(event=>community?api.markNoticeNotificationRead(event.event_id||event.eventId):api.markLostFoundNotificationRead(event.event_id||event.eventId)));}catch(e){this.noticeError=errorMessage(e);return;}const key=notice.noticeKind+':'+notice.id;this.locallySeenNoticeKeys=[...new Set([...this.locallySeenNoticeKeys,key])];const stamp=new Date().toISOString();const rows=community?this.noticeNotifications:this.lostFoundNotifications;for(const event of events){event.read_at=event.read_at||stamp;}},
  formatNoticeDate(value){if(!value)return '';const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleString();},
  noticeStatus(status){return ({PUBLISHED:'Published',CLAIM_RECEIVED:'Claim received',RESOLVED:'Resolved',CLOSED_UNCLAIMED:'Closed',CLOSED:'Closed',EXPIRED:'Expired'})[status]||status;},
  focusNoticeFromNotification(event){const id=event.detail&&event.detail.reportId;this.$nextTick(()=>{const el=document.getElementById('notice-'+id);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.focus({preventScroll:true});}});},
  async claimNotice(notice){this.claimingNotice=notice.id;try{await api.submitLostFoundClaim(notice.id,(this.claimText[notice.id]||'').trim());this.claimText={...this.claimText,[notice.id]:''};await this.loadNotices();this.$store.commit('notice','Your claim was sent to the society office.');}catch(e){this.noticeError=errorMessage(e);}finally{this.claimingNotice=null;}},
  async load(){this.loading=true;this.error='';try{const [,members,flats]=await Promise.all([this.can('SOCIETY_VIEW')?this.$store.dispatch('loadReferenceData'):Promise.resolve(),this.canRead('MEMBER_VIEW')?api.page('members'):Promise.resolve(null),this.canRead('FLAT_VIEW')?api.page('flats'):Promise.resolve(null)]);this.memberTotal=members?members.totalElements:null;this.flatTotal=flats?flats.totalElements:null;this.refreshedAt=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});if(this.selectedFloor!==null)await this.selectFloor(this.selectedFloor);}catch(e){this.error=errorMessage(e);}finally{this.loading=false;}},
  async selectFloor(number){if(this.floorController)this.floorController.abort();this.floorController=new AbortController();const request=++this.floorRequest;this.flatPage=0;this.selectedFloor=number;this.floorLoading=true;this.floorError='';this.floorFlats=[];try{const data=await api.flatsByFloor(number,{signal:this.floorController.signal});if(request===this.floorRequest)this.floorFlats=data;}catch(e){if(e.code!=='ERR_CANCELED'&&request===this.floorRequest)this.floorError=errorMessage(e);}finally{if(request===this.floorRequest)this.floorLoading=false;}}
 }
};
</script>
<style scoped>
.overview-page{display:grid;gap:24px}.overview-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:2px 0 1px}.overview-intro .page-kicker{margin-bottom:10px}.overview-intro .page-title{margin-bottom:7px}.overview-intro .lead{font-size:14px}.overview-date{display:flex;align-items:center;gap:8px;margin-top:18px;color:var(--muted);font-size:12px}.overview-date svg{color:var(--primary)}.overview-date-dot{width:4px;height:4px;margin:0 3px;border-radius:50%;background:#aab8a9}.overview-refresh{flex-shrink:0}
.overview-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 340px;min-height:255px;overflow:hidden;border-radius:20px;background:linear-gradient(112deg,#123f33 0%,#1b5a43 56%,#286c4e 100%);color:#fff}.overview-hero-copy{position:relative;z-index:2;align-self:center;padding:36px 42px}.overview-hero-eyebrow{display:flex;align-items:center;gap:9px;color:#cfe1cd;font-size:11px;font-weight:700;letter-spacing:1.6px}.overview-hero-eyebrow>span{width:7px;height:7px;border-radius:50%;background:#bed992;box-shadow:0 0 0 5px #bed99220}.overview-hero-copy h2{margin:17px 0 11px;color:#f8fbf4;font-size:clamp(28px,3vw,40px);font-weight:560;line-height:1.12;letter-spacing:-1.4px}.overview-hero-copy h2 em{color:#d0e0b3;font-family:Georgia,serif;font-weight:400}.overview-hero-copy>p{max-width:430px;margin:0;color:#d1e0d4;font-size:13px;line-height:1.7}.overview-hero-actions{display:flex;align-items:center;gap:22px;margin-top:23px}.overview-hero-actions .button{min-height:40px}.overview-hero-link{display:inline-flex;align-items:center;gap:8px;color:#e2eddf;font-size:12px;font-weight:600;text-decoration:none}.overview-hero-link:hover{color:white}.overview-hero-art{position:relative;min-height:255px;overflow:hidden}.overview-orbit{position:absolute;border:1px solid #e3f0df20;border-radius:50%}.overview-orbit-one{width:275px;height:275px;top:8px;left:37px}.overview-orbit-two{width:210px;height:210px;top:40px;left:69px}.overview-building-art{position:absolute;bottom:0;left:115px;width:130px;height:156px;padding:22px 20px 0;background:#d6e2c5;box-shadow:20px 5px 0 #789d7d;transform:skewY(-5deg);border-radius:8px 8px 0 0}.overview-building-roof{position:absolute;top:-15px;left:-7px;width:144px;height:18px;border-radius:6px;background:#eef0d9;transform:skewY(5deg)}.overview-building-windows{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 10px}.overview-building-windows i{height:18px;border-radius:3px;background:#467354}.overview-building-door{position:absolute;bottom:0;left:53px;width:27px;height:44px;border-radius:4px 4px 0 0;background:#7b9b74}.overview-art-label,.overview-art-note{position:absolute;z-index:2;display:flex;align-items:center;gap:9px;border:1px solid #ffffff30;border-radius:12px;background:#ffffff18;backdrop-filter:blur(8px);box-shadow:0 12px 25px #102c2218}.overview-art-label{top:43px;left:20px;padding:9px 12px;color:#f1f7e9;font-size:11px}.overview-art-label>span{width:6px;height:6px;border-radius:50%;background:#d5e8b9}.overview-art-note{right:6px;bottom:23px;padding:10px 13px;color:#e3efda}.overview-art-note>span{display:grid;gap:2px}.overview-art-note strong{font-size:12px}.overview-art-note small{color:#d0dfd2;font-size:10px}
.overview-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.overview-stat-card{position:relative;display:grid;min-height:154px;padding:18px 20px 15px;border:1px solid var(--border);border-radius:16px;background:#fff;color:var(--ink);text-decoration:none;transition:transform .18s,box-shadow .18s,border-color .18s}.overview-stat-card:hover{transform:translateY(-2px);border-color:#c8d9c8;box-shadow:0 10px 25px #1d44340b}.overview-stat-icon{display:grid;width:39px;height:39px;place-items:center;border-radius:12px}.stat-plum{background:#f0e9f2;color:#70527b}.stat-peach{background:#fbf0e3;color:#976124}.stat-green{background:#e9f2e6;color:#3c7045}.overview-stat-label{position:absolute;top:24px;left:70px;padding-right:13px;color:var(--muted);font-size:12px}.overview-stat-card>strong{align-self:end;margin-top:14px;font-size:34px;font-weight:600;letter-spacing:-1.2px;line-height:1.1}.overview-stat-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:13px;padding-top:11px;border-top:1px solid #edf1ed;color:var(--muted);font-size:11px}.overview-stat-foot svg{color:var(--primary)}
.overview-notices,.overview-building,.overview-quick-actions{padding:23px;border:1px solid var(--border);border-radius:18px;background:#fff;box-shadow:0 8px 28px #23453106}.overview-notices{display:grid;gap:18px}.overview-section-heading{display:flex;align-items:center;justify-content:space-between;gap:18px}.overview-section-heading .page-kicker{margin-bottom:7px}.overview-section-heading .section-title{margin:0 0 5px;font-size:20px}.overview-section-heading .muted{margin:0}.overview-section-actions{display:flex;align-items:center;gap:12px}.overview-section-actions .button{white-space:nowrap}.overview-notice-total{padding:6px 10px;border-radius:999px;background:#f0f5ec;color:#426346;font-size:11px;font-weight:700}.overview-notice-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:14px}.overview-notice-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:17px;border:1px solid #e7ece5;border-radius:15px;background:linear-gradient(145deg,#fff,#fbfcf9);scroll-margin:100px;transition:border-color .18s,box-shadow .18s}.overview-notice-card:hover{border-color:#cbdcc8;box-shadow:0 8px 18px #2446300a}.overview-notice-card:focus{outline:3px solid var(--focus-ring)}.overview-notice-main{min-width:0}.overview-notice-heading{display:flex;justify-content:space-between;align-items:center;gap:9px}.overview-notice-kind{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:750;letter-spacing:.2px}.overview-notice-kind.is-found{background:#e9f3e8;color:#286541}.overview-notice-kind.is-lost{background:#f8ece7;color:#984d3e}.overview-notice-card h3{margin:13px 0 6px;font-size:17px;font-weight:650;letter-spacing:-.25px}.overview-notice-description{margin:0;color:var(--muted);font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}.overview-notice-meta{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:15px;color:#63766a;font-size:11px}.overview-notice-meta span{display:inline-flex;align-items:center;gap:6px}.overview-notice-meta svg{color:#6d9271}.overview-notice-photo{grid-column:2;grid-row:1/4;width:108px;height:108px;object-fit:cover;border-radius:12px;background:#f0f3ed}.overview-claim-form{grid-column:1/-1;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding-top:13px;border-top:1px solid #e9eee7}.overview-claim-form .field{display:grid;flex:1;gap:7px;color:var(--ink);font-size:11px;font-weight:650;line-height:1.45}.overview-claim-form .text-input{min-height:72px}.overview-claim-form .button{flex-shrink:0}.overview-empty{display:flex;align-items:center;gap:13px;padding:19px;border:1px dashed #d5e1d2;border-radius:14px;background:#fafcf8}.overview-empty-icon{display:grid;width:43px;height:43px;place-items:center;border-radius:13px;background:#eaf2e7;color:#4e774d}.overview-empty>div{flex:1}.overview-empty strong{font-size:13px}.overview-empty p{margin:4px 0 0;color:var(--muted);font-size:11px}.overview-loading{display:flex;align-items:center;gap:10px;min-height:72px;color:var(--muted);font-size:12px}
.overview-workspace-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,.8fr);gap:18px;align-items:start}.overview-building,.overview-quick-actions{min-width:0}.overview-floor-count{display:grid;min-width:52px;min-height:52px;place-content:center;text-align:center;border-radius:15px;background:#edf4e8;color:#315d38}.overview-floor-count strong{font-size:19px;line-height:1}.overview-floor-count small{margin-top:3px;font-size:10px}.overview-society{display:flex;align-items:center;gap:11px;margin:18px 0;padding:13px;border-radius:13px;background:#f6f8f3}.overview-society-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:11px;background:#e5efe1;color:#376943}.overview-society>div{display:grid;flex:1;gap:3px}.overview-society strong{font-size:12px}.overview-society small{color:var(--muted);font-size:10px}.overview-society>svg{color:#58835a}.overview-building .floor-list{margin-top:20px}.overview-quick-actions>.section-title{margin:0 0 5px;font-size:20px}.overview-quick-actions>.muted{margin:0 0 13px;font-size:11px;line-height:1.5}.overview-action{display:flex;align-items:center;gap:11px;min-height:66px;padding:9px 4px;border-bottom:1px solid #edf0eb;color:var(--ink);text-decoration:none}.overview-action:last-of-type{border-bottom:0}.overview-action:hover{padding-inline:9px;border-radius:11px;background:#f8faf6}.overview-action>span:nth-child(2){display:grid;flex:1;gap:4px}.overview-action strong{font-size:12px;font-weight:650}.overview-action small{color:var(--muted);font-size:10px}.overview-action>svg{color:#849387}.overview-action-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:12px}.action-green{background:#eaf2e7;color:#3f7046}.action-plum{background:#f0eaf2;color:#745780}.action-peach{background:#fbf0e4;color:#986327}.action-blue{background:#e9f1f6;color:#476b81}.action-gold{background:#f7f1dd;color:#8b702d}.overview-updated{display:flex;align-items:center;gap:6px;margin-top:13px;padding-top:12px;border-top:1px solid #edf0eb;color:var(--muted);font-size:10px}.overview-updated svg{color:#66876b}
@media(max-width:980px){.overview-hero{grid-template-columns:1fr;min-height:0}.overview-hero-copy{padding:30px 36px 18px}.overview-hero-art{min-height:205px}.overview-building-art{left:calc(50% - 65px)}.overview-orbit-one{left:calc(50% - 137px)}.overview-orbit-two{left:calc(50% - 105px)}.overview-art-label{left:calc(50% - 150px)}.overview-art-note{right:calc(50% - 150px)}.overview-workspace-grid{grid-template-columns:1fr}.overview-quick-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px}.overview-quick-actions>.page-kicker,.overview-quick-actions>.section-title,.overview-quick-actions>.muted,.overview-updated{grid-column:1/-1}.overview-quick-actions>.overview-action{border-bottom:1px solid #edf0eb}}
@media(max-width:700px){.overview-page{gap:18px}.overview-intro{align-items:flex-start}.overview-intro .lead{max-width:480px}.overview-hero{grid-template-columns:minmax(0,1fr) 210px;min-height:230px}.overview-hero-copy{padding:28px 25px}.overview-hero-art{min-height:230px}.overview-building-art{left:65px;transform:scale(.9) skewY(-5deg);transform-origin:bottom left}.overview-orbit-one{left:3px}.overview-orbit-two{left:35px}.overview-art-label{left:4px}.overview-art-note{right:2px}.overview-stats{gap:10px}.overview-stat-card{min-height:140px;padding:15px}.overview-stat-label{top:20px;left:62px;font-size:11px}.overview-stat-card>strong{font-size:30px}.overview-stat-foot{font-size:10px}}
@media(max-width:540px){.overview-intro{display:grid;gap:14px}.overview-intro .page-title{font-size:31px}.overview-date{margin-top:12px}.overview-refresh{justify-self:start}.overview-hero{grid-template-columns:1fr;min-height:0}.overview-hero-copy{padding:27px 23px 18px}.overview-hero-copy h2{font-size:31px}.overview-hero-art{min-height:150px}.overview-building-art{left:calc(50% - 65px);height:135px;transform:scale(.78) skewY(-5deg);transform-origin:bottom center}.overview-orbit-one{top:-73px;left:calc(50% - 137px)}.overview-orbit-two{top:-40px;left:calc(50% - 105px)}.overview-art-label{top:18px;left:18px}.overview-art-note{right:14px;bottom:14px}.overview-stats{grid-template-columns:1fr}.overview-stat-card{min-height:122px}.overview-stat-card>strong{margin-top:7px}.overview-section-heading{align-items:flex-start}.overview-section-actions{flex-direction:column-reverse;align-items:flex-end;gap:8px}.overview-section-actions .button{padding:8px 10px}.overview-notices,.overview-building,.overview-quick-actions{padding:17px}.overview-notice-list{grid-template-columns:1fr}.overview-notice-card{grid-template-columns:minmax(0,1fr) 76px;padding:13px}.overview-notice-photo{width:76px;height:76px}.overview-notice-heading{align-items:flex-start;flex-direction:column}.overview-notice-card h3{margin-top:9px}.overview-notice-meta{display:grid;gap:7px}.overview-claim-form{align-items:stretch;flex-direction:column}.overview-claim-form .button{align-self:flex-start}.overview-empty{align-items:flex-start;flex-wrap:wrap}.overview-empty>div{min-width:calc(100% - 58px)}.overview-empty .link-button{margin-left:56px}.overview-quick-actions{grid-template-columns:1fr}.overview-quick-actions>.page-kicker,.overview-quick-actions>.section-title,.overview-quick-actions>.muted,.overview-updated{grid-column:1}.overview-floor-count{min-width:45px;min-height:45px}}
@media(prefers-reduced-motion:reduce){.overview-stat-card,.overview-action{transition:none}}

.overview-stats{grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))}
.overview-workspace-grid.is-personal{grid-template-columns:minmax(0,1fr)}

/* Finishing details for the workspace overview. */
.overview-page{gap:26px}
.overview-intro{padding-bottom:20px;border-bottom:1px solid #e4ebe3}
.overview-intro .page-kicker{color:#527663;letter-spacing:1.9px}
.overview-intro .page-title{font-size:clamp(32px,3.2vw,44px);letter-spacing:-1.8px}
.overview-intro .lead{max-width:620px;color:#60766a}
.overview-date{gap:9px}
.overview-hero{min-height:286px;border:1px solid #275b46;box-shadow:0 18px 42px #173e2c18;background:radial-gradient(ellipse at 82% 18%,#a5c17a28 0,transparent 35%),linear-gradient(118deg,#103b30 0%,#18513c 54%,#2c704d 100%)}
.overview-hero:after{position:absolute;z-index:1;inset:0;pointer-events:none;content:"";background:linear-gradient(90deg,#0e362e1a,transparent 70%)}
.overview-hero-art{z-index:2}
.overview-hero-copy{padding:40px 46px}
.overview-hero-copy h2{font-size:clamp(34px,3.4vw,46px);letter-spacing:-1.8px}
.overview-hero-copy>p{max-width:390px;font-size:14px}
.overview-hero-actions{gap:18px}
.overview-hero-actions .button{box-shadow:0 7px 18px #071f161f}
.overview-art-label,.overview-art-note{border-color:#ffffff42;background:#ffffff20;box-shadow:0 14px 32px #092a1d35}
.overview-orbit-one{border-color:#e3f0df30}
.overview-orbit-two{border-color:#e3f0df25}
.overview-building-art{background:linear-gradient(145deg,#e0e9ce,#b9d0ae);box-shadow:20px 5px 0 #789d7d}
.overview-stats{gap:18px}
.overview-stat-card{min-height:166px;padding:20px 22px 17px;border-radius:18px;background:linear-gradient(150deg,#fff 58%,#f6f9f3);box-shadow:0 7px 22px #23453108}
.overview-stat-card:before{position:absolute;top:18px;bottom:18px;left:0;width:3px;border-radius:0 4px 4px 0;background:#638d6a;content:""}
.overview-stat-card:nth-child(2):before{background:#c38b4b}
.overview-stat-card:nth-child(3):before{background:#806b9b}
.overview-stat-icon{box-shadow:inset 0 0 0 1px #173b2d0a}
.overview-stat-card>strong{font-size:38px}
.overview-stat-foot{font-size:12px}
.overview-notices,.overview-building,.overview-quick-actions{border-color:#e0e9df;border-radius:20px;box-shadow:0 12px 32px #1f432b0a}
.overview-notices,.overview-building{background:linear-gradient(160deg,#fff,#fcfdfb)}
.overview-quick-actions{background:linear-gradient(155deg,#fff,#f8fbf6)}
.overview-section-heading .section-title,.overview-quick-actions>.section-title{letter-spacing:-.6px}
.overview-notice-card{border-color:#e3ebe1;background:linear-gradient(145deg,#fff,#f8fbf7)}
.overview-notice-kind{font-size:11px}
.overview-action{min-height:70px;border-color:#e7eee6}
.overview-action-icon{box-shadow:inset 0 0 0 1px #193b320a}
.overview-action strong{font-size:13px}
.overview-action small{font-size:11px}
.overview-floor-count{box-shadow:inset 0 0 0 1px #315d3810}
.floor-list button{border-radius:11px;box-shadow:0 2px 5px #183d2908}
.floor-list button.selected{box-shadow:0 7px 15px #17634c30}
@media(max-width:980px){.overview-hero{min-height:0}.overview-hero-copy{padding:34px 36px 20px}}
@media(max-width:700px){.overview-page{gap:20px}.overview-intro{padding-bottom:16px}.overview-hero-copy{padding:28px 25px 18px}.overview-hero-copy h2{font-size:34px}.overview-stat-card{min-height:132px}.overview-notices,.overview-building,.overview-quick-actions{border-radius:16px}}
@media(max-width:540px){.overview-hero-copy{padding:27px 23px 18px}.overview-hero-copy h2{font-size:32px}.overview-stats{gap:11px}.overview-stat-card{min-height:128px}.overview-stat-card>strong{font-size:34px}.overview-notices,.overview-building,.overview-quick-actions{padding:18px}}

.overview-notices{position:relative;gap:22px;padding:30px;overflow:hidden;border-color:#d7e5d6;background:radial-gradient(ellipse at 100% 0%,#e7f1e455,transparent 42%),linear-gradient(145deg,#fff,#f8fbf6);box-shadow:0 16px 40px #21452c10}
.notice-seen-row{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:7px 0}.notice-seen-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:#e7f3e8;color:#27623a;font-size:11px;font-weight:700}.notice-seen-badge.is-unseen{background:#fff3df;color:#87591f}.notice-seen-action{padding:4px 9px;border:1px solid #d8e5d7;border-radius:999px;background:#f7faf5;color:#46684b;font:inherit;font-size:11px;cursor:pointer}.notice-seen-action:hover{background:#eaf3e8}
.overview-notices:before{position:absolute;inset:0 auto 0 0;width:4px;border-radius:4px 0 0 4px;background:linear-gradient(#7a9e64,#347252);content:""}
.overview-notice-intro{display:flex;align-items:center;gap:16px}
.overview-board-mark{display:grid;flex:none;width:54px;height:54px;place-items:center;border:1px solid #dce9d9;border-radius:17px;background:linear-gradient(145deg,#edf5e8,#dfeedd);color:#376b47;box-shadow:0 5px 12px #315c3710}
.overview-notice-intro .page-kicker{margin-bottom:8px}
.overview-notice-intro .section-title{font-size:25px;letter-spacing:-.7px}
.overview-notice-intro .muted{font-size:13px}
.overview-notice-total{padding:8px 13px;border:1px solid #dbe8d7;background:#edf5e9;font-size:12px}
.overview-notice-list{grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:18px}
.overview-notice-card{min-height:208px;align-content:start;gap:16px;padding:22px;border-color:#e0e9de;border-radius:18px;background:linear-gradient(145deg,#fff 55%,#f6faf4);box-shadow:0 5px 16px #24463008}
.overview-notice-heading{min-height:30px}
.overview-notice-kind{padding:7px 10px;font-size:12px}
.overview-notice-card h3{margin-top:17px;font-size:20px;letter-spacing:-.35px}
.overview-notice-description{font-size:13px;line-height:1.7}
.overview-notice-meta{margin-top:20px;gap:10px 20px;font-size:12px}
.overview-notice-photo{width:136px;height:136px;border-radius:15px}
.overview-claim-form{gap:16px;padding-top:17px}
.overview-empty{min-height:150px;padding:26px 28px;border-color:#cbdcc8;background:linear-gradient(110deg,#f6faf3,#fff)}
.overview-empty-icon{width:52px;height:52px}
.overview-empty strong{font-size:15px}
.overview-empty p{font-size:12px}
.overview-loading{min-height:130px;justify-content:center;border:1px dashed #d5e1d2;border-radius:16px;background:#fbfdf9;font-size:13px}
@media(max-width:700px){.overview-notices{gap:18px;padding:23px 18px}.overview-notice-intro{align-items:flex-start;gap:12px}.overview-board-mark{width:44px;height:44px;border-radius:14px}.overview-notice-intro .section-title{font-size:22px}.overview-notice-intro .muted{max-width:250px}.overview-notice-card{min-height:180px;padding:17px}.overview-notice-photo{width:94px;height:94px}.overview-notice-meta{margin-top:14px}}
@media(max-width:540px){.overview-section-heading{gap:12px}.overview-notice-intro{gap:9px}.overview-board-mark{width:38px;height:38px}.overview-board-mark svg{width:17px}.overview-notice-intro .section-title{font-size:20px}.overview-notice-intro .muted{font-size:12px}.overview-section-actions{flex-direction:column-reverse;align-items:flex-end;gap:7px}.overview-notice-total{padding:6px 9px}.overview-notice-card{grid-template-columns:minmax(0,1fr) 68px;min-height:0;padding:14px}.overview-notice-photo{width:68px;height:68px}.overview-notice-card h3{margin-top:12px;font-size:18px}.overview-notice-meta{display:flex;gap:8px 12px}.overview-claim-form{align-items:stretch}.overview-claim-form .button{align-self:flex-start}}
</style>
