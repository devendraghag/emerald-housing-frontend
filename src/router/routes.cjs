// Shared route definitions allow guards to be exercised with memory history in tests.
function createRoutes({ Home, Login, RecordList, RecordForm, Memberships, NotFound, OptionsPlayground }) {
  return [
    { path: "/login", name: "login", component: Login, meta: { title: "Sign in", guestOnly: true } },
    { path: "/", component: Home, meta: { requiresAuth: true, title: "Overview" } },
    { path: "/vue-options", name: "vue-options", component: OptionsPlayground, meta: { requiresAuth: true, title: "Vue Options API" } },
    ...["members", "flats"].flatMap((type) => [
      {
        path: `/${type}`,
        component: RecordList,
        props: { type },
        meta: { requiresAuth: true, title: type === "members" ? "Members" : "Flats" },
      },
      {
        path: `/${type}/new`,
        component: RecordForm,
        props: { type },
        meta: { requiresAuth: true, title: `Add ${type === "members" ? "member" : "flat"}` },
      },
      {
        path: `/${type}/:id/edit`,
        component: RecordForm,
        props: (route) => ({ type, id: route.params.id }),
        meta: { requiresAuth: true, title: "Edit record" },
      },
    ]),
    {
      path: "/members/:id/memberships",
      component: Memberships,
      props: true,
      meta: { requiresAuth: true, title: "Flat memberships" },
    },
    {
      path: "/:pathMatch(.*)*",
      component: NotFound,
      meta: { requiresAuth: true, title: "Page not found" },
    },
  ];
}
module.exports = { createRoutes };
