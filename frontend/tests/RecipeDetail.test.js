/**
 * Feature 3 — Manage Ingredients
 * Spec: features/feature-3-manage-ingredients.md
 * Feature 5 — Export Recipes
 * Spec: features/feature-5-export-recipes.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeDetail from "../src/views/RecipeDetail.vue";
import RecipeServices from "../src/services/RecipeServices.js";
import { mountView } from "./helpers.js";

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipe: vi.fn(),
    exportRecipe: vi.fn(),
  },
}));

const clickLabeled = async (wrapper, text) => {
  const btn = wrapper
    .findAll("button")
    .find((node) => node.text().replace(/\s+/g, " ").trim() === text);
  expect(btn).toBeTruthy();
  await btn.trigger("click");
};

const pancakesDetail = {
  id: 5,
  name: "Pancakes",
  description: "Weekend breakfast.",
  servings: 4,
  time: 20,
  category: "Breakfast",
  recipeStep: [
    { id: 1, stepNumber: 1, instruction: "Whisk the dry ingredients." },
  ],
  recipeIngredient: [
    {
      id: 10,
      quantity: 2,
      ingredient: { id: 3, name: "Flour", unit: "cup" },
    },
  ],
};

describe("Feature 3 — Manage Ingredients", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-3.4 — Attach, update, and remove ingredients on a Feature 2 recipe", () => {
    it("Recipe detail shows only that recipe's ingredients", async () => {
      RecipeServices.getRecipe.mockResolvedValue({
        data: {
          id: 5,
          name: "Pancakes",
          description: "Weekend breakfast.",
          recipeStep: [],
          recipeIngredient: [
            {
              id: 10,
              quantity: 2,
              ingredient: { id: 3, name: "Flour", unit: "cup" },
            },
          ],
        },
      });

      const { wrapper } = await mountView(RecipeDetail, {
        initialRoute: { name: "recipe", params: { id: "5" } },
      });
      await flushPromises();

      expect(wrapper.text()).toContain("2 cup Flour");
      expect(wrapper.text()).not.toContain("Eggs");
    });
  });
});

describe("Feature 5 — Export Recipes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    RecipeServices.getRecipe.mockResolvedValue({ data: pancakesDetail });
    RecipeServices.exportRecipe.mockResolvedValue({
      data: new Blob(["%PDF-test"], { type: "application/pdf" }),
      headers: {
        "content-disposition": 'attachment; filename="Pancakes.pdf"',
      },
    });
  });

  describe("US-5.1 — Export a recipe as PDF", () => {
    it("User exports an owned recipe as PDF", async () => {
      const { wrapper } = await mountView(RecipeDetail, {
        initialRoute: { name: "recipe", params: { id: "5" } },
      });
      await flushPromises();

      await clickLabeled(wrapper, "Export PDF");
      await flushPromises();

      expect(RecipeServices.exportRecipe).toHaveBeenCalledWith("5", "pdf");
    });

    it("Recipe export PDF fails on the client", async () => {
      RecipeServices.exportRecipe.mockRejectedValue({
        response: { status: 500, data: { message: "fail" } },
      });

      const { wrapper } = await mountView(RecipeDetail, {
        initialRoute: { name: "recipe", params: { id: "5" } },
      });
      await flushPromises();

      await clickLabeled(wrapper, "Export PDF");
      await flushPromises();

      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Unable to export recipe.");
      expect(wrapper.text()).toContain("Pancakes");
    });
  });

  describe("US-5.2 — Export a recipe as Excel", () => {
    it("User exports an owned recipe as Excel", async () => {
      RecipeServices.exportRecipe.mockResolvedValue({
        data: new Blob(["xlsx"], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        headers: {
          "content-disposition": 'attachment; filename="Pancakes.xlsx"',
        },
      });

      const { wrapper } = await mountView(RecipeDetail, {
        initialRoute: { name: "recipe", params: { id: "5" } },
      });
      await flushPromises();

      await clickLabeled(wrapper, "Export Excel");
      await flushPromises();

      expect(RecipeServices.exportRecipe).toHaveBeenCalledWith("5", "xlsx");
    });

    it("Recipe export Excel fails on the client", async () => {
      RecipeServices.exportRecipe.mockRejectedValue({
        response: { status: 500, data: { message: "fail" } },
      });

      const { wrapper } = await mountView(RecipeDetail, {
        initialRoute: { name: "recipe", params: { id: "5" } },
      });
      await flushPromises();

      await clickLabeled(wrapper, "Export Excel");
      await flushPromises();

      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Unable to export recipe.");
    });
  });
});
