'use strict';

module.exports = (sequelize, DataTypes) => {
    const Tools = sequelize.define('Tools', {
        name: DataTypes.STRING,
        icon: DataTypes.STRING,
        link: DataTypes.STRING,
        order: DataTypes.INTEGER
    }, {
        timestamps: false
    });

    Tools.associate = function(models) {
        // associations can be defined here
    };

    return Tools;
};