/**
 * Feature 5 — Export Recipes
 * Spec: features/feature-5-export-recipes.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeList from "../src/views/RecipeList.vue";
import RecipeServices from "../src/services/RecipeServices.js";
import { mountView } from "./helpers.js";

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipes: vi.fn(),
    addRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    uploadRecipeImage: vi.fn(),
    exportAllRecipes: vi.fn(),
  },
}));

const clickLabeled = async (wrapper, text) => {
  const btn = wrapper
    .findAll("button")
    .find((node) => node.text().replace(/\s+/g, " ").trim() === text);
  expect(btn).toBeTruthy();
  await btn.trigger("click");
};

describe("Feature 5 — Export Recipes", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    RecipeServices.getRecipes.mockResolvedValue({
      data: [
        { id: 1, name: "Chili" },
        { id: 2, name: "Pancakes" },
      ],
    });
    RecipeServices.exportAllRecipes.mockResolvedValue({
      data: new Blob(["xlsx"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      headers: {
        "content-disposition": 'attachment; filename="my-recipes.xlsx"',
      },
    });
  });

  describe("US-5.3 — Export all my recipes as Excel", () => {
    it("User exports all owned recipes as Excel from the list", async () => {
      const { wrapper } = await mountView(RecipeList, {
        initialRoute: { name: "home" },
      });
      await flushPromises();

      await clickLabeled(wrapper, "Export all as Excel");
      await flushPromises();

      expect(RecipeServices.exportAllRecipes).toHaveBeenCalled();
    });

    it("Collection recipe export fails on the client", async () => {
      RecipeServices.exportAllRecipes.mockRejectedValue({
        response: { status: 500, data: { message: "fail" } },
      });

      const { wrapper } = await mountView(RecipeList, {
        initialRoute: { name: "home" },
      });
      await flushPromises();

      await clickLabeled(wrapper, "Export all as Excel");
      await flushPromises();

      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Unable to export recipes.");
    });
  });
});
