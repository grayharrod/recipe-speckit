module.exports = (app) => {
  const Ingredient = require("../controllers/ingredient.controller.js");
  const { authenticateRoute } = require("../authentication/authentication");
  const router = require("express").Router();

  router.post("/ingredients/", [authenticateRoute], Ingredient.create);
  router.get("/ingredients/", [authenticateRoute], Ingredient.findAll);

  app.use("/recipeapi", router);
};
