import apiClient from "./services";

export default {
  getRecipes() {
    return apiClient.get("recipes");
  },
  getRecipesByUserId(userId) {
    return apiClient.get("recipes/user/" + userId);
  },
  getRecipe(id) {
    return apiClient.get("recipes/" + id);
  },
  addRecipe(recipe) {
    return apiClient.post("recipes", recipe);
  },
  updateRecipe(recipeId, recipe) {
    return apiClient.put("recipes/" + recipeId, recipe);
  },
  deleteRecipe(recipeId) {
    return apiClient.delete("recipes/" + recipeId);
  },
  uploadRecipeImage(recipeId, file) {
    const formData = new FormData();
    formData.append("image", file);
    return apiClient.post("recipes/" + recipeId + "/image", formData);
  },
  exportRecipe(id, format) {
    return apiClient.get("recipes/" + id + "/export", {
      params: { format },
      responseType: "blob",
    });
  },
  exportAllRecipes() {
    return apiClient.get("recipes/export", {
      params: { format: "xlsx" },
      responseType: "blob",
    });
  },

  getRecipeStepsForRecipe(recipeId) {
    return apiClient.get("recipes/" + recipeId + "/recipeSteps");
  },
  addRecipeStep(recipeStep) {
    return apiClient.post(
      "recipes/" + recipeStep.recipeId + "/recipeSteps",
      recipeStep
    );
  },
  updateRecipeStep(recipeStep) {
    return apiClient.put(
      "recipes/" + recipeStep.recipeId + "/recipeSteps/" + recipeStep.id,
      recipeStep
    );
  },
  deleteRecipeStep(recipeStep) {
    return apiClient.delete(
      "recipes/" + recipeStep.recipeId + "/recipeSteps/" + recipeStep.id
    );
  },

  getRecipeIngredientsForRecipe(recipeId) {
    return apiClient.get("recipes/" + recipeId + "/recipeIngredients");
  },
  addRecipeIngredient(recipeIngredient) {
    return apiClient.post(
      "recipes/" + recipeIngredient.recipeId + "/recipeIngredients",
      recipeIngredient
    );
  },
  updateRecipeIngredient(recipeIngredient) {
    return apiClient.put(
      "recipes/" +
        recipeIngredient.recipeId +
        "/recipeIngredients/" +
        recipeIngredient.id,
      recipeIngredient
    );
  },
  deleteRecipeIngredient(recipeIngredient) {
    return apiClient.delete(
      "recipes/" +
        recipeIngredient.recipeId +
        "/recipeIngredients/" +
        recipeIngredient.id
    );
  },
};
