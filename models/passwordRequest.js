'use strict';

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
    const PasswordRequests = sequelize.define('PasswordRequests', {
        token: DataTypes.STRING,
        expiredAt: DataTypes.DATE
    }, {
        timestamps: false
    });

    PasswordRequests.beforeCreate(function(passwordRequest, options) {
        if(!passwordRequest.token) {
            passwordRequest.token = crypto.randomBytes(16).toString('hex');
        }
        if(!passwordRequest.expiredAt) {
            // Expired in 24h
            passwordRequest.expiredAt = new Date(new Date().getTime() + 60 * 60 * 24 * 1000);
        }
    });

    PasswordRequests.associate = function(models) {
        // associations can be defined here
    };

    /**
     *
     * @returns {boolean}
     */
    PasswordRequests.prototype.isExpired = function() {
        return this.expiredAt < new Date();
    };

    return PasswordRequests;
};