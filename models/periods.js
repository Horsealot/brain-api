'use strict';

module.exports = (sequelize, DataTypes) => {
    const Periods = sequelize.define('Periods', {
        name: DataTypes.STRING,
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
    }, {
        timestamps: false
    });

    Periods.associate = function(models) {
        // associations can be defined here
    };

    return Periods;
};