module.exports = (app) => {
  const RecipeStep = require("../controllers/recipeStep.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const router = require("express").Router();

  router.post(
    "/recipes/:recipeId/recipeSteps/",
    [authenticateRoute],
    RecipeStep.create
  );
  router.get(
    "/recipes/:recipeId/recipeSteps/",
    [authenticateRoute],
    RecipeStep.findAllForRecipe
  );
  router.put(
    "/recipes/:recipeId/recipeSteps/:id",
    [authenticateRoute],
    RecipeStep.update
  );
  router.delete(
    "/recipes/:recipeId/recipeSteps/:id",
    [authenticateRoute],
    RecipeStep.delete
  );

  app.use("/recipeapi", router);
};
