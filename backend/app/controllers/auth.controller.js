const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const authConfig = require("../config/auth.config");
const { readBearerToken } = require("../authentication/authentication");

const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;

const SALT_ROUNDS = 10;
const SESSION_MS = authConfig.expiresIn * 1000;

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const userPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const issueOrReuseSession = async (user) => {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gte]: new Date() },
    },
  });
  if (existing) {
    return existing;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: authConfig.expiresIn,
  });
  return Session.create({
    token,
    email: user.email,
    userId: user.id,
    expirationDate: new Date(Date.now() + SESSION_MS),
  });
};

exports.register = async (req, res) => {
  try {
    return await registerUser(req, res);
  } catch (err) {
    return res
      .status(500)
      .send({ message: err.message || "Registration failed." });
  }
};

const registerUser = async (req, res) => {
  const fName = req.body.fName;
  const lName = req.body.lName;
  const email = req.body.email;
  const usernameRaw = req.body.username;
  const password = req.body.password;

  if (isBlank(fName)) {
    return res.status(400).send({ message: "First name is required." });
  }
  if (isBlank(lName)) {
    return res.status(400).send({ message: "Last name is required." });
  }
  if (isBlank(email)) {
    return res.status(400).send({ message: "Email is required." });
  }
  if (isBlank(usernameRaw)) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (isBlank(password)) {
    return res.status(400).send({ message: "Password is required." });
  }
  if (String(password).length < 8) {
    return res
      .status(400)
      .send({ message: "Password must be at least 8 characters." });
  }

  const username = String(usernameRaw).trim().toLowerCase();
  const trimmedEmail = String(email).trim();

  const takenUsername = await User.findOne({ where: { username } });
  if (takenUsername) {
    return res.status(400).send({ message: "Username is already taken." });
  }

  const takenEmail = await User.findOne({ where: { email: trimmedEmail } });
  if (takenEmail) {
    return res.status(400).send({ message: "Email is already registered." });
  }

  const hash = await bcrypt.hash(String(password), SALT_ROUNDS);
  const user = await User.create({
    fName: String(fName).trim(),
    lName: String(lName).trim(),
    email: trimmedEmail,
    username,
    password: hash,
    role: "worker",
    salt: Buffer.alloc(16),
  });

  const session = await issueOrReuseSession(user);
  return res.status(201).send(userPayload(user, session.token));
};

exports.login = async (req, res) => {
  try {
    return await loginUser(req, res);
  } catch (err) {
    return res.status(500).send({ message: err.message || "Login failed." });
  }
};

const loginUser = async (req, res) => {
  const usernameRaw = req.body.username;
  const password = req.body.password;

  if (isBlank(usernameRaw)) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (isBlank(password)) {
    return res.status(400).send({ message: "Password is required." });
  }

  const username = String(usernameRaw).trim().toLowerCase();
  const user = await User.unscoped().findOne({ where: { username } });
  const storedHash = user?.password
    ? Buffer.isBuffer(user.password)
      ? user.password.toString("utf8")
      : String(user.password)
    : "";
  const match = user && (await bcrypt.compare(String(password), storedHash));
  if (!user || !match) {
    return res
      .status(401)
      .send({ message: "Invalid username or password." });
  }

  const session = await issueOrReuseSession(user);
  return res.status(200).send(userPayload(user, session.token));
};

exports.logout = async (req, res) => {
  try {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).send({ message: "Unauthorized! No Auth Header" });
    }

    const session = await Session.findOne({ where: { token } });
    if (!session) {
      return res.status(401).send({
        message: "Unauthorized! Expired Token, Logout and Login again",
      });
    }

    await Session.destroy({ where: { token } });
    return res.send({ message: "Logged out successfully." });
  } catch (err) {
    return res.status(500).send({ message: err.message || "Logout failed." });
  }
};
