/**
 * Feature 3 — Manage Ingredients
 * Spec: features/feature-3-manage-ingredients.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RecipeDetail from "../src/views/RecipeDetail.vue";
import RecipeServices from "../src/services/RecipeServices.js";
import { mountView } from "./helpers.js";

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipe: vi.fn(),
  },
}));

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
