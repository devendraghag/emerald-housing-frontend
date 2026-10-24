function createRoutes({Home,Login,RecordList,RecordForm,Memberships,NotFound,OptionsPlayground,CommunityManagement=NotFound,Profile=NotFound,Forbidden=NotFound}) {
  const read=type=>type==='members'?['MEMBER_VIEW:SOCIETY','MEMBER_VIEW:SELF']:['FLAT_VIEW:SOCIETY','FLAT_VIEW:OWN_FLATS'];
  return [
    {path:'/login',name:'login',component:Login,meta:{title:'Sign in',guestOnly:true}},
    {path:'/',component:Home,meta:{requiresAuth:true,title:'Overview'}},
    {path:'/access-denied',name:'access-denied',component:Forbidden,meta:{requiresAuth:true,title:'Access restricted'}},
    {path:'/profile',component:Profile,meta:{requiresAuth:true,title:'My profile',permissions:read('members')}},
    {path:'/vue-options',name:'vue-options',component:OptionsPlayground,meta:{requiresAuth:true,title:'Vue Options API'}},
    ...['members','flats'].flatMap(type=>[
      {path:`/${type}`,component:RecordList,props:{type},meta:{requiresAuth:true,title:type==='members'?'Members':'Flats',permissions:read(type)}},
      {path:`/${type}/new`,component:RecordForm,props:{type},meta:{requiresAuth:true,title:type==='members'?'Add member':'Add flat',permissions:[`${type==='members'?'MEMBER':'FLAT'}_CREATE:SOCIETY`]}},
      {path:`/${type}/:id/edit`,component:RecordForm,props:route=>({type,id:route.params.id}),meta:{requiresAuth:true,title:'Edit record',permissions:[`${type==='members'?'MEMBER':'FLAT'}_UPDATE:SOCIETY`,`${type==='members'?'MEMBER':'FLAT'}_DEACTIVATE:SOCIETY`]}},
      {path:`/${type}/:id`,component:RecordForm,props:route=>({type,id:route.params.id,readonly:true}),meta:{requiresAuth:true,title:'Record details',permissions:read(type)}}
    ]),
    {path:'/members/:id/memberships',component:Memberships,props:true,meta:{requiresAuth:true,title:'Flat memberships',permissions:read('members')}},
    ...[
      ['users','Users',['USER_VIEW:SOCIETY']],['roles','Roles',['ROLE_VIEW:SOCIETY']],
      ['permissions','Permissions',['PERMISSION_VIEW:SOCIETY']],['owners','Owners & flats',read('members')],
      ['family','Family details',['FAMILY_VIEW:SOCIETY','FAMILY_VIEW:OWN_FLATS','FAMILY_VIEW:SELF']],
      ['audit','Audit history',['AUDIT_VIEW:SOCIETY']]
    ].map(([area,title,permissions])=>({path:`/${area}`,component:CommunityManagement,props:{area},meta:{requiresAuth:true,title,permissions}})),
    {path:'/:pathMatch(.*)*',component:NotFound,meta:{requiresAuth:true,title:'Page not found'}}
  ];
}
module.exports={createRoutes};
