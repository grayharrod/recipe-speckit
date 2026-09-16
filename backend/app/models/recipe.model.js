module.exports = (sequelize, Sequelize) => {
  const Recipe = sequelize.define("recipe", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "",
    },
    servings: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    time: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    category: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    imagePath: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isPublished: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });
  return Recipe;
};
