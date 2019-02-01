'use strict';

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
    const Invites = sequelize.define('Invites', {
        email: DataTypes.STRING,
        token: DataTypes.STRING,
        expiredAt: DataTypes.DATE
    }, {
        timestamps: false
    });

    Invites.beforeCreate(function(invite, options) {
        if(!invite.token) {
            invite.token = crypto.randomBytes(16).toString('hex');
        }
        if(!invite.expiredAt) {
            // Expired in 24h
            invite.expiredAt = new Date(new Date().getTime() + 60 * 60 * 24 * 1000);
        }
    });

    Invites.associate = function(models) {
        // associations can be defined here
    };

    /**
     *
     * @returns {boolean}
     */
    Invites.prototype.isExpired = function() {
        return this.expiredAt < new Date();
    };

    return Invites;
};