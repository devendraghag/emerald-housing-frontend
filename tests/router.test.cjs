const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRouter, createMemoryHistory } = require('vue-router');
const { createStore } = require('vuex');
const { createRoutes } = require('../src/router/routes.cjs');
const { createAuthGuard, safeRedirect } = require('../src/util/route-guards.cjs');
const { createSessionModule } = require('../src/store/session.cjs');
function setup(auth, options) {
 const view={render:()=>null};
 const store=createStore({state:{society:{},floors:[1]},mutations:{referenceData(state,values){Object.assign(state,values);}},modules:{session:createSessionModule(auth,()=> 'Connection failed',options)}});
 const router=createRouter({history:createMemoryHistory(),routes:createRoutes(Object.fromEntries(['Home','Login','RecordList','RecordForm','Memberships','NotFound','OptionsPlayground'].map(name=>[name,view])))});
 router.beforeEach(createAuthGuard(store));
 return {store,router};
}
const admin={username:'admin',societyCode:'EMERALD',roles:['ADMIN'],permissions:['MEMBER_VIEW:SOCIETY','MEMBER_CREATE:SOCIETY','MEMBER_UPDATE:SOCIETY','FLAT_VIEW:SOCIETY','FLAT_CREATE:SOCIETY','FLAT_UPDATE:SOCIETY']};
const guest={current:async()=>{throw {response:{status:401}};}};
for(const path of ['/', '/members', '/flats', '/members/new', '/flats/new', '/members/7/edit', '/flats/9/edit', '/members/7/memberships', '/unknown', '/vue-options']) {
 test('direct guest access to '+path+' redirects to login',async()=>{
  const {router}=setup(guest);
  await router.push(path);
  assert.equal(router.currentRoute.value.name,'login');
  assert.equal(router.currentRoute.value.query.redirect,path);
 });
}
test('login returns the user to the original protected URL including query',async()=>{
 let signedIn=false;
 const {router,store}=setup({current:async()=>{if(!signedIn)throw {response:{status:401}};return admin;},login:async()=>{signedIn=true;return admin;}});
 await router.push('/members/7/edit?tab=contact');
 await store.dispatch('session/login',{username:'admin',password:'test'});
 await router.replace(safeRedirect(router.currentRoute.value.query.redirect));
 assert.equal(router.currentRoute.value.fullPath,'/members/7/edit?tab=contact');
});
test('authenticated visitors leave login and can navigate workspace routes',async()=>{
 const {router}=setup({current:async()=>admin});
 await router.push('/login');
 assert.equal(router.currentRoute.value.path,'/');
 await router.push('/flats');
 assert.equal(router.currentRoute.value.path,'/flats');
 await router.push('/vue-options');
 assert.equal(router.currentRoute.value.name,'vue-options');
});
test('permission routes refresh identity on navigation and reject an expired session',async()=>{
 let clock=0,calls=0;
 const {router,store}=setup({current:async()=>{calls++;if(calls>2)throw {response:{status:401}};return admin;}},{now:()=>clock});
 await router.push('/members');
 clock=30000;
 await router.push('/flats');
 assert.equal(calls,2);
 clock=61000;
 await router.push('/members/new');
 assert.equal(calls,3);
 assert.equal(router.currentRoute.value.name,'login');
 assert.equal(store.state.session.user,null);
 assert.deepEqual(store.state.floors,[]);
});
test('a nested child cannot bypass protection on its parent',async()=>{
 const store={dispatch:async()=>null,getters:{'session/authenticated':false}};
 const result=await createAuthGuard(store)({fullPath:'/private/child',meta:{requiresAuth:false},matched:[{meta:{requiresAuth:true}}]});
 assert.equal(result.name,'login');
});
test('malformed and encoded redirect targets cannot bypass validation',()=>{
 for(const target of ['/%2fexample.com','/%5cexample.com','/%6cogin/','/LOGIN','/bad%','/%0afoo','%2Fmembers']) assert.equal(safeRedirect(target),'/');
 assert.equal(safeRedirect('/flats?page=2#records'),'/flats?page=2#records');
});
