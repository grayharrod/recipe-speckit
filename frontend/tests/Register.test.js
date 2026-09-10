/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { mountView } from "./helpers.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const fill = async (wrapper, values) => {
  if (values.fName !== undefined) {
    await wrapper.get('input[name="fName"]').setValue(values.fName);
  }
  if (values.lName !== undefined) {
    await wrapper.get('input[name="lName"]').setValue(values.lName);
  }
  if (values.email !== undefined) {
    await wrapper.get('input[name="email"]').setValue(values.email);
  }
  if (values.username !== undefined) {
    await wrapper.get('input[name="username"]').setValue(values.username);
  }
  if (values.password !== undefined) {
    await wrapper.get('input[name="password"]').setValue(values.password);
  }
  if (values.confirmPassword !== undefined) {
    await wrapper
      .get('input[name="confirmPassword"]')
      .setValue(values.confirmPassword);
  }
};

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
};

const validForm = {
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password1",
  confirmPassword: "password1",
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with missing email", async () => {
      const { wrapper } = await mountView(Register);
      await fill(wrapper, { ...validForm, email: "" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Email is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountView(Register);
      await fill(wrapper, { ...validForm, email: "notanemail" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountView(Register);
      await fill(wrapper, { ...validForm, username: "" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountView(Register);
      await fill(wrapper, {
        ...validForm,
        password: "short",
        confirmPassword: "short",
      });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountView(Register);
      await fill(wrapper, {
        ...validForm,
        password: "password1",
        confirmPassword: "password2",
      });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User registers with a duplicate username", async () => {
      AuthServices.registerUser.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Username is already taken." },
        },
      });

      const { wrapper } = await mountView(Register);
      await fill(wrapper, validForm);
      await submit(wrapper);

      expect(AuthServices.registerUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Username is already taken.");
    });

    it("User registers with a duplicate email", async () => {
      AuthServices.registerUser.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Email is already registered." },
        },
      });

      const { wrapper } = await mountView(Register);
      await fill(wrapper, {
        ...validForm,
        email: "jane@example.com",
      });
      await submit(wrapper);

      expect(AuthServices.registerUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Email is already registered.");
    });
  });
});
