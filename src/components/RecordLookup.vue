<template>
 <div class="field record-lookup">
  <label class="field-label field-label-strong" :for="name">{{ label }}{{ required ? ' (required)' : '' }}</label>
  <input v-if="resource!=='owners' && !disabled" class="text-input lookup-search" type="search" v-model="search" :aria-label="'Search '+label" placeholder="Search by name or number"/>
  <select :id="name" :name="name" class="select-input" :value="modelValue || ''" :required="required" :disabled="disabled || loading" @change="choose">
   <option value="">{{ required?'Choose a record':'None' }}</option>
   <option v-if="modelValue && !rows.some(r=>key(r)===modelValue)" :value="modelValue">{{ selectedLabel || 'Current selection' }}</option>
   <option v-for="row in rows" :key="key(row)" :value="key(row)" :disabled="currentOnly && !current(row)">{{ text(row) }}</option>
  </select>
  <p v-if="loading" class="field-hint" role="status">Loading choices...</p>
  <p v-if="error" class="form-error" role="alert">{{ error }} <button type="button" class="link-button" @click="load">Retry</button></p>
  <div v-if="!disabled" class="lookup-pager"><button type="button" class="link-button" :disabled="loading || page===0" @click="changePage(page-1)">Previous choices</button><span>Page {{ page+1 }}</span><button type="button" class="link-button" :disabled="loading || !more" @click="changePage(page+1)">More choices</button></div>
 </div>
</template>
<script>
import {api,errorMessage} from '../services/api';import {currentOwnership} from '../util/access.cjs';
export default {
 props:{name:{type:String,required:true},label:String,resource:String,modelValue:String,required:Boolean,disabled:Boolean,currentOnly:Boolean},
 emits:['update:modelValue','selected'],data:()=>({search:'',rows:[],page:0,more:false,loading:false,error:'',selectedLabel:'',flatNames:{}}),
 created(){if(!this.disabled)this.load();},beforeUnmount(){clearTimeout(this.timer);if(this.controller)this.controller.abort();},
 watch:{search(){clearTimeout(this.timer);this.timer=setTimeout(()=>{this.page=0;this.load();},300);},modelValue(){this.resolveSelection();},disabled(value){if(!value&&!this.rows.length)this.load();}},
 methods:{
  current(row){return this.resource==='owners'?currentOwnership(row):row.status==='ACTIVE';},key(row){return row.memberId||row.flatId||row.id;},
  text(row){if(this.resource==='members')return row.fullName+' · '+row.mobileNumber;if(this.resource==='flats')return row.flatNumber+' · Floor '+row.floorNumber;return row.full_name+' · '+(this.flatNames[row.flat_id]||'Registered flat')+(row.end_date?' · Ended':'');},
  choose(event){const value=event.target.value,row=this.rows.find(r=>this.key(r)===value);if(row)this.selectedLabel=this.text(row);this.$emit('update:modelValue',value);this.$emit('selected',row||null);},
  changePage(page){this.page=page;this.load();},
  async resolveSelection(){if(!this.modelValue)return;const found=this.rows.find(r=>this.key(r)===this.modelValue);if(found){this.selectedLabel=this.text(found);return;}if(this.resource==='owners'){this.selectedLabel='Registered ownership (unchanged)';return;}try{const row=await api.get(this.resource,this.modelValue);this.selectedLabel=this.text(row);}catch{this.selectedLabel='Current selection';}},
  async load(){
   if(this.disabled)return;if(this.controller)this.controller.abort();const controller=new AbortController();this.controller=controller;this.loading=true;this.error='';
   try{
    const result=this.resource==='owners'?await api.owners({page:this.page,size:10,signal:controller.signal}):await api.page(this.resource,this.page,{size:10,search:this.search,signal:controller.signal,status:this.currentOnly?'ACTIVE':undefined});
    if(controller.signal.aborted)return;this.rows=Array.isArray(result)?result:result.content;this.more=Array.isArray(result)?result.length===10:this.page+1<result.totalPages;
    if(this.resource==='owners')await Promise.all([...new Set(this.rows.map(r=>r.flat_id))].map(async id=>{try{const flat=await api.flatLabel(id);this.flatNames[id]=flat.flatNumber;}catch{/* Choice remains usable when flat details are restricted. */}}));
    if(!controller.signal.aborted)await this.resolveSelection();
   }catch(error){if(error.code!=='ERR_CANCELED')this.error=errorMessage(error);}finally{if(this.controller===controller)this.loading=false;}
  }
 }
};
</script>
