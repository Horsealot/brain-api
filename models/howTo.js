'use strict';

module.exports = (sequelize, DataTypes) => {
    const HowTos = sequelize.define('HowTos', {
        content: DataTypes.TEXT,
        version: DataTypes.INTEGER,
        author: DataTypes.INTEGER
    });

    HowTos.associate = function(models) {
        // associations can be defined here
    };

    return HowTos;
};