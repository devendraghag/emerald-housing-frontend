import { createRouter, createWebHistory } from "vue-router";
import store from "../store";
import { createAuthGuard } from "../util/route-guards.cjs";
import { createRoutes } from "./routes.cjs";
import Home from "../views/Home.vue";
const CommunityManagement = () => import('../views/CommunityManagement.vue');
const Profile = () => import('../views/Profile.vue');
const Forbidden = () => import('../views/Forbidden.vue');
const Login = () => import("../views/Login.vue");
const RecordList = () => import("../views/RecordList.vue");
const RecordForm = () => import("../views/RecordForm.vue");
const Memberships = () => import("../views/Memberships.vue");
const OptionsPlayground = () => import("../views/OptionsPlayground.vue");
const NotFound = () => import("../views/NotFound.vue");
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: createRoutes({ Home, Login, RecordList, RecordForm, Memberships, NotFound, OptionsPlayground, CommunityManagement, Profile, Forbidden }),
});
router.beforeEach(createAuthGuard(store));
router.afterEach((to, from, failure) => {
  if (failure) return;
  document.title = `${to.meta.title} | Emerald Housing`;
});
export default router;
