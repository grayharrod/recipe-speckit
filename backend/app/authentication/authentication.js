const db = require("../models");

const Session = db.session;
const User = db.user;

const unauthorized = (res, message) =>
  res.status(401).send({ message });

const readBearerToken = (req) => {
  const auth = req.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7).trim();
};

/**
 * Resolves Authorization: Bearer <token> to req.user = { id, role }.
 */
authenticate = async (req, res, next) => {
  try {
    const token = readBearerToken(req);
    if (!token) {
      return unauthorized(res, "Unauthorized! No Auth Header");
    }

    const session = await Session.findOne({ where: { token } });
    if (!session || session.expirationDate < new Date()) {
      return unauthorized(
        res,
        "Unauthorized! Expired Token, Logout and Login again"
      );
    }

    const user = await User.findByPk(session.userId);
    if (!user) {
      return unauthorized(
        res,
        "Unauthorized! Expired Token, Logout and Login again"
      );
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    return unauthorized(res, "Unauthorized! Expired Token, Logout and Login again");
  }
};

authenticateRoute = authenticate;

const auth = {
  authenticate,
  authenticateRoute,
  readBearerToken,
};

module.exports = auth;
