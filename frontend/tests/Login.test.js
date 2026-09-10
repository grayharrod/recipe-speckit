/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "../src/views/Login.vue";
import AuthServices from "../src/services/authServices.js";
import { mountView } from "./helpers.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const { wrapper, router } = await mountView(Login);
      await wrapper.get('input[name="username"]').setValue("jdoe");
      await wrapper.get('input[name="password"]').setValue("wrongpass");
      await submit(wrapper);

      expect(AuthServices.loginUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid username or password.");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountView(Login);
      await wrapper.get('input[name="password"]').setValue("password1");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountView(Login);
      await wrapper.get('input[name="username"]').setValue("jdoe");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
