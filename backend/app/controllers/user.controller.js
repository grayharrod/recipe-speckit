const bcrypt = require("bcryptjs");
const db = require("../models");
const User = db.user;
const Op = db.Sequelize.Op;
const auth = require("./auth.controller.js");

const SALT_ROUNDS = 10;

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const notFoundMessage = (id) => ({
  message: `User with id=${id} not found.`,
});

const toProfile = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
});

// Create and Save a new User (admin-style create; registration is POST /register)
exports.create = async (req, res) => {
  req.body.fName = req.body.fName || req.body.firstName;
  req.body.lName = req.body.lName || req.body.lastName;
  return auth.register(req, res);
};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;

  User.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

// Find a single User with an id (own profile only)
exports.findOne = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || !req.user || id !== req.user.id) {
      return res.status(404).send(notFoundMessage(req.params.id));
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send(notFoundMessage(id));
    }
    return res.status(200).send(toProfile(user));
  } catch (err) {
    return res.status(500).send({
      message: err.message || `Error retrieving User with id = ${req.params.id}`,
    });
  }
};

// Find a single User with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  User.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.send({ email: "not found" });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error retrieving User with email=" + email,
      });
    });
};

// Update own profile only
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || !req.user || id !== req.user.id) {
      return res.status(404).send(notFoundMessage(req.params.id));
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send(notFoundMessage(id));
    }

    const passwordRaw = req.body.password;
    const passwordProvided =
      passwordRaw !== undefined &&
      passwordRaw !== null &&
      String(passwordRaw) !== "";

    if (passwordProvided && String(passwordRaw).length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters." });
    }

    if (isBlank(req.body.fName)) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (isBlank(req.body.lName)) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (isBlank(req.body.email)) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (isBlank(req.body.username)) {
      return res.status(400).send({ message: "Username is required." });
    }

    const fName = String(req.body.fName).trim();
    const lName = String(req.body.lName).trim();
    const email = String(req.body.email).trim();
    const username = String(req.body.username).trim().toLowerCase();

    const takenUsername = await User.findOne({
      where: { username, id: { [Op.ne]: id } },
    });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({
      where: { email, id: { [Op.ne]: id } },
    });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const updates = { fName, lName, email, username };
    if (passwordProvided) {
      updates.password = await bcrypt.hash(String(passwordRaw), SALT_ROUNDS);
    }

    await User.unscoped().update(updates, { where: { id } });
    const refreshed = await User.findByPk(id);
    return res.status(200).send(toProfile(refreshed));
  } catch (err) {
    return res.status(500).send({
      message: err.message || `Error updating User with id = ${req.params.id}`,
    });
  }
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { id: id },
  })
    .then((number) => {
      if (number == 1) {
        res.send({
          message: "User was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete User with id = ${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Could not delete User with id = " + id,
      });
    });
};

// Delete all People from the database.
exports.deleteAll = (req, res) => {
  User.destroy({
    where: {},
    truncate: false,
  })
    .then((number) => {
      res.send({ message: `${number} People were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all people.",
      });
    });
};
