const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const User = require("./user")(sequelize, Sequelize.DataTypes);
// later you will add category, product models here also

module.exports = {
  sequelize,
  User,
};
