'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;


db.Users.belongsToMany(db.Squads, { through: db.UserSquads, as: 'squads' });
db.Squads.belongsToMany(db.Users, { through: db.UserSquads, as: 'users' });

db.Users.hasMany(db.PasswordRequests, {
    foreignKey: 'UserId',
    sourceKey: 'id',
    as: 'user',
    onDelete: 'CASCADE',
    hooks: true
});
db.PasswordRequests.belongsTo(db.Users, {
    foreignKey: 'UserId',
    sourceKey: 'id',
    as: 'user',
});

db.Users.hasMany(db.ToolCategories, {
    foreignKey: 'UserId',
    sourceKey: 'id',
    as: 'toolCategories',
});
db.ToolCategories.belongsTo(db.Users, {
    foreignKey: 'UserId',
    sourceKey: 'id',
    as: 'user',
});

db.Squads.hasMany(db.ToolCategories, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'toolCategories',
    onDelete: 'CASCADE',
    hooks: true
});
db.ToolCategories.belongsTo(db.Squads, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'squad',
});

db.ToolCategories.hasMany(db.Tools, {
    foreignKey: 'CategoryId',
    sourceKey: 'id',
    as: 'tools',
    onDelete: 'CASCADE',
    hooks: true
});
db.Tools.belongsTo(db.ToolCategories, {
    foreignKey: 'CategoryId',
    sourceKey: 'id',
    as: 'category',
});

module.exports = db;
