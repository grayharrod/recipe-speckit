/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/UserServices.js";
import Utils from "../src/config/utils.js";
import { createTestRouter, createTestVuetify } from "./helpers.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/UserServices.js", () => ({
  default: {
    getUser: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    addUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const signedInUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
  token: "test-token",
};

const menuRoutes = [
  { path: "/", name: "login", component: { template: "<div>login</div>" } },
  {
    path: "/recipes",
    name: "recipes",
    component: { template: "<div>recipes</div>" },
  },
  {
    path: "/ingredients",
    name: "ingredients",
    component: { template: "<div>ingredients</div>" },
  },
];

async function mountMenuBar() {
  Utils.setStore("user", signedInUser);
  const vuetify = createTestVuetify();
  const router = createTestRouter(menuRoutes);
  await router.push({ name: "recipes" });
  await router.isReady();

  const root = mount(
    {
      components: { MenuBar },
      template: "<v-app><MenuBar /></v-app>",
    },
    {
      global: {
        plugins: [vuetify, router],
      },
    }
  );
  await flushPromises();

  const wrapper = root.findComponent(MenuBar);
  activeRoot = root;
  return { root, wrapper, router };
}

async function openProfileMenu(wrapper) {
  const iconButtons = wrapper.findAll("button.v-btn--icon");
  expect(iconButtons.length).toBeGreaterThan(0);
  await iconButtons[0].trigger("click");
  await flushPromises();
}

function menuText(root, wrapper) {
  return `${wrapper.text()} ${root.text()} ${document.body.textContent || ""}`;
}

function findButtonByText(root, wrapper, text) {
  const candidates = [...root.findAll("button"), ...wrapper.findAll("button")];
  return candidates.find((n) => (n.text() || "").includes(text));
}

async function clickByText(root, wrapper, text) {
  const node = findButtonByText(root, wrapper, text);
  expect(node).toBeTruthy();
  await node.trigger("click");
  await flushPromises();
}

async function openEditProfile(root, wrapper) {
  await openProfileMenu(wrapper);
  await clickByText(root, wrapper, "Edit Profile");
  await flushPromises();
}

async function fillProfileField(root, wrapper, name, value) {
  let input = root.find(`input[name="${name}"]`);
  if (!input.exists()) {
    input = wrapper.find(`input[name="${name}"]`);
  }
  if (!input.exists()) {
    const bodyInput = document.body.querySelector(`input[name="${name}"]`);
    expect(bodyInput).toBeTruthy();
    bodyInput.focus();
    bodyInput.value = value;
    bodyInput.dispatchEvent(new Event("input", { bubbles: true }));
    bodyInput.dispatchEvent(new Event("change", { bubbles: true }));
    await flushPromises();
    return;
  }
  await input.setValue(value);
  await flushPromises();
}

function fieldValue(root, wrapper, name) {
  const input = root.find(`input[name="${name}"]`);
  if (input.exists()) return input.element.value;
  const fromWrapper = wrapper.find(`input[name="${name}"]`);
  if (fromWrapper.exists()) return fromWrapper.element.value;
  return document.body.querySelector(`input[name="${name}"]`)?.value;
}

let activeRoot = null;

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (activeRoot) {
      activeRoot.unmount();
      activeRoot = null;
    }
    document.body.innerHTML = "";
    await flushPromises();
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { root, wrapper } = await mountMenuBar();
      await openProfileMenu(wrapper);

      const text = menuText(root, wrapper);
      expect(text).toContain("Jane Doe");
      expect(text).toContain("jdoe");
      expect(text).toContain("jdoe@example.com");
      expect(text).toContain("Edit Profile");
      expect(text).toMatch(/Log out/);
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);

      expect(menuText(root, wrapper)).toMatch(/Edit Profile/);
      expect(fieldValue(root, wrapper, "fName")).toBe("Jane");
      expect(fieldValue(root, wrapper, "lName")).toBe("Doe");
      expect(fieldValue(root, wrapper, "email")).toBe("jdoe@example.com");
      expect(fieldValue(root, wrapper, "username")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);
      await fillProfileField(root, wrapper, "fName", "Changed");
      await clickByText(root, wrapper, "Cancel");

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      UserServices.updateUser.mockResolvedValue({
        data: {
          id: 1,
          fName: "Janet",
          lName: "Smith",
          email: "janet@example.com",
          username: "jsmith",
          role: "worker",
        },
      });

      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);
      await fillProfileField(root, wrapper, "fName", "Janet");
      await fillProfileField(root, wrapper, "lName", "Smith");
      await fillProfileField(root, wrapper, "email", "janet@example.com");
      await fillProfileField(root, wrapper, "username", "jsmith");
      await clickByText(root, wrapper, "Save");

      expect(UserServices.updateUser).toHaveBeenCalled();
      const stored = Utils.getStore("user");
      expect(stored.fName).toBe("Janet");
      expect(stored.lName).toBe("Smith");
      expect(stored.email).toBe("janet@example.com");
      expect(stored.username).toBe("jsmith");
      expect(stored.token).toBe("test-token");

      await openProfileMenu(wrapper);
      const text = menuText(root, wrapper);
      expect(text).toContain("Janet Smith");
      expect(text).toContain("jsmith");
      expect(text).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);
      await fillProfileField(root, wrapper, "email", "notanemail");
      await clickByText(root, wrapper, "Save");

      expect(menuText(root, wrapper)).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);
      await fillProfileField(root, wrapper, "password", "password1");
      await fillProfileField(root, wrapper, "confirmPassword", "password2");
      await clickByText(root, wrapper, "Save");

      expect(menuText(root, wrapper)).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);
      await fillProfileField(root, wrapper, "password", "short");
      await fillProfileField(root, wrapper, "confirmPassword", "short");
      await clickByText(root, wrapper, "Save");

      expect(menuText(root, wrapper)).toContain(
        "Password must be at least 8 characters."
      );
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Username is already taken." },
        },
      });

      const { root, wrapper } = await mountMenuBar();
      await openEditProfile(root, wrapper);
      await clickByText(root, wrapper, "Save");

      const hasAlert =
        wrapper.find(".v-alert").exists() ||
        root.find(".v-alert").exists() ||
        !!document.body.querySelector(".v-alert");
      expect(hasAlert).toBe(true);
      expect(menuText(root, wrapper)).toContain("Username is already taken.");
      expect(menuText(root, wrapper)).toMatch(/Edit Profile/);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      AuthServices.logoutUser.mockResolvedValue({
        data: { message: "Logged out successfully." },
      });

      const { root, wrapper, router } = await mountMenuBar();
      await openProfileMenu(wrapper);
      const logOutBtn = findButtonByText(root, wrapper, "Log out");
      expect(logOutBtn).toBeTruthy();
      await wrapper.vm.logout();
      await flushPromises();
      await nextTick();

      expect(AuthServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { root, wrapper } = await mountMenuBar();
      expect(wrapper.text()).not.toContain("Sign out");
      await openProfileMenu(wrapper);
      expect(menuText(root, wrapper)).not.toContain("Sign out");
    });
  });
});
