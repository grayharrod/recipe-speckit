module.exports = (app) => {
  const RecipeIngredient = require("../controllers/recipeIngredient.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const router = require("express").Router();

  router.post(
    "/recipes/:recipeId/recipeIngredients/",
    [authenticateRoute],
    RecipeIngredient.create
  );
  router.get(
    "/recipes/:recipeId/recipeIngredients/",
    [authenticateRoute],
    RecipeIngredient.findAllForRecipe
  );
  router.put(
    "/recipes/:recipeId/recipeIngredients/:id",
    [authenticateRoute],
    RecipeIngredient.update
  );
  router.delete(
    "/recipes/:recipeId/recipeIngredients/:id",
    [authenticateRoute],
    RecipeIngredient.delete
  );

  app.use("/recipeapi", router);
};
