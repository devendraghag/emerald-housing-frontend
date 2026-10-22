const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('vuex');
const { createSessionModule } = require('../src/store/session.cjs');
const { createAuthGuard, safeRedirect } = require('../src/util/route-guards.cjs');
function makeStore(auth) {
 return createStore({ state: { society: {}, floors: [1] }, mutations: { referenceData(state, values) { Object.assign(state, values); } }, modules: { session: createSessionModule(auth, () => 'Connection failed') } });
}
test('parallel route checks share one session request and cache the result', async () => {
 let calls=0;
 const store=makeStore({ current: async () => { calls++; return { username: 'admin' }; } });
 await Promise.all([store.dispatch('session/restore'), store.dispatch('session/restore')]);
 await store.dispatch('session/restore');
 assert.equal(calls,1);
 assert.equal(store.getters['session/authenticated'],true);
});
test('guest is redirected to login with the requested route preserved', async () => {
 const store=makeStore({ current: async () => { throw { response: { status: 401 } }; } });
 const result=await createAuthGuard(store)({ meta: { requiresAuth:true }, fullPath:'/members/7/edit', query:{} });
 assert.deepEqual(result,{ name:'login',query:{redirect:'/members/7/edit'},replace:true });
 assert.equal(store.state.session.error,'');
});
test('network failure is retryable and does not authenticate a guest', async () => {
 let available=false;
 const store=makeStore({ current: async () => { if(!available) throw Error('offline'); return {username:'admin'}; } });
 await store.dispatch('session/restore');
 assert.equal(store.state.session.error,'Connection failed');
 available=true;
 await store.dispatch('session/restore',{force:true});
 assert.equal(store.getters['session/authenticated'],true);
 assert.equal(store.state.session.error,'');
});
test('authenticated users can visit protected routes and leave the login page', async () => {
 const store=makeStore({current:async()=>({username:'admin'})});
 const guard=createAuthGuard(store);
 assert.equal(await guard({meta:{requiresAuth:true},query:{}}),true);
 assert.equal(await guard({meta:{guestOnly:true},query:{redirect:'/flats'}}),'/flats');
});
test('redirect targets stay inside the app and avoid login loops', () => {
 for(const target of ['https://example.com','//example.com','/login','/login?redirect=/flats','/\\example.com',null,['/flats']]) assert.equal(safeRedirect(target),'/');
 assert.equal(safeRedirect('/members/7/edit?tab=details'),'/members/7/edit?tab=details');
});
test('session expiry prevents a stale restoration from signing the user back in', async () => {
 let resolve;
 const store=makeStore({current:()=>new Promise(done=>{resolve=done;})});
 const pending=store.dispatch('session/restore');
 await Promise.resolve();
 await store.dispatch('session/expire');
 resolve({username:'admin'});
 await pending;
 assert.equal(store.getters['session/authenticated'],false);
 assert.equal(store.state.society,null);
 assert.deepEqual(store.state.floors,[]);
});
test('failed logout preserves session while successful logout clears it', async () => {
 let fail=true;
 const store=makeStore({current:async()=>({username:'admin'}),logout:async()=>{if(fail)throw Error('offline');}});
 await store.dispatch('session/restore');
 await assert.rejects(store.dispatch('session/logout'));
 assert.equal(store.getters['session/authenticated'],true);
 assert.equal(store.state.session.signingOut,false);
 fail=false;
 await store.dispatch('session/logout');
 assert.equal(store.getters['session/authenticated'],false);
});

test('login stores the authenticated user and trims the username', async () => {
 let sent;
 const store=makeStore({login:async(...args)=>{sent=args;return {username:'admin'};}});
 await store.dispatch('session/login',{username:' admin ',password:'secret'});
 assert.deepEqual(sent,['admin','secret']);
 assert.equal(store.state.session.user.username,'admin');
 assert.equal(store.getters['session/authenticated'],true);
});
test('every workspace route declares protection and login remains public', () => {
 const { createRoutes } = require('../src/router/routes.cjs');
 const routes = createRoutes({});
 assert.equal(routes.filter(route => route.meta.guestOnly).length, 1);
 assert.ok(routes.filter(route => route.name !== 'login').every(route => route.meta.requiresAuth));
});
