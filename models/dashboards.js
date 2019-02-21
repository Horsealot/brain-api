'use strict';

module.exports = (sequelize, DataTypes) => {
    const Dashboards = sequelize.define('Dashboards', {
        name: DataTypes.STRING,
    }, {
        timestamps: false
    });

    Dashboards.associate = function(models) {
        // associations can be defined here
    };

    return Dashboards;
};