<template>
 <div class="management-page">
  <span class="page-kicker">{{ area==='family'?'People at home':'Society workspace' }}</span>
  <div class="page-heading"><h1 class="page-title">{{ title }}</h1><div class="button-row"><button class="button button-secondary" :disabled="loading || busy" @click="load">Refresh</button><button v-if="canCreate" class="button" :disabled="busy" @click="newRecord">{{ area==='owners'?'Register owner':'Add '+singular }}</button></div></div>
  <p class="lead">{{ description }}</p>
  <StatusMessage :message="error" error :retry="!busy" @retry="load"/><StatusMessage :message="success"/>
  <form v-if="area==='audit'" class="audit-filters" @submit.prevent="resetAudit">
   <label class="field">Service<select v-model="auditService" class="select-input" @change="resetAudit"><option value="members">People, accounts and access</option><option value="society">Flats</option></select></label>
   <label class="field">Record type<select v-model="entityType" class="select-input"><option value="">All types</option><option v-for="type in auditTypes" :key="type">{{ type }}</option></select></label>
   <Input name="auditEntityId" label="Record ID (optional)" v-model="entityId" placeholder="Record UUID"/><button class="button" :disabled="loading">Apply filters</button>
  </form>
  <p v-if="loading" class="body-text" role="status">Loading {{ title.toLowerCase() }}...</p>
  <div v-else class="table-wrap"><table v-if="rows.length" class="data-table"><caption class="sr-only">{{ title }}</caption>
   <thead><tr><th v-for="column in columns" :key="column.key" scope="col" class="data-table-heading">{{ column.label }}</th><th scope="col" class="data-table-heading">Actions</th></tr></thead>
   <tbody><tr v-for="row in rows" :key="rowKey(row)"><td v-for="column in columns" :key="column.key" class="data-table-cell" :data-label="column.label">{{ cell(row,column.key) }}</td><td class="data-table-cell actions" data-label="Actions">
    <button v-if="canEdit(row)" class="link-button" type="button" :disabled="busy" @click="edit(row)">Edit<span class="sr-only"> {{ row.full_name||row.username||row.code }}</span></button>
    <span v-if="area==='roles' && row.system_role" class="muted">Protected role</span>
    <button v-if="area==='family' && row.active && familyAllowed('FAMILY_DEACTIVATE',row)" class="link-button" :disabled="busy" @click="deactivateFamily(row)">Deactivate<span class="sr-only"> {{ row.full_name }}</span></button>
    <button v-if="area==='owners' && !row.end_date && can('OWNER_END_OWNERSHIP')" class="link-button" :disabled="busy" @click="beginEnd(row)">End ownership<span class="sr-only"> for {{ row.full_name }}</span></button>
    <button v-if="area==='audit'" class="link-button" @click="selectedEvent=row">View change</button>
   </td></tr></tbody></table><p v-else class="empty">No {{ title.toLowerCase() }} found in your permitted scope.</p></div>
  <nav v-if="paged" class="management-pager" :aria-label="title+' pagination'"><button class="button button-secondary" :disabled="loading || page===0" @click="previous">Previous</button><span role="status">Page {{ page+1 }}</span><button class="button button-secondary" :disabled="loading || !more" @click="next">{{ area==='audit'?'Older changes':'Next' }}</button></nav>

  <section v-if="selectedEvent" class="panel audit-detail"><div class="section-heading"><h2 class="section-title">{{ selectedEvent.action }} · {{ selectedEvent.entity_type }}</h2><button class="link-button" @click="selectedEvent=null">Close details</button></div><p>By {{ selectedEvent.actor_name }} at {{ date(selectedEvent.occurred_at) }}</p><p class="muted">Record: {{ selectedEvent.entity_id }}</p><h3>Before</h3><pre>{{ pretty(selectedEvent.before_state) }}</pre><h3>After</h3><pre>{{ pretty(selectedEvent.after_state) }}</pre></section>

  <section v-if="editor" class="panel management-editor" ref="editor" tabindex="-1">
   <h2 class="section-title">{{ editing?'Edit '+singular:area==='owners'?'Register a flat owner':'Add '+singular }}</h2>
   <form :aria-busy="busy" @submit.prevent="save"><fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">{{ singular }} details</legend>
    <template v-if="area==='users'">
     <Input name="accountUsername" label="Username" v-model="draft.username" required maxlength="120" :readonly="!!editing" autocomplete="off"/>
     <Input v-if="!editing" name="accountPassword" label="Initial password" hint="14–72 UTF-8 bytes." v-model="draft.password" type="password" required autocomplete="new-password"/>
     <RecordLookup v-model="draft.memberId" resource="members" name="accountPerson" label="Linked registered person"/>
     <label class="field">Roles (use Ctrl or Command to select several)<select class="select-input roles-select" v-model="draft.roles" multiple required><option v-for="role in enabledRoles" :key="role.code" :value="role.code">{{ role.code }} — {{ role.description }}</option></select></label>
     <label v-if="editing" class="check-field"><input type="checkbox" v-model="draft.enabled"/> Account enabled</label>
    </template>
    <template v-if="area==='roles' || area==='permissions'">
     <Input name="accessCode" :label="area==='roles'?'Role code':'Permission code'" hint="Uppercase letters, digits and underscores; start with a letter." v-model="draft.code" :readonly="!!editing" :pattern="area==='roles'?'[A-Z][A-Z0-9_]{1,31}':'[A-Z][A-Z0-9_]{1,63}'" :maxlength="area==='roles'?32:64" required/>
     <Input name="accessDescription" label="Description" v-model="draft.description" maxlength="200" required/>
     <template v-if="area==='roles'"><label class="check-field"><input type="checkbox" v-model="draft.enabled"/> Role enabled</label><h3 class="section-title">Permissions and scope</h3><p>Choose the actions this role allows and which records they apply to.</p>
      <div class="grant-list"><div v-for="permission in permissionChoices" :key="permission.code" class="grant-row"><label class="check-field"><input type="checkbox" v-model="grants[permission.code].enabled"/> <span>{{ permission.code }}<small>{{ permission.description }}</small></span></label><select class="select-input" :disabled="!grants[permission.code].enabled" v-model="grants[permission.code].scope" :aria-label="permission.code+' access scope'"><option v-for="scope in scopes(permission.code)" :key="scope" :value="scope">{{ scopeLabel(scope) }}</option></select></div></div>
     </template>
     <p v-else class="field-hint">A new permission code alone does not add a feature. Assign permissions for supported actions through Roles.</p>
    </template>
    <template v-if="area==='owners'">
     <Input name="ownerFullName" label="Registered owner full name" v-model="draft.fullName" required maxlength="160"/>
     <Input name="ownerMobile" label="Mobile number" hint="10 digits starting with 6, 7, 8 or 9." v-model="draft.mobileNumber" type="tel" pattern="[6-9][0-9]{9}" required/>
     <Input name="ownerEmail" label="Email (optional)" v-model="draft.email" type="email" maxlength="254"/>
     <RecordLookup v-model="draft.flatId" resource="flats" name="ownerFlat" label="Flat" required current-only/>
     <Input name="ownerStart" label="Ownership start date" v-model="draft.startDate" type="date" :max="today" required/>
     <Input name="ownerUsername" label="Owner login username" v-model="draft.username" maxlength="120" required autocomplete="off"/>
     <Input name="ownerPassword" label="Initial owner password" hint="14–72 UTF-8 bytes." v-model="draft.password" type="password" required autocomplete="new-password"/>
    </template>
    <template v-if="area==='family'">
     <RecordLookup v-model="draft.ownerMembershipId" resource="owners" name="familyOwnership" label="Registered owner and flat" required current-only :disabled="!!editing"/>
     <Input name="familyFullName" label="Family member name" v-model="draft.fullName" required maxlength="160"/>
     <Input name="familyRelationship" label="Relationship to owner" hint="For example: spouse, child, or parent." v-model="draft.relationship" required maxlength="40"/>
     <Input name="familyMobile" label="Mobile number (optional)" v-model="draft.mobileNumber" type="tel" maxlength="20"/>
     <Input name="familyEmail" label="Email (optional)" v-model="draft.email" type="email" maxlength="254"/>
     <RecordLookup v-if="can('USER_UPDATE')" v-model="draft.linkedMemberId" resource="members" name="familyPerson" label="Linked registered person (optional)"/>
     <p class="field-hint">Adding family details does not create a login account. An administrator can link a registered person and provide a separate family login.</p>
    </template>
    <div class="button-row"><button class="button" type="submit">{{ busy?'Saving...':'Save '+singular }}</button><button type="button" class="button button-secondary" @click="closeEditor">Cancel</button></div>
   </fieldset></form>
  </section>

  <div v-if="area==='owners'" class="management-grid">
   <section v-if="can('OWNER_REGISTER')" class="panel"><h2 class="section-title">Link an existing registered owner</h2><form @submit.prevent="linkOwner"><fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">Existing owner assignment</legend><RecordLookup name="existingOwnerPerson" label="Registered person" resource="members" v-model="link.memberId" required/><RecordLookup name="existingOwnerFlat" label="Flat" resource="flats" v-model="link.flatId" current-only required/><Input name="linkStart" label="Ownership start" type="date" v-model="link.startDate" :max="today" required/><button class="button">Link ownership</button><p class="field-hint">Assign the Flat Owner role to the person's account in Users if needed.</p></fieldset></form></section>
   <section v-if="can('OWNER_REGISTER') && can('OWNER_END_OWNERSHIP')" class="panel"><h2 class="section-title">Transfer ownership</h2><form @submit.prevent="transfer"><fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">Ownership transfer</legend><RecordLookup name="transferOutgoing" label="Outgoing owner and flat" resource="owners" v-model="transferForm.membershipId" current-only required @selected="transferForm.previous=$event"/><RecordLookup name="transferIncoming" label="Incoming registered owner" resource="members" v-model="transferForm.memberId" required/><Input name="transferDate" label="Transfer date" type="date" v-model="transferForm.date" :max="today" required/><button class="button">Transfer ownership</button><p class="field-hint">Historical family records remain with the previous ownership. Assign the incoming owner's account its permitted roles separately.</p></fieldset></form></section>
  </div>
  <section v-if="ending" class="panel form-page"><h2 class="section-title">End ownership for {{ ending.full_name }}</h2><form @submit.prevent="endOwnership"><fieldset class="plain-fieldset" :disabled="busy"><legend class="sr-only">End ownership</legend><Input name="ownershipEnd" label="End date" type="date" v-model="endDate" :min="ending.start_date" :max="today" required/><p>Ending this ownership removes the access it grants and retains its history.</p><div class="button-row"><button class="button button-danger">Confirm end ownership</button><button class="button button-secondary" type="button" @click="ending=null">Cancel</button></div></fieldset></form></section>
 </div>
