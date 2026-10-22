import axios from "axios";
import { PAGE_SIZE } from "../util/pagination.cjs";
export { errorMessage } from "../util/contracts.cjs";
export const http = axios.create({
  baseURL: "/api/v1",
  timeout: 20000,
  withCredentials: true,
  // Use the masked CSRF token from Gateway, not Axios automatic cookie copying.
  xsrfCookieName: null,
});
// The existing gateway requires a CSRF token on writes.
http.interceptors.request.use(async (config) => {
  if (!["get", "head", "options"].includes(config.method)) {
    const { data } = await http.get("/auth/csrf");
    config.headers[data.headerName] = data.token;
  }
  return config;
});
export const api = {
  society: () => http.get("/society").then((r) => r.data),
  floors: () => http.get("/floors").then((r) => r.data),
  page: (type, page = 0, { signal } = {}) =>
    http
      .get(`/${type}/page`, { params: { page, size: PAGE_SIZE }, signal })
      .then((r) => r.data),
  flatsByFloor: (number, { signal } = {}) => http.get(`/flats/by-floor/${number}`, { signal }).then(({ data }) => data),
  all: (type) => http.get(`/${type}`).then((r) => r.data),
  get: (type, id) => http.get(`/${type}/${id}`).then((r) => r.data),
  save: (type, id, data) =>
    id
      ? http.put(`/${type}/${id}`, data).then((r) => r.data)
      : http.post(`/${type}`, data).then((r) => r.data),
  deactivate: (type, id) =>
    http.patch(`/${type}/${id}/deactivate`).then((r) => r.data),
  memberships: (id) => http.get(`/members/${id}/flats`).then((r) => r.data),
  assign: (id, data) =>
    http.post(`/members/${id}/flats`, data).then((r) => r.data),
  end: (id, membershipId, endDate) =>
    http
      .patch(`/members/${id}/flats/${membershipId}/end`, { endDate })
      .then((r) => r.data),
};

export const auth = {
  current: () => http.get('/auth/me').then(r => r.data),
  async login(username, password) {
    const { data } = await http.post('/auth/login', { username, password });
    await http.get('/auth/csrf');
    return data;
  },
  logout: () => http.post('/auth/logout'),
};
http.interceptors.response.use(response => response, error => {
  const url = error.config && error.config.url;
  if (error.response && error.response.status === 401 && url !== '/auth/login' && url !== '/auth/me') {
    window.dispatchEvent(new Event('emerald-session-expired'));
  }
  return Promise.reject(error);
});
