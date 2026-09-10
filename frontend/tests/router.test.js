/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { createRouter, createMemoryHistory } from "vue-router";
import { beforeEach, describe, expect, it } from "vitest";
import { applyAuthGuard } from "../src/router.guard.js";
import Utils from "../src/config/utils.js";

const stub = { template: "<div />" };

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "login", component: stub },
      { path: "/register", name: "register", component: stub },
      { path: "/home", name: "home", component: stub },
    ],
  });
  applyAuthGuard(router);
  return router;
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        fName: "Jane",
        token: "valid-token",
      });
      const router = makeRouter();
      await router.push({ name: "login" });
      await router.isReady();
      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const router = makeRouter();
      await router.push({ name: "home" });
      await router.isReady();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