</template>
<script>
import {api,errorMessage} from '../services/api';import access from '../util/access-mixin';import {permits,scopesFor,passwordError,currentOwnership} from '../util/access.cjs';
import StatusMessage from '../components/StatusMessage.vue';import Input from '../components/forms/Input.vue';import RecordLookup from '../components/RecordLookup.vue';
const today=()=>new Date().toISOString().slice(0,10);
const info={
 users:['Users','user','Manage login accounts, registered-person links, roles and account status.'],
 roles:['Roles','role','Configure roles and choose the actions and access scopes each role receives.'],
 permissions:['Permissions','permission','Review the available business actions and maintain their descriptions.'],
 owners:['Owners & flats','owner','Register owners, link existing people to flats, and preserve ownership history.'],
 family:['Family details','family member','Manage the family records your current permissions and ownership allow.'],
 audit:['Audit history','change','Review who changed a record and its before and after details.']
};
export default {
 props:{area:{type:String,required:true}},mixins:[access],components:{StatusMessage,Input,RecordLookup},
 data:()=>({rows:[],page:0,more:false,loading:false,busy:false,error:'',success:'',editor:false,editing:null,draft:{},grants:{},roleChoices:[],permissionChoices:[],flatNames:{},ownMembershipIds:[],today:today(),ending:null,endDate:today(),selectedEvent:null,auditService:'members',entityType:'',entityId:'',before:0,auditStack:[],link:{memberId:'',flatId:'',startDate:today()},transferForm:{membershipId:'',memberId:'',previous:null,date:today()}}),
 computed:{
  title(){return info[this.area][0];},singular(){return info[this.area][1];},description(){return info[this.area][2];},paged(){return ['users','owners','family','audit'].includes(this.area);},
  enabledRoles(){return this.roleChoices.filter(r=>r.enabled);},
  canCreate(){
   if(this.area==='users')return this.can('USER_CREATE')&&this.can('USER_ASSIGN_ROLE')&&this.can('ROLE_VIEW');
   if(this.area==='roles')return this.can('ROLE_CREATE')&&this.can('ROLE_ASSIGN_PERMISSION')&&this.can('PERMISSION_VIEW');
   if(this.area==='permissions')return this.can('PERMISSION_MANAGE');
   if(this.area==='owners')return ['OWNER_REGISTER','MEMBER_CREATE','USER_CREATE','USER_ASSIGN_ROLE'].every(p=>this.can(p));
   if(this.area==='family')return this.familyAllowed('FAMILY_ADD');return false;
  },
  auditTypes(){return this.auditService==='society'?['FLAT']:['MEMBER','MEMBERSHIP','ACCOUNT','ROLE','PERMISSION','FAMILY'];},
  columns(){return ({
   users:[['username','Username'],['roles','Roles'],['enabled','Status']],roles:[['code','Role'],['description','Description'],['enabled','Status'],['grants','Permissions']],
   permissions:[['code','Permission'],['description','Description']],owners:[['full_name','Owner'],['flat_id','Flat'],['start_date','Start'],['end_date','End']],
   family:[['full_name','Name'],['relationship','Relationship'],['mobile_number','Mobile'],['email','Email'],['flat_id','Flat'],['active','Status']],
   audit:[['occurred_at','When'],['actor_name','Who'],['action','Action'],['entity_type','Record type']]
  })[this.area].map(([key,label])=>({key,label}));}
 },
 created(){this.load();},
 methods:{
  scopes:scopesFor,date(value){return value?new Date(value).toLocaleString():'—';},pretty(value){if(!value)return 'No previous value';try{return JSON.stringify(typeof value==='string'?JSON.parse(value):value,null,2);}catch{return String(value);}},
  scopeLabel(scope){return {SOCIETY:'Whole society',OWN_FLATS:'Own flats',SELF:'Own record'}[scope];},rowKey(row){return row.id||row.accountId||row.code||row.sequence;},
  cell(row,key){if(key==='flat_id')return this.flatNames[row.flat_id]||'Flat details restricted';if(key==='roles')return row.roles.join(', ');if(key==='grants')return row.grants.map(g=>g.permission+' · '+this.scopeLabel(g.scope)).join('; ');if(key==='enabled')return row.enabled?'Enabled':'Disabled';if(key==='active')return row.active?'Active':'Inactive';if(key==='occurred_at')return this.date(row[key]);if(key==='end_date')return row[key]||'Current';return row[key]||'—';},
  familyAllowed(permission,row){return this.can(permission)||(this.can(permission,'OWN_FLATS')&&(row?this.ownMembershipIds.includes(row.owner_membership_id):this.ownMembershipIds.length>0));},
  canEdit(row){if(this.area==='users')return row.accountId!==this.currentUser.accountId&&this.can('USER_UPDATE')&&this.can('USER_ASSIGN_ROLE')&&this.can('ROLE_VIEW');if(this.area==='roles')return !row.system_role&&this.can('ROLE_UPDATE')&&this.can('ROLE_ASSIGN_PERMISSION')&&this.can('PERMISSION_VIEW');if(this.area==='permissions')return this.can('PERMISSION_MANAGE');if(this.area==='family')return row.active&&this.familyAllowed('FAMILY_UPDATE',row);return false;},
  async load(){
   const revision=(this.revision||0)+1;this.revision=revision;this.loading=true;this.error='';this.rows=[];
   try{
    let rows;
    if(this.area==='users'){rows=await api.accounts(this.page);if(this.can('ROLE_VIEW'))this.roleChoices=await api.roles();}
    if(this.area==='roles'){rows=await api.roles();if(this.can('PERMISSION_VIEW'))this.permissionChoices=await api.permissions();}
    if(this.area==='permissions')rows=await api.permissions();
    if(this.area==='owners')rows=await api.owners({page:this.page});
    if(this.area==='family'){
     rows=await api.families({page:this.page});this.ownMembershipIds=[];
     if(this.currentUser.memberId&&this.canRead('MEMBER_VIEW')&&['FAMILY_ADD','FAMILY_UPDATE','FAMILY_DEACTIVATE'].some(p=>this.can(p,'OWN_FLATS'))){const memberships=await api.memberships(this.currentUser.memberId);this.ownMembershipIds=memberships.filter(m=>m.relationshipType==='OWNER'&&!m.endDate&&m.startDate<=today()).map(m=>m.membershipId);}
    }
    if(this.area==='audit')rows=await api.audit({service:this.auditService,entityType:this.entityType,entityId:this.entityId,before:this.before});
    if(revision!==this.revision)return;this.rows=rows;this.more=this.paged&&rows.length===10;
    if(['owners','family'].includes(this.area)&&this.canRead('FLAT_VIEW'))await Promise.all([...new Set(rows.map(r=>r.flat_id))].map(async id=>{try{const f=await api.get('flats',id);if(revision===this.revision)this.flatNames[id]=f.flatNumber;}catch{/* No extra data is exposed when flat reads are restricted. */}}));
   }catch(e){if(revision===this.revision)this.error=errorMessage(e);}finally{if(revision===this.revision)this.loading=false;}
  },
  next(){if(this.area==='audit'){this.auditStack.push(this.before);this.before=this.rows[this.rows.length-1].sequence;}this.page++;this.load();},
  previous(){if(this.area==='audit')this.before=this.auditStack.pop()||0;this.page=Math.max(0,this.page-1);this.load();},
  resetAudit(){this.before=0;this.page=0;this.auditStack=[];this.selectedEvent=null;this.load();},
  newRecord(){this.editing=null;this.draft={username:'',password:'',memberId:'',roles:[],enabled:true,code:'',description:'',fullName:'',mobileNumber:'',email:'',flatId:'',startDate:today(),ownerMembershipId:'',relationship:'',linkedMemberId:''};this.fillGrants([]);this.editor=true;this.focusEditor();},
  edit(row){
   this.editing=row;this.draft={...row,roles:[...(row.roles||[])],memberId:row.memberId||'',fullName:row.full_name||'',mobileNumber:row.mobile_number||'',email:row.email||'',ownerMembershipId:row.owner_membership_id||'',linkedMemberId:row.linked_member_id||''};
   this.fillGrants(row.grants||[]);this.editor=true;this.focusEditor();
  },
  fillGrants(values){this.grants=Object.fromEntries(this.permissionChoices.map(p=>{const g=values.find(g=>g.permission===p.code);return [p.code,{enabled:!!g,scope:g?g.scope:scopesFor(p.code)[0]}];}));},
  focusEditor(){this.$nextTick(()=>{const e=this.$refs.editor;if(e){e.focus();e.scrollIntoView({behavior:'smooth',block:'start'});}});},
  closeEditor(){this.editor=false;this.editing=null;this.draft={};},
  async syncAccess(){await this.$store.dispatch('session/restore',{force:true});if(!this.currentUser){await this.$router.replace({name:'login'});return false;}if(!permits(this.currentUser,this.$route.meta)){await this.$router.replace({name:'access-denied'});return false;}return true;},
  async mutation(action,message){if(this.busy)return;this.busy=true;this.error='';this.success='';try{await action();this.closeEditor();this.ending=null;if(await this.syncAccess()){await this.load();if(!this.error)this.success=message;}}catch(e){this.error=errorMessage(e);}finally{this.busy=false;}},
  async save(){
   const d=this.draft,editing=this.editing;
   if(['users','owners'].includes(this.area)&&!editing){const invalid=passwordError(d.password);if(invalid){this.error=invalid;return;}}
   await this.mutation(async()=>{
    if(this.area==='users'){const body={roles:d.roles,societyCode:'EMERALD',memberId:d.memberId||null};if(editing)await api.updateAccount(editing.accountId,{...body,enabled:d.enabled,version:editing.version});else await api.createAccount({...body,username:d.username.trim(),password:d.password});}
    if(this.area==='roles')await api.saveRole(editing?editing.code:null,{code:d.code,description:d.description.trim(),enabled:d.enabled,version:editing?editing.version:0,grants:Object.entries(this.grants).filter(([,g])=>g.enabled).map(([permission,g])=>({permission,scope:g.scope}))});
    if(this.area==='permissions')await api.savePermission(editing?editing.code:null,{code:d.code,description:d.description.trim()});
    if(this.area==='owners')await api.registerOwner({person:{fullName:d.fullName.trim(),mobileNumber:d.mobileNumber.trim(),email:d.email.trim()||null},flatId:d.flatId,startDate:d.startDate,username:d.username.trim(),password:d.password});
    if(this.area==='family'){const details={fullName:d.fullName.trim(),relationship:d.relationship.trim(),mobileNumber:d.mobileNumber.trim()||null,email:d.email.trim()||null,linkedMemberId:d.linkedMemberId||null};if(editing)await api.updateFamily(editing.id,{version:editing.version,details});else await api.createFamily({ownerMembershipId:d.ownerMembershipId,details});}
   },'Saved successfully.');
  },
  async deactivateFamily(row){if(!window.confirm('Deactivate family details for '+row.full_name+'?'))return;await this.mutation(()=>api.deactivateFamily(row.id,row.version),'Family record deactivated.');},
  async linkOwner(){await this.mutation(()=>api.assign(this.link.memberId,{flatId:this.link.flatId,relationshipType:'OWNER',startDate:this.link.startDate}),'Ownership linked.');},
  async transfer(){const f=this.transferForm,p=f.previous;if(!p||p.id!==f.membershipId||!currentOwnership(p)){this.error='Choose the current outgoing ownership.';return;}await this.mutation(()=>api.transferOwnership({previousMembershipId:p.id,previousMemberId:p.member_id,newOwnerMemberId:f.memberId,flatId:p.flat_id,date:f.date}),'Ownership transferred. Historical family records were retained.');},
  beginEnd(row){this.ending=row;this.endDate=today();},
  async endOwnership(){const row=this.ending;await this.mutation(()=>api.end(row.member_id,row.id,this.endDate),'Ownership ended.');}
 }
};
</script>
