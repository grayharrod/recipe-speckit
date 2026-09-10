module.exports = {
  secret: process.env.AUTH_SECRET || "change-me-in-production",
  expiresIn: 86400,
};
