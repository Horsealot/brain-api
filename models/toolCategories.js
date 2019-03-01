'use strict';

module.exports = (sequelize, DataTypes) => {
    const ToolCategories = sequelize.define('ToolCategories', {
        name: DataTypes.STRING,
        order: DataTypes.INTEGER
    }, {
        timestamps: false
    });

    ToolCategories.associate = function(models) {
        // associations can be defined here
    };

    return ToolCategories;
};