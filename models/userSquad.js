'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserSquads = sequelize.define('UserSquads', {
        role: DataTypes.STRING,
    }, {});

    return UserSquads;
};