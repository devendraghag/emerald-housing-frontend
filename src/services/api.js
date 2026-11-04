import axios from 'axios';
import {PAGE_SIZE} from '../util/pagination.cjs';
import {normalizeIdentity} from '../util/access.cjs';
export {errorMessage} from '../util/contracts.cjs';
export const http=axios.create({baseURL:'/api/v1',timeout:20000,withCredentials:true,xsrfCookieName:null});
http.interceptors.request.use(async config=>{
  if(!['get','head','options'].includes((config.method||'get').toLowerCase())){
    const {data}=await http.get('/auth/csrf');config.headers[data.headerName]=data.token;
  }
  return config;
});
const data=response=>response.data;
const record=response=>({...response.data,_etag:response.headers.etag});
const conditional=etag=>etag?{headers:{'If-Match':etag}}:{};
// Coalesce labels requested by several owner pickers and serialize them to
// respect the Gateway bulkhead. Results are never cached across identities.
const flatLabelRequests=new Map();let flatLabelQueue=Promise.resolve();
function flatLabel(id){
  if(flatLabelRequests.has(id))return flatLabelRequests.get(id);
  const pending=flatLabelQueue.then(()=>http.get(`/flats/${id}`).then(record));
  flatLabelQueue=pending.catch(()=>{});flatLabelRequests.set(id,pending);
  pending.then(()=>flatLabelRequests.delete(id),()=>flatLabelRequests.delete(id));return pending;
}
export const api={flatLabel,
  society:()=>http.get('/society').then(data),floors:()=>http.get('/floors').then(data),
  page:(type,page=0,{signal,search,status,floorNumber,size=PAGE_SIZE}={})=>http.get(`/${type}/page`,{params:{page,size,search:search||undefined,status:status||undefined,floorNumber:floorNumber||undefined},signal}).then(data),
  flatsByFloor:(number,{signal}={})=>http.get(`/flats/by-floor/${number}`,{signal}).then(data),
  all:type=>http.get(`/${type}`).then(data),
  get:(type,id,{signal}={})=>http.get(`/${type}/${id}`,{signal}).then(record),
  save:(type,id,body,etag)=>id?http.put(`/${type}/${id}`,body,conditional(etag)).then(record):http.post(`/${type}`,body).then(record),
  deactivate:(type,id,etag)=>http.patch(`/${type}/${id}/deactivate`,undefined,conditional(etag)).then(record),
  activate:(type,id,etag)=>http.patch(`/${type}/${id}/activate`,undefined,conditional(etag)).then(record),
  memberships:id=>http.get(`/members/${id}/flats`).then(data),
  membershipsByFlat:flatId=>http.get(`/flats/${flatId}/memberships`).then(data),
  assign:(id,body)=>http.post(`/members/${id}/flats`,body).then(data),
  end:(id,membershipId,endDate)=>http.patch(`/members/${id}/flats/${membershipId}/end`,{endDate}).then(data),
  accounts:(page=0)=>http.get('/accounts',{params:{page,size:PAGE_SIZE}}).then(data),
  createAccount:body=>http.post('/accounts',body).then(data),
  updateAccount:(id,body)=>http.put(`/accounts/${id}/permissions`,body).then(data),
  roles:()=>http.get('/access/roles').then(data),
  saveRole:(code,body)=>code?http.put(`/access/roles/${code}`,body).then(data):http.post('/access/roles',body).then(data),
  permissions:()=>http.get('/access/permissions').then(data),
  savePermission:(code,body)=>code?http.put(`/access/permissions/${code}`,body).then(data):http.post('/access/permissions',body).then(data),
  owners:({page=0,size=PAGE_SIZE,signal,status,search,flatId,memberId}={})=>http.get('/owners',{params:{page,size,status,search:search||undefined,flatId:flatId||undefined,memberId:memberId||undefined},signal}).then(data),
  registerOwner:body=>http.post('/owners',body).then(data),
  transferOwnership:body=>http.post('/owners/transfer',body).then(data),
  families:({page=0,flatId}={})=>http.get('/families',{params:{page,size:PAGE_SIZE,flatId:flatId||undefined}}).then(data),
  createFamily:body=>http.post('/families',body).then(data),
  updateFamily:(id,body)=>http.put(`/families/${id}`,body).then(data),
  deactivateFamily:(id,version)=>http.patch(`/families/${id}/deactivate`,{version}).then(data),
  reactivateFamily:(id,version)=>http.patch(`/families/${id}/reactivate`,{version}).then(data),
  updateSociety:name=>http.put('/society',{name}).then(data),
  createFloor:floorNumber=>http.post('/floors',{floorNumber:Number(floorNumber)}).then(data),
  updateFloor:(currentNumber,floorNumber)=>http.put('/floors/'+currentNumber,{floorNumber:Number(floorNumber)}).then(data),
  resetAccountPassword:(id,password,version)=>http.put('/accounts/'+id+'/password',{password,version}).then(data),
  changeOwnPassword:body=>http.put('/accounts/me/password',body).then(data),
  rental:(resource,{flatId}={})=>http.get('/rental/'+resource,{params:{flatId:flatId||undefined}}).then(data),
  rentSchedules:({flatId}={})=>http.get('/rental/schedules',{params:{flatId:flatId||undefined}}).then(data),
  saveRentSchedule:(id,body)=>id?http.put('/rental/schedules/'+id,body).then(data):http.post('/rental/schedules',body).then(data),
  generateRent:period=>http.post('/rental/payments/generate',{period}).then(data),
  rentReceipts:id=>http.get('/rental/payments/'+id+'/receipts').then(data),
  recordRentReceipt:(id,body)=>http.post('/rental/payments/'+id+'/receipts',body).then(data),
  reconcileRentReceipt:(id,receiptId,body)=>http.patch('/rental/payments/'+id+'/receipts/'+receiptId+'/reconcile',body).then(data),
  createRental:(resource,body)=>http.post('/rental/'+resource,body).then(data),
  updateRental:(resource,id,body)=>http.patch('/rental/'+resource+'/'+id,body).then(data),
  maintenanceProgress:id=>http.get('/rental/maintenance/'+id+'/progress').then(data),
  addMaintenanceProgress:(id,body)=>http.post('/rental/maintenance/'+id+'/progress',body).then(data),
  viewingAction:(id,action,body)=>http.post('/rental/viewings/'+id+'/'+action,body).then(data),
  noticeFlatOptions:()=>http.get('/notices/flat-options').then(data),
  createNotice:body=>http.post('/notices',body).then(data),
  noticeBoard:()=>http.get('/notices/board').then(data),
  noticeReviewQueue:()=>http.get('/notices/admin/review').then(data),
  changeNoticeAudience:(id,body)=>http.patch(`/notices/admin/${id}/audience`,body).then(data),
  changeNoticeStatus:(id,status)=>http.patch(`/notices/admin/${id}/status`,{status}).then(data),
  noticeNotifications:()=>http.get('/notices/notifications').then(data),
  markNoticeNotificationRead:eventId=>http.patch(`/notices/notifications/${eventId}/read`).then(data),
  lostFoundBoard:()=>http.get('/lost-found/board').then(data),
  lostFoundNotifications:()=>http.get('/lost-found/notifications').then(data),
  markLostFoundNotificationRead:eventId=>http.patch(`/lost-found/notifications/${eventId}/read`).then(data),
  assignLostFoundFlat:(id,flatId)=>http.patch(`/lost-found/admin/reports/${id}/flat`,{flatId}).then(data),
  createLostFoundReport:body=>http.post('/lost-found',body).then(data),
  uploadLostFoundPhoto:(id,file)=>{const form=new FormData();form.append('photo',file);return http.post(`/lost-found/${id}/photo`,form).then(data);},
  submitLostFoundClaim:(id,identifyingDetails)=>http.post(`/lost-found/${id}/claims`,{identifyingDetails}).then(data),
  lostFoundAdminReports:()=>http.get('/lost-found/admin/reports').then(data),
  changeLostFoundStatus:(id,status)=>http.patch(`/lost-found/admin/reports/${id}/status`,{status}).then(data),
  lostFoundClaims:id=>http.get(`/lost-found/admin/reports/${id}/claims`).then(data),
  decideLostFoundClaim:(id,claimId,status)=>http.patch(`/lost-found/admin/reports/${id}/claims/${claimId}`,{status}).then(data),
  audit:({service='members',entityType,entityId,before=0}={})=>http.get('/'+service+'/audit',{params:{entityType:entityType||undefined,entityId:entityId||undefined,before,limit:PAGE_SIZE}}).then(data)
};
export const auth={
  current:()=>http.get('/accounts/me').then(({data})=>normalizeIdentity(data)),
  async login(username,password){await http.post('/auth/login',{username,password});return auth.current();},
  logout:()=>http.post('/auth/logout')
};
http.interceptors.response.use(response=>response,error=>{
  const url=error.config&&error.config.url,status=error.response&&error.response.status;
  if(status===401&&!['/auth/login','/auth/me','/accounts/me'].includes(url))window.dispatchEvent(new Event('emerald-session-expired'));
  return Promise.reject(error);
});
