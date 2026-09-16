const db = require("../models");

const parseId = (value) => {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const getAccessibleRecipeOrNull = async (req, recipeId) => {
  const id = parseId(recipeId);
  if (id == null || !req.user?.id) {
    return null;
  }
  return db.recipe.findOne({ where: { id, userId: req.user.id } });
};

const getAccessibleIngredientOrNull = async (req, ingredientId) => {
  const id = parseId(ingredientId);
  if (id == null || !req.user?.id) {
    return null;
  }
  return db.ingredient.findOne({ where: { id, userId: req.user.id } });
};

module.exports = {
  parseId,
  getAccessibleRecipeOrNull,
  getAccessibleIngredientOrNull,
};
