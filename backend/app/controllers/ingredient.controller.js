const db = require("../models");
const { UNITS } = require("../config/recipeConstants");
const {
  getAccessibleIngredientOrNull,
} = require("../authorization/recipeAccess");

const Ingredient = db.ingredient;
const Op = db.Sequelize.Op;

const trimName = (value) =>
  typeof value === "string" ? value.trim() : "";

const parseNameAndUnit = (body) => {
  const name = trimName(body.name);
  if (!name) {
    return { error: "Ingredient name is required." };
  }
  const unit = typeof body.unit === "string" ? body.unit.trim() : "";
  if (!unit) {
    return { error: "Unit is required." };
  }
  if (!UNITS.includes(unit)) {
    return { error: "Unit is not valid." };
  }
  return { name, unit };
};

const findDuplicateName = (userId, name, excludeId) =>
  Ingredient.findOne({
    where: {
      userId,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      [Op.and]: db.sequelize.where(
        db.sequelize.fn("LOWER", db.sequelize.col("name")),
        name.toLowerCase()
      ),
    },
  });

exports.create = async (req, res) => {
  try {
    const parsed = parseNameAndUnit(req.body);
    if (parsed.error) {
      return res.status(400).send({ message: parsed.error });
    }

    const duplicate = await findDuplicateName(req.user.id, parsed.name);
    if (duplicate) {
      return res.status(400).send({
        message: "Ingredient name is already in your list.",
      });
    }

    const created = await Ingredient.create({
      name: parsed.name,
      unit: parsed.unit,
      userId: req.user.id,
    });

    return res.status(201).send(created);
  } catch (err) {
    return res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Ingredient.",
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Ingredient.findAll({
      where: { userId: req.user.id },
      order: [
        [db.sequelize.fn("LOWER", db.sequelize.col("name")), "ASC"],
      ],
    });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving ingredients.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const ingredient = await getAccessibleIngredientOrNull(req, req.params.id);
    if (!ingredient) {
      return res.status(404).send({
        message: `Ingredient with id=${req.params.id} not found.`,
      });
    }
    return res.send(ingredient);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving Ingredient.",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const ingredient = await getAccessibleIngredientOrNull(req, req.params.id);
    if (!ingredient) {
      return res.status(404).send({
        message: `Ingredient with id=${req.params.id} not found.`,
      });
    }

    const body = {
      name: req.body.name !== undefined ? req.body.name : ingredient.name,
      unit: req.body.unit !== undefined ? req.body.unit : ingredient.unit,
    };
    const parsed = parseNameAndUnit(body);
    if (parsed.error) {
      return res.status(400).send({ message: parsed.error });
    }

    const duplicate = await findDuplicateName(
      req.user.id,
      parsed.name,
      ingredient.id
    );
    if (duplicate) {
      return res.status(400).send({
        message: "Ingredient name is already in your list.",
      });
    }

    await ingredient.update({ name: parsed.name, unit: parsed.unit });
    return res.send(ingredient);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error updating Ingredient.",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const ingredient = await getAccessibleIngredientOrNull(req, req.params.id);
    if (!ingredient) {
      return res.status(404).send({
        message: `Ingredient with id=${req.params.id} not found.`,
      });
    }

    await db.recipeIngredient.destroy({
      where: { ingredientId: ingredient.id },
    });
    await ingredient.destroy();
    return res.send({
      message: "Ingredient was deleted successfully!",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Could not delete Ingredient.",
    });
  }
};
