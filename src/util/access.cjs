function can(user, permission, scope = 'SOCIETY') {
  return Boolean(user && user.societyCode === 'EMERALD' && Array.isArray(user.permissions) && user.permissions.includes(`${permission}:${scope}`));
}
function canRead(user, permission) { return ['SOCIETY', 'SELF', 'OWN_FLATS'].some(scope => can(user, permission, scope)); }
function permits(user, meta = {}) {
  return (!meta.permissions || meta.permissions.some(grant => {
    const [permission,scope] = grant.split(':');return can(user,permission,scope);
  })) && (!meta.allPermissions || meta.allPermissions.every(grant => {
    const [permission,scope] = grant.split(':');return can(user,permission,scope);
  }));
}
function normalizeIdentity(data) {
  if (!data || !data.account || !data.account.accountId) throw Error('The backend returned an incomplete account identity.');
  return {...data.account,adminId:data.account.accountId,authenticated:true,
    permissions:Array.isArray(data.permissions)?[...data.permissions]:[],
    roles:Array.isArray(data.account.roles)?[...data.account.roles]:[],flatIds:Array.isArray(data.flatIds)?[...data.flatIds]:[]};
}
function scopesFor(permission) {
  if(permission==='MEMBER_VIEW')return ['SOCIETY','SELF'];
  if(permission==='FLAT_VIEW')return ['SOCIETY','OWN_FLATS'];
  if(permission==='FAMILY_VIEW')return ['SOCIETY','OWN_FLATS','SELF'];
  if(permission.startsWith('FAMILY_'))return ['SOCIETY','OWN_FLATS'];
  return ['SOCIETY'];
}
function passwordError(value) {
  const length=new TextEncoder().encode(value).length;
  return length<14||length>72?'Password must contain between 14 and 72 UTF-8 bytes.':'';
}
function dateOnly(value) {
  if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}/.test(value))return value.slice(0,10);
  if(Array.isArray(value)&&value.length===3)return value.map((v,i)=>String(v).padStart(i?2:4,'0')).join('-');
  if(typeof value==='number'){const d=new Date(value);if(Number.isFinite(d.getTime()))return d.toISOString().slice(0,10);}
  return '';
}
function currentOwnership(row,today=new Date().toISOString().slice(0,10)) {
  const start=dateOnly(row.start_date);return !row.end_date && !!start && start<=today;
}
function identityKey(user) { return user?JSON.stringify([user.accountId||user.adminId||user.username,user.memberId,[...(user.permissions||[])].sort(),[...(user.flatIds||[])].sort(),[...(user.roles||[])].sort()]):''; }
module.exports={can,canRead,permits,normalizeIdentity,scopesFor,passwordError,currentOwnership,identityKey,dateOnly};
