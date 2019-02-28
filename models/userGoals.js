'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserSquads = sequelize.define('UserGoals', {
        value: DataTypes.STRING,
    }, {});

    /**
     *
     * @returns {{id, value}}
     */
    UserSquads.prototype.toJSON = function() {
        return {
            id: this.id,
            value: this.value
        };
    };

    return UserSquads;
};