const db = require("../models");
const { UNITS } = require("../config/recipeConstants");
const {
  getAccessibleIngredientOrNull,
} = require("../authorization/recipeAccess");

const Ingredient = db.ingredient;
const Op = db.Sequelize.Op;

const trimName = (value) =>
  typeof value === "string" ? value.trim() : "";

exports.create = async (req, res) => {
  try {
    const name = trimName(req.body.name);
    if (!name) {
      return res.status(400).send({ message: "Ingredient name is required." });
    }

    const unit =
      typeof req.body.unit === "string" ? req.body.unit.trim() : "";
    if (!unit) {
      return res.status(400).send({ message: "Unit is required." });
    }
    if (!UNITS.includes(unit)) {
      return res.status(400).send({ message: "Unit is not valid." });
    }

    const duplicate = await Ingredient.findOne({
      where: {
        userId: req.user.id,
        [Op.and]: db.sequelize.where(
          db.sequelize.fn("LOWER", db.sequelize.col("name")),
          name.toLowerCase()
        ),
      },
    });
    if (duplicate) {
      return res.status(400).send({
        message: "Ingredient name is already in your list.",
      });
    }

    const created = await Ingredient.create({
      name,
      unit,
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
      order: [["name", "ASC"]],
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
