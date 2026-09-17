/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import ThemeToggle from "../src/components/ThemeToggle.vue";
import Utils from "../src/config/utils.js";
import { mountView } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.6 — Switch between dark and bright mode", () => {
    it("Button was clicked", async () => {
      Utils.setStore("user", {
        userId: 1,
        fName: "Jane",
        token: "valid-token",
      });

      const { wrapper, vuetify } = await mountView(ThemeToggle);

      expect(wrapper.get('[data-testid="theme-toggle"]').exists()).toBe(true);
      expect(vuetify.theme.global.name.value).toBe("bright");

      await wrapper.get('[data-testid="theme-toggle"]').trigger("click");
      await flushPromises();
      expect(vuetify.theme.global.name.value).toBe("dark");

      await wrapper.get('[data-testid="theme-toggle"]').trigger("click");
      await flushPromises();
      expect(vuetify.theme.global.name.value).toBe("bright");
    });
  });
});
