import Utils from "./config/utils.js";

const authPages = ["login", "register"];

export function applyAuthGuard(router) {
  router.beforeEach((to, _from, next) => {
    const user = Utils.getStore("user");
    if (!user && !authPages.includes(to.name)) {
      next({ name: "login" });
      return;
    }
    if (user && authPages.includes(to.name)) {
      next({ name: "home" });
      return;
    }
    next();
  });
}
