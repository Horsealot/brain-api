'use strict';

module.exports = (sequelize, DataTypes) => {
  const Squads = sequelize.define('Squads', {
    name: DataTypes.STRING,
    slug: DataTypes.STRING
  }, {});
  Squads.associate = function(models) {
    // associations can be defined here
  };
  return Squads;
};