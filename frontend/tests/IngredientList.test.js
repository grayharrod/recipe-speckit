/**
 * Feature 3 — Manage Ingredients
 * Spec: features/feature-3-manage-ingredients.md
 */

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import IngredientList from "../src/views/IngredientList.vue";
import MenuBar from "../src/components/MenuBar.vue";
import IngredientServices from "../src/services/IngredientServices.js";
import Utils from "../src/config/utils.js";
import { createTestRouter, createTestVuetify, mountView } from "./helpers.js";

vi.mock("../src/services/IngredientServices.js", () => ({
  default: {
    getIngredients: vi.fn(),
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    deleteIngredient: vi.fn(),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

const signedInUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  token: "valid-token",
};

const clickLabeled = async (wrapper, text) => {
  const btn = wrapper
    .findAll("button")
    .find((node) => node.text().replace(/\s+/g, " ").trim() === text);
  await btn.trigger("click");
};

describe("Feature 3 — Manage Ingredients", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Utils.setStore("user", signedInUser);
    IngredientServices.getIngredients.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — View and create ingredients on the catalog page", () => {
    it("User opens the Ingredients catalog from MenuBar", async () => {
      const vuetify = createTestVuetify();
      const router = createTestRouter([
        { path: "/home", name: "home", component: { template: "<div>home</div>" } },
        {
          path: "/ingredients",
          name: "ingredients",
          component: { template: "<div>ingredients</div>" },
        },
      ]);
      await router.push("/home");
      await router.isReady();
      const wrapper = mount(
        { components: { MenuBar }, template: "<v-app><MenuBar /></v-app>" },
        { global: { plugins: [vuetify, router] } }
      );
      await flushPromises();
      expect(wrapper.getComponent(MenuBar).text()).toContain("Ingredients");

      const { wrapper: page } = await mountView(IngredientList, {
        initialRoute: { name: "ingredients" },
      });
      await flushPromises();
      expect(page.get("h1").text()).toBe("Ingredients");
    });

    it("Signed-in user with no ingredients sees the empty state", async () => {
      const { wrapper } = await mountView(IngredientList);
      await flushPromises();
      expect(wrapper.text()).toContain(
        "No ingredients yet. Add your first ingredient."
      );
    });

    it("User creates an ingredient on the catalog page", async () => {
      IngredientServices.addIngredient.mockResolvedValue({
        data: { id: 1, name: "Flour", unit: "cup", userId: 1 },
      });
      IngredientServices.getIngredients
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Flour", unit: "cup", userId: 1 }],
        });

      const { wrapper } = await mountView(IngredientList);
      await flushPromises();
      await clickLabeled(wrapper, "+ Add Ingredient");
      await wrapper.get('input[name="name"]').setValue("Flour");
      await clickLabeled(wrapper, "Add Ingredient");
      await flushPromises();

      expect(IngredientServices.addIngredient).toHaveBeenCalledWith({
        name: "Flour",
        unit: "cup",
      });
      expect(wrapper.text()).toContain("Flour");
    });

    it("User creates an ingredient with an empty name", async () => {
      const { wrapper } = await mountView(IngredientList);
      await flushPromises();
      await clickLabeled(wrapper, "+ Add Ingredient");
      await clickLabeled(wrapper, "Add Ingredient");
      await flushPromises();

      expect(wrapper.text()).toContain("Ingredient name is required.");
      expect(IngredientServices.addIngredient).not.toHaveBeenCalled();
    });
  });

  describe("US-3.2 — Edit a private ingredient", () => {
    it("User updates an ingredient name and unit", async () => {
      IngredientServices.getIngredients.mockResolvedValue({
        data: [{ id: 1, name: "Flour", unit: "cup", userId: 1 }],
      });
      IngredientServices.updateIngredient.mockResolvedValue({
        data: { id: 1, name: "All-purpose flour", unit: "gram", userId: 1 },
      });

      const { wrapper } = await mountView(IngredientList);
      await flushPromises();
      await wrapper.get('[aria-label="Edit ingredient"]').trigger("click");
      await wrapper.get('input[name="name"]').setValue("All-purpose flour");
      wrapper.vm.formIngredient.unit = "gram";
      await clickLabeled(wrapper, "Save Ingredient");
      await flushPromises();

      expect(IngredientServices.updateIngredient).toHaveBeenCalledWith({
        id: 1,
        name: "All-purpose flour",
        unit: "gram",
      });
    });
  });

  describe("US-3.3 — Delete a private ingredient", () => {
    it("User confirms deleting an ingredient", async () => {
      IngredientServices.getIngredients
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Flour", unit: "cup", userId: 1 }],
        })
        .mockResolvedValueOnce({ data: [] });
      IngredientServices.deleteIngredient.mockResolvedValue({
        data: { message: "Ingredient was deleted successfully!" },
      });

      const { wrapper } = await mountView(IngredientList);
      await flushPromises();
      await wrapper.get('[aria-label="Delete ingredient"]').trigger("click");
      await clickLabeled(wrapper, "Delete");
      await flushPromises();

      expect(IngredientServices.deleteIngredient).toHaveBeenCalledWith(1);
    });

    it("User cancels deleting an ingredient", async () => {
      IngredientServices.getIngredients.mockResolvedValue({
        data: [{ id: 1, name: "Flour", unit: "cup", userId: 1 }],
      });

      const { wrapper } = await mountView(IngredientList);
      await flushPromises();
      await wrapper.get('[aria-label="Delete ingredient"]').trigger("click");
      await clickLabeled(wrapper, "Cancel");
      await flushPromises();

      expect(IngredientServices.deleteIngredient).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Flour");
    });
  });
});
