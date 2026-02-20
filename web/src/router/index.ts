import { createRouter, createWebHistory } from "vue-router";
import Agents from "../views/Agents.vue";
import Payments from "../views/Payments.vue";
import Compute from "../views/Compute.vue";
import CovenantClaw from "../views/CovenantClaw.vue";
import Alfred from "../views/Alfred.vue";
import Auth from "../views/Auth.vue";

export function hasJwt(): boolean {
  return !!localStorage.getItem("jwt");
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/sign",
      name: "Auth",
      component: Auth,
    },
    {
      path: "/agents",
      name: "Agents",
      component: Agents,
      meta: { requiresAuth: true },
    },
    {
      path: "/payments",
      name: "Payments",
      component: Payments,
      meta: { requiresAuth: true },
    },
    {
      path: "/compute",
      name: "Compute",
      component: Compute,
      meta: { requiresAuth: true },
    },
    {
      path: "/covenantclaw",
      name: "CovenantClaw",
      component: CovenantClaw,
      meta: { requiresAuth: true },
    },
    {
      path: "/alfred",
      name: "Alfred",
      component: Alfred,
      meta: { requiresAuth: true },
    },

    // legacy redirect
    {
      path: "/build",
      redirect: "/covenantclaw",
    },

    // legacy redirect
    {
      path: "/command",
      redirect: "/compute",
    },

    // optional: default redirect
    {
      path: "/",
      redirect: "/agents",
    },
  ],
});

router.beforeEach((to) => {
  const authed = hasJwt();

  // not logged in → force /sign
  if (to.meta.requiresAuth && !authed) {
    return { name: "Auth" };
  }

  // logged in → never allow /sign
  //if (to.name === "Auth" && authed) {
  //  return { name: "Agents" };
  //}
});

export default router;
