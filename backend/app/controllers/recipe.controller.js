const db = require("../models");
const { CATEGORIES } = require("../config/recipeConstants");
const { getAccessibleRecipeOrNull } = require("../authorization/recipeAccess");
const {
  deleteImageFile,
  publicImagePath,
} = require("../middleware/recipeUpload");

const Recipe = db.recipe;
const RecipeStep = db.recipeStep;
const RecipeIngredient = db.recipeIngredient;
const Ingredient = db.ingredient;

const notFoundRecipe = (res, id) =>
  res.status(404).send({ message: `Recipe with id=${id} not found.` });

const trimName = (value) =>
  typeof value === "string" ? value.trim() : "";

const optionalPositiveInt = (value, message) => {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return { error: message };
  }
  return { value: n };
};

const optionalCategory = (value) => {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }
  if (!CATEGORIES.includes(value)) {
    return { error: "Category is not valid." };
  }
  return { value };
};

const detailInclude = [
  {
    model: RecipeStep,
    as: "recipeStep",
    required: false,
  },
  {
    model: RecipeIngredient,
    as: "recipeIngredient",
    required: false,
    include: [
      {
        model: Ingredient,
        as: "ingredient",
        required: false,
      },
    ],
  },
];

const loadRecipeDetail = (id, userId) =>
  Recipe.findOne({
    where: { id, userId },
    include: detailInclude,
    order: [[{ model: RecipeStep, as: "recipeStep" }, "stepNumber", "ASC"]],
  });

exports.create = async (req, res) => {
  try {
    const name = trimName(req.body.name);
    if (!name) {
      return res.status(400).send({ message: "Recipe name is required." });
    }

    const servings = optionalPositiveInt(
      req.body.servings,
      "Servings must be at least 1."
    );
    if (servings.error) {
      return res.status(400).send({ message: servings.error });
    }

    const time = optionalPositiveInt(
      req.body.time,
      "Cook time must be at least 1 minute."
    );
    if (time.error) {
      return res.status(400).send({ message: time.error });
    }

    const category = optionalCategory(req.body.category);
    if (category.error) {
      return res.status(400).send({ message: category.error });
    }

    const description =
      req.body.description === undefined || req.body.description === null
        ? ""
        : String(req.body.description);

    const created = await Recipe.create({
      name,
      description,
      servings: servings.value,
      time: time.value,
      category: category.value,
      imagePath: null,
      isPublished: false,
      userId: req.user.id,
    });

    return res.status(201).send(created);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Recipe.",
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Recipe.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving recipes.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.id);
    if (!recipe) {
      return notFoundRecipe(res, req.params.id);
    }
    const detail = await loadRecipeDetail(recipe.id, req.user.id);
    return res.send(detail);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving Recipe.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.id);
    if (!recipe) {
      return notFoundRecipe(res, req.params.id);
    }

    const name = trimName(req.body.name);
    if (!name) {
      return res.status(400).send({ message: "Recipe name is required." });
    }

    const description = trimName(req.body.description);
    if (!description) {
      return res.status(400).send({ message: "Description is required." });
    }

    const servings = optionalPositiveInt(
      req.body.servings,
      "Servings must be at least 1."
    );
    if (servings.error) {
      return res.status(400).send({ message: servings.error });
    }

    const time = optionalPositiveInt(
      req.body.time,
      "Cook time must be at least 1 minute."
    );
    if (time.error) {
      return res.status(400).send({ message: time.error });
    }

    const category = optionalCategory(req.body.category);
    if (category.error) {
      return res.status(400).send({ message: category.error });
    }

    await recipe.update({
      name,
      description,
      servings: servings.value,
      time: time.value,
      category: category.value,
    });

    const updated = await loadRecipeDetail(recipe.id, req.user.id);
    return res.send(updated);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating Recipe.",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.id);
    if (!recipe) {
      return notFoundRecipe(res, req.params.id);
    }

    const imagePath = recipe.imagePath;
    await recipe.destroy();
    deleteImageFile(imagePath);

    return res.send({ message: "Recipe was deleted successfully!" });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Could not delete Recipe.",
    });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const recipe = await getAccessibleRecipeOrNull(req, req.params.id);
    if (!recipe) {
      if (req.file) {
        deleteImageFile(publicImagePath(req.file.filename));
      }
      return notFoundRecipe(res, req.params.id);
    }

    if (!req.file) {
      return res.status(400).send({
        message: "Image must be a JPEG or PNG.",
      });
    }

    const previous = recipe.imagePath;
    const imagePath = publicImagePath(req.file.filename);
    await recipe.update({ imagePath });
    if (previous && previous !== imagePath) {
      deleteImageFile(previous);
    }

    const updated = await loadRecipeDetail(recipe.id, req.user.id);
    return res.send(updated);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error uploading recipe image.",
    });
  }
};
