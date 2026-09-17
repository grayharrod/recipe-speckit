const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.ingredient = require("./ingredient.model.js")(sequelize, Sequelize);
db.recipe = require("./recipe.model.js")(sequelize, Sequelize);
db.recipeStep = require("./recipeStep.model.js")(sequelize, Sequelize);
db.recipeIngredient = require("./recipeIngredient.model.js")(
  sequelize,
  Sequelize
);
db.session = require("./session.model.js")(sequelize, Sequelize);
db.user = require("./user.model.js")(sequelize, Sequelize);

db.user.hasMany(db.session, {
  as: "session",
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});
db.session.belongsTo(db.user, {
  as: "user",
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});

db.user.hasMany(db.recipe, {
  as: "recipe",
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});
db.recipe.belongsTo(db.user, {
  as: "user",
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});

db.user.hasMany(db.ingredient, {
  as: "ingredient",
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});
db.ingredient.belongsTo(db.user, {
  as: "user",
  foreignKey: { name: "userId", allowNull: false },
  onDelete: "CASCADE",
});

db.recipe.hasMany(db.recipeStep, {
  as: "recipeStep",
  foreignKey: { name: "recipeId", allowNull: false },
  onDelete: "CASCADE",
});
db.recipeStep.belongsTo(db.recipe, {
  as: "recipe",
  foreignKey: { name: "recipeId", allowNull: false },
  onDelete: "CASCADE",
});

db.recipe.hasMany(db.recipeIngredient, {
  as: "recipeIngredient",
  foreignKey: { name: "recipeId", allowNull: false },
  onDelete: "CASCADE",
});
db.recipeIngredient.belongsTo(db.recipe, {
  as: "recipe",
  foreignKey: { name: "recipeId", allowNull: false },
  onDelete: "CASCADE",
});

db.ingredient.hasMany(db.recipeIngredient, {
  as: "recipeIngredient",
  foreignKey: { name: "ingredientId", allowNull: false },
  onDelete: "CASCADE",
});
db.recipeIngredient.belongsTo(db.ingredient, {
  as: "ingredient",
  foreignKey: { name: "ingredientId", allowNull: false },
  onDelete: "CASCADE",
});

db.recipeStep.hasMany(db.recipeIngredient, {
  as: "recipeIngredient",
  foreignKey: { name: "recipeStepId", allowNull: true },
  onDelete: "CASCADE",
});
db.recipeIngredient.belongsTo(db.recipeStep, {
  as: "recipeStep",
  foreignKey: { name: "recipeStepId", allowNull: true },
  onDelete: "CASCADE",
});

module.exports = db;
