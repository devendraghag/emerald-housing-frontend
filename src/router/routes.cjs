function createRoutes({Home,Login,RecordList,RecordForm,Memberships,NotFound,CommunityManagement=NotFound,RentalManagement=NotFound,SocietyManagement=NotFound,AccountSecurity=NotFound,Profile=NotFound,LostFound=NotFound,Forbidden=NotFound,HousingAssistant=NotFound}) {
  const read=type=>type==='members'?['MEMBER_VIEW:SOCIETY','MEMBER_VIEW:SELF']:['FLAT_VIEW:SOCIETY','FLAT_VIEW:OWN_FLATS'];
  return [
    {path:'/login',name:'login',component:Login,meta:{title:'Sign in',guestOnly:true}},
    {path:'/',component:Home,meta:{requiresAuth:true,title:'Overview'}},
    {path:'/account-security',component:AccountSecurity,meta:{requiresAuth:true,title:'Account security'}},
    {path:'/assistant',component:HousingAssistant,meta:{requiresAuth:true,title:'Housing FAQ Assistant'}},
    {path:'/building',component:SocietyManagement,meta:{requiresAuth:true,title:'Society & floors',permissions:['SOCIETY_VIEW:SOCIETY']}},
    {path:'/rental',component:RentalManagement,meta:{requiresAuth:true,title:'Rental operations',permissions:['RENT_VIEW:SOCIETY','RENT_VIEW:OWN_FLATS','RENT_MANAGE:SOCIETY','RENT_MANAGE:OWN_FLATS','MAINTENANCE_VIEW:SOCIETY','MAINTENANCE_VIEW:OWN_FLATS','MAINTENANCE_CREATE:SOCIETY','MAINTENANCE_CREATE:OWN_FLATS','LEASE_VIEW:SOCIETY','LEASE_VIEW:OWN_FLATS','LEASE_MANAGE:SOCIETY','LEASE_MANAGE:OWN_FLATS','VIEWING_VIEW:SOCIETY','VIEWING_VIEW:OWN_FLATS','VIEWING_BOOK:SOCIETY','VIEWING_BOOK:OWN_FLATS','VIEWING_MANAGE:SOCIETY','VIEWING_MANAGE:OWN_FLATS']}},
    {path:'/access-denied',name:'access-denied',component:Forbidden,meta:{requiresAuth:true,title:'Access restricted'}},
    {path:'/profile',component:Profile,meta:{requiresAuth:true,title:'My profile',permissions:read('members')}},
    {path:'/notices',component:LostFound,meta:{requiresAuth:true,title:'Notices',permissions:['COMMUNITY_NOTICE_BOARD:SOCIETY','COMMUNITY_NOTICE_CREATE:SOCIETY','COMMUNITY_NOTICE_ADMIN:SOCIETY','LOST_FOUND_BOARD:SOCIETY','LOST_FOUND_REPORT:SOCIETY','LOST_FOUND_ADMIN:SOCIETY']}},
    {path:'/lost-found',redirect:'/notices',meta:{requiresAuth:true,title:'Notices',permissions:['LOST_FOUND_BOARD:SOCIETY','LOST_FOUND_REPORT:SOCIETY','LOST_FOUND_ADMIN:SOCIETY']}},
    ...['members','flats'].flatMap(type=>[
      {path:`/${type}`,component:RecordList,props:{type},meta:{requiresAuth:true,title:type==='members'?'Members':'Flats',permissions:read(type)}},
      {path:`/${type}/new`,component:RecordForm,props:{type},meta:{requiresAuth:true,title:type==='members'?'Add member':'Add flat',permissions:[`${type==='members'?'MEMBER':'FLAT'}_CREATE:SOCIETY`]}},
      {path:`/${type}/:id/edit`,component:RecordForm,props:route=>({type,id:route.params.id}),meta:{requiresAuth:true,title:'Edit record',permissions:[`${type==='members'?'MEMBER':'FLAT'}_UPDATE:SOCIETY`,`${type==='members'?'MEMBER':'FLAT'}_DEACTIVATE:SOCIETY`,`${type==='members'?'MEMBER':'FLAT'}_ACTIVATE:SOCIETY`]}},
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
