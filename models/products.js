'use strict';

module.exports = (sequelize, DataTypes) => {
    const Products = sequelize.define('Products', {
        name: DataTypes.STRING,
    }, {
        timestamps: false
    });

    Products.associate = function(models) {
        // associations can be defined here
    };

    return Products;
};