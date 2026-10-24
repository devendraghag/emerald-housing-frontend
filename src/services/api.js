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
export const api={
  society:()=>http.get('/society').then(data),floors:()=>http.get('/floors').then(data),
  page:(type,page=0,{signal,search,status,floorNumber,size=PAGE_SIZE}={})=>http.get(`/${type}/page`,{params:{page,size,search:search||undefined,status:status||undefined,floorNumber:floorNumber||undefined},signal}).then(data),
  flatsByFloor:(number,{signal}={})=>http.get(`/flats/by-floor/${number}`,{signal}).then(data),
  all:type=>http.get(`/${type}`).then(data),
  get:(type,id,{signal}={})=>http.get(`/${type}/${id}`,{signal}).then(record),
  save:(type,id,body,etag)=>id?http.put(`/${type}/${id}`,body,conditional(etag)).then(record):http.post(`/${type}`,body).then(record),
  deactivate:(type,id,etag)=>http.patch(`/${type}/${id}/deactivate`,undefined,conditional(etag)).then(record),
  memberships:id=>http.get(`/members/${id}/flats`).then(data),
  assign:(id,body)=>http.post(`/members/${id}/flats`,body).then(data),
  end:(id,membershipId,endDate)=>http.patch(`/members/${id}/flats/${membershipId}/end`,{endDate}).then(data),
  accounts:(page=0)=>http.get('/accounts',{params:{page,size:PAGE_SIZE}}).then(data),
  createAccount:body=>http.post('/accounts',body).then(data),
  updateAccount:(id,body)=>http.put(`/accounts/${id}/permissions`,body).then(data),
  roles:()=>http.get('/access/roles').then(data),
  saveRole:(code,body)=>code?http.put(`/access/roles/${code}`,body).then(data):http.post('/access/roles',body).then(data),
  permissions:()=>http.get('/access/permissions').then(data),
  savePermission:(code,body)=>code?http.put(`/access/permissions/${code}`,body).then(data):http.post('/access/permissions',body).then(data),
  owners:({page=0,size=PAGE_SIZE,signal}={})=>http.get('/owners',{params:{page,size},signal}).then(data),
  registerOwner:body=>http.post('/owners',body).then(data),
  transferOwnership:body=>http.post('/owners/transfer',body).then(data),
  families:({page=0,flatId}={})=>http.get('/families',{params:{page,size:PAGE_SIZE,flatId:flatId||undefined}}).then(data),
  createFamily:body=>http.post('/families',body).then(data),
  updateFamily:(id,body)=>http.put(`/families/${id}`,body).then(data),
  deactivateFamily:(id,version)=>http.patch(`/families/${id}/deactivate`,{version}).then(data),
  audit:({service='members',entityType,entityId,before=0}={})=>http.get(`/${service}/audit`,{params:{entityType:entityType||undefined,entityId:entityId||undefined,before,limit:PAGE_SIZE}}).then(data)
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
