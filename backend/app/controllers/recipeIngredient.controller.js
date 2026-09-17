const db = require("../models");
const {
  getAccessibleRecipeOrNull,
  getAccessibleIngredientOrNull,
} = require("../authorization/recipeAccess");

const RecipeIngredient = db.recipeIngredient;
const Ingredient = db.ingredient;

const notFoundRecipe = (res, id) =>
  res.status(404).send({ message: `Recipe with id=${id} not found.` });

const notFoundIngredient = (res, id) =>
  res.status(404).send({
    message: `Ingredient with id=${id} not found.`,
  });

const parseQuantity = (value) => {
  if (value === undefined || value === null || value === "") {
    return { error: "Quantity is required." };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return { error: "Quantity is required." };
  }
  return { value: n };
};

const withIngredient = (id) =>
  RecipeIngredient.findByPk(id, {
    include: [{ model: Ingredient, as: "ingredient", required: false }],
  });

const loadOwnedJoin = async (req) => {
  const recipe = await getAccessibleRecipeOrNull(req, req.params.recipeId);
  if (!recipe) {
    return { recipe: null, row: null };
  }
  const joinId = parseInt(req.params.id, 10);
  if (Number.isNaN(joinId)) {
    return { recipe, row: null };
  }
  const row = await RecipeIngredient.findOne({
    where: { id: joinId, recipeId: recipe.id },
  });
  return { recipe, row };
};

exports.create = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.recipeId);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }

    const quantity = parseQuantity(req.body.quantity);
    if (quantity.error) {
      return res.status(400).send({ message: quantity.error });
    }

    const ingredient = await getAccessibleIngredientOrNull(
      req,
      req.body.ingredientId
    );
    if (!ingredient) {
      return notFoundIngredient(res, req.body.ingredientId);
    }

    const created = await RecipeIngredient.create({
      quantity: quantity.value,
      recipeId: recipe.id,
      ingredientId: ingredient.id,
      recipeStepId: null,
    });

    const data = await withIngredient(created.id);
    return res.status(201).send(data);
  } catch (err) {
    return res.status(500).send({
      message:
        err.message ||
        "Some error occurred while creating the RecipeIngredient.",
    });
  }
};

exports.findAllForRecipe = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.recipeId);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }

    const data = await RecipeIngredient.findAll({
      where: { recipeId: recipe.id },
      include: [{ model: Ingredient, as: "ingredient", required: false }],
      order: [[{ model: Ingredient, as: "ingredient" }, "name", "ASC"]],
    });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message:
        err.message ||
        "Some error occurred while retrieving recipeIngredients for a recipe.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { recipe, row } = await loadOwnedJoin(req);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }
    if (!row) {
      return res.status(404).send({
        message: `Recipe with id=${req.params.id} not found.`,
      });
    }

    const quantity = parseQuantity(req.body.quantity);
    if (quantity.error) {
      return res.status(400).send({ message: quantity.error });
    }

    await row.update({ quantity: quantity.value });
    const data = await withIngredient(row.id);
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating RecipeIngredient.",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { recipe, row } = await loadOwnedJoin(req);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }
    if (!row) {
      return res.status(404).send({
        message: `Recipe with id=${req.params.id} not found.`,
      });
    }

    await row.destroy();
    return res.send({
      message: "RecipeIngredient was deleted successfully!",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Could not delete RecipeIngredient.",
    });
  }
};
