import { createRouter, createWebHistory } from "vue-router";
import { applyAuthGuard } from "./router.guard.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("./views/Register.vue"),
    },
    {
      path: "/home",
      name: "home",
      component: () => import("./views/RecipeList.vue"),
    },
    {
      path: "/recipes",
      redirect: { name: "home" },
    },
    {
      path: "/recipe/:id",
      name: "recipe",
      props: true,
      component: () => import("./views/RecipeDetail.vue"),
    },
    {
      path: "/recipe/:id/edit",
      name: "editRecipe",
      props: true,
      component: () => import("./views/EditRecipe.vue"),
    },
  ],
});

applyAuthGuard(router);

export default router;
