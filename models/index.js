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

db.Squads.hasMany(db.HowTos, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'howTos',
    onDelete: 'CASCADE',
    hooks: true
});
db.HowTos.belongsTo(db.Squads, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'squad',
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

db.Squads.hasMany(db.Dashboards, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'dashboards',
    onDelete: 'CASCADE',
    hooks: true
});
db.Dashboards.belongsTo(db.Squads, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'squad',
});

db.Products.hasMany(db.Dashboards, {
    foreignKey: 'ProductId',
    sourceKey: 'id',
    as: 'dashboards',
    onDelete: 'CASCADE',
    hooks: true
});
db.Dashboards.belongsTo(db.Products, {
    foreignKey: 'ProductId',
    sourceKey: 'id',
    as: 'product',
});

db.Dashboards.hasMany(db.DashboardModules, {
    foreignKey: 'DashboardId',
    sourceKey: 'id',
    as: 'modules',
    onDelete: 'CASCADE',
    hooks: true
});
db.DashboardModules.belongsTo(db.Dashboards, {
    foreignKey: 'DashboardId',
    sourceKey: 'id',
    as: 'dashboard',
});

db.Periods.hasMany(db.Okrs, {
    foreignKey: 'PeriodId',
    sourceKey: 'id',
    as: 'okrs',
    onDelete: 'CASCADE',
    hooks: true
});
db.Okrs.belongsTo(db.Periods, {
    foreignKey: 'PeriodId',
    sourceKey: 'id',
    as: 'period',
});

db.Squads.hasMany(db.Okrs, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'okrs',
    onDelete: 'CASCADE',
    hooks: true
});
db.Okrs.belongsTo(db.Squads, {
    foreignKey: 'SquadId',
    sourceKey: 'id',
    as: 'squad',
});

db.Users.hasMany(db.UserGoals, {
    foreignKey: 'UserId',
    sourceKey: 'id',
    as: 'goals',
    onDelete: 'CASCADE',
    hooks: true
});
db.UserGoals.belongsTo(db.Users, {
    foreignKey: 'UserId',
    sourceKey: 'id',
    as: 'user',
});

db.Periods.hasMany(db.UserGoals, {
    foreignKey: 'PeriodId',
    sourceKey: 'id',
    as: 'goals',
    onDelete: 'CASCADE',
    hooks: true
});
db.UserGoals.belongsTo(db.Periods, {
    foreignKey: 'PeriodId',
    sourceKey: 'id',
    as: 'period',
});

module.exports = db;
