module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "user",
    {
      fName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "worker",
      },
      // Leftover NOT NULL column from the pre-Feature-1 scrypt users table.
      salt: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
    },
    {
      defaultScope: {
        attributes: { exclude: ["password", "salt"] },
      },
    }
  );

  return User;
};
