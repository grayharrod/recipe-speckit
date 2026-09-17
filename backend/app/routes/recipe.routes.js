module.exports = (app) => {
  const Recipe = require("../controllers/recipe.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const { handleImageUpload } = require("../middleware/recipeUpload");
  const router = require("express").Router();

  router.post("/recipes/", [authenticateRoute], Recipe.create);
  router.get("/recipes/", [authenticateRoute], Recipe.findAll);
  router.get(
    "/recipes/user/:userId",
    [authenticateRoute],
    Recipe.findAll
  );
  router.get("/recipes/export", [authenticateRoute], Recipe.exportAll);
  router.get("/recipes/:id/export", [authenticateRoute], Recipe.exportOne);
  router.get("/recipes/:id", [authenticateRoute], Recipe.findOne);
  router.put("/recipes/:id", [authenticateRoute], Recipe.update);
  router.delete("/recipes/:id", [authenticateRoute], Recipe.delete);
  router.post(
    "/recipes/:id/image",
    [authenticateRoute, handleImageUpload],
    Recipe.uploadImage
  );

  app.use("/recipeapi", router);
};
