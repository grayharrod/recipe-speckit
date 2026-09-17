/**
 * Feature 3 — Manage Ingredients
 * Spec: features/feature-3-manage-ingredients.md
 */

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditRecipe from "../src/views/EditRecipe.vue";
import RecipeServices from "../src/services/RecipeServices.js";
import IngredientServices from "../src/services/IngredientServices.js";
import { mountView } from "./helpers.js";

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipe: vi.fn(),
    addRecipeIngredient: vi.fn(),
    updateRecipeIngredient: vi.fn(),
    deleteRecipeIngredient: vi.fn(),
    updateRecipe: vi.fn(),
    uploadRecipeImage: vi.fn(),
    addRecipeStep: vi.fn(),
    updateRecipeStep: vi.fn(),
    deleteRecipeStep: vi.fn(),
  },
}));

vi.mock("../src/services/IngredientServices.js", () => ({
  default: {
    getIngredients: vi.fn(),
    addIngredient: vi.fn(),
  },
}));

const flour = { id: 3, name: "Flour", unit: "cup", userId: 1 };
const pancakeLine = {
  id: 10,
  quantity: 2,
  ingredientId: 3,
  ingredient: flour,
};

describe("Feature 3 — Manage Ingredients", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    RecipeServices.getRecipe.mockResolvedValue({
      data: {
        id: 5,
        name: "Pancakes",
        description: "Weekend breakfast.",
        recipeStep: [],
        recipeIngredient: [],
      },
    });
    IngredientServices.getIngredients.mockResolvedValue({ data: [flour] });
  });

  describe("US-3.4 — Attach, update, and remove ingredients on a Feature 2 recipe", () => {
    it("User adds a catalog ingredient to a recipe with a quantity", async () => {
      RecipeServices.addRecipeIngredient.mockResolvedValue({
        data: pancakeLine,
      });
      const { wrapper } = await mountView(EditRecipe, {
        initialRoute: { name: "editRecipe", params: { id: "5" } },
      });
      await flushPromises();

      wrapper.vm.selectedIngredientId = 3;
      await wrapper.get('input[name="quantity"]').setValue("2");
      await wrapper
        .findAll("button")
        .find((btn) => btn.text() === "Add")
        .trigger("click");
      await flushPromises();

      expect(RecipeServices.addRecipeIngredient).toHaveBeenCalledWith({
        recipeId: "5",
        ingredientId: 3,
        quantity: 2,
      });
      expect(wrapper.text()).toContain("2 cup Flour");
    });

    it("User cannot attach an ingredient without a quantity", async () => {
      const { wrapper } = await mountView(EditRecipe, {
        initialRoute: { name: "editRecipe", params: { id: "5" } },
      });
      await flushPromises();

      wrapper.vm.selectedIngredientId = 3;
      await wrapper
        .findAll("button")
        .find((btn) => btn.text() === "Add")
        .trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Quantity is required.");
      expect(RecipeServices.addRecipeIngredient).not.toHaveBeenCalled();
    });

    it("User updates a recipe ingredient quantity", async () => {
      RecipeServices.getRecipe.mockResolvedValue({
        data: {
          id: 5,
          name: "Pancakes",
          description: "Weekend breakfast.",
          recipeStep: [],
          recipeIngredient: [{ ...pancakeLine }],
        },
      });
      RecipeServices.updateRecipeIngredient.mockResolvedValue({
        data: { ...pancakeLine, quantity: 3 },
      });

      const { wrapper } = await mountView(EditRecipe, {
        initialRoute: { name: "editRecipe", params: { id: "5" } },
      });
      await flushPromises();

      const saveBtn = wrapper.get('[aria-label="Save ingredient quantity"]');
      expect(saveBtn.attributes("disabled")).toBeDefined();

      wrapper.vm.recipe.recipeIngredient[0].quantity = 3;
      await wrapper.vm.$nextTick();
      expect(saveBtn.attributes("disabled")).toBeUndefined();
      expect(saveBtn.classes().join(" ")).toMatch(/primary|elevated/);

      await saveBtn.trigger("click");
      await flushPromises();

      expect(RecipeServices.updateRecipeIngredient).toHaveBeenCalledWith({
        recipeId: "5",
        id: 10,
        quantity: 3,
      });
      expect(wrapper.text()).toContain("3 cup Flour");
    });

    it("User removes an ingredient from a recipe", async () => {
      RecipeServices.getRecipe.mockResolvedValue({
        data: {
          id: 5,
          name: "Pancakes",
          description: "Weekend breakfast.",
          recipeStep: [],
          recipeIngredient: [{ ...pancakeLine }],
        },
      });
      RecipeServices.deleteRecipeIngredient.mockResolvedValue({
        data: { message: "RecipeIngredient was deleted successfully!" },
      });

      const { wrapper } = await mountView(EditRecipe, {
        initialRoute: { name: "editRecipe", params: { id: "5" } },
      });
      await flushPromises();

      await wrapper.get('[aria-label="Remove ingredient"]').trigger("click");
      await flushPromises();

      expect(RecipeServices.deleteRecipeIngredient).toHaveBeenCalledWith({
        recipeId: "5",
        id: 10,
      });
      expect(wrapper.text()).not.toContain("2 cup Flour");
    });
  });
});
