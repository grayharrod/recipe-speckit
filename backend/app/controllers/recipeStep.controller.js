const db = require("../models");
const { getAccessibleRecipeOrNull } = require("../authorization/recipeAccess");

const RecipeStep = db.recipeStep;

const notFoundRecipe = (res, id) =>
  res.status(404).send({ message: `Recipe with id=${id} not found.` });

const trimInstruction = (value) =>
  typeof value === "string" ? value.trim() : "";

const loadOwnedStep = async (req) => {
  const recipe = await getAccessibleRecipeOrNull(req, req.params.recipeId);
  if (!recipe) {
    return { recipe: null, step: null };
  }
  const stepId = parseInt(req.params.id, 10);
  if (Number.isNaN(stepId)) {
    return { recipe, step: null };
  }
  const step = await RecipeStep.findOne({
    where: { id: stepId, recipeId: recipe.id },
  });
  return { recipe, step };
};

exports.create = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.recipeId);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }

    const instruction = trimInstruction(req.body.instruction);
    if (!instruction) {
      return res.status(400).send({ message: "Instruction is required." });
    }

    const maxStep = await RecipeStep.max("stepNumber", {
      where: { recipeId: recipe.id },
    });
    const stepNumber = (maxStep || 0) + 1;

    const created = await RecipeStep.create({
      stepNumber,
      instruction,
      recipeId: recipe.id,
    });

    return res.status(201).send(created);
  } catch (err) {
    return res.status(500).send({
      message:
        err.message || "Some error occurred while creating the RecipeStep.",
    });
  }
};

exports.findAllForRecipe = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.recipeId);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }

    const data = await RecipeStep.findAll({
      where: { recipeId: recipe.id },
      order: [["stepNumber", "ASC"]],
    });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message:
        err.message ||
        "Some error occurred while retrieving recipeSteps for a recipe.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { recipe, step } = await loadOwnedStep(req);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }
    if (!step) {
      return res.status(404).send({
        message: `Recipe with id=${req.params.id} not found.`,
      });
    }

    const instruction = trimInstruction(req.body.instruction);
    if (!instruction) {
      return res.status(400).send({ message: "Instruction is required." });
    }

    await step.update({ instruction });
    return res.send(step);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating RecipeStep.",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { recipe, step } = await loadOwnedStep(req);
    if (!recipe) {
      return notFoundRecipe(res, req.params.recipeId);
    }
    if (!step) {
      return res.status(404).send({
        message: `Recipe with id=${req.params.id} not found.`,
      });
    }

    await step.destroy();
    return res.send({ message: "RecipeStep was deleted successfully!" });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Could not delete RecipeStep.",
    });
  }
};
