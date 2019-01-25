const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserRole = require('./UserRole');

const { Schema } = mongoose;

const UsersSchema = new Schema({
    firstname: String,
    lastname: String,
    slug: String,
    roles: [String],
    squads: [String],
    email: String,
    hash: String,
    salt: String,
    createdAt: Date,
    lastUpdatedAt: Date,
    lastLoginAt: Date
});

UsersSchema.methods.setRoles = function(role) {
    this.roles = [UserRole.cleanRole(role)];
};
UsersSchema.methods.addRole = function(role) {
    if(!Array.isArray(this.roles)) {
        this.roles = [];
    }
    this.roles.push(UserRole.cleanRole(role));
};
UsersSchema.methods.rmRole = function(role) {
    if(!Array.isArray(this.roles)) {
        this.roles = [];
    }
    this.roles.unshift(UserRole.cleanRole(role));
};


UsersSchema.pre('save', function(next) {
    if(!this.createdAt) {
        this.createdAt = new Date();
    }
    if(!this.lastUpdatedAt) {
        this.lastUpdatedAt = new Date();
    }
    next();
});

/**
 * AUTH PART
 */

/**
 * Set user password
 * @param password
 */
UsersSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

/**
 * Validate user password
 * @param password
 * @returns {boolean}
 */
UsersSchema.methods.validatePassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

/**
 * Generate user JWT
 * @returns {*}
 */
UsersSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
};

/**
 * Return auth json
 * @returns {{_id: *, token: *, firstname: *, lastname: *}}
 */
UsersSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        email: this.email,
        firstname: this.firstname,
        lastname: this.lastname,
        token: this.generateJWT(),
    };
};

/**
 * Return json
 * @returns {{_id: *, email: *, firstname: *, lastname: *}}
 */
UsersSchema.methods.toJSON = function() {
    return {
        _id: this._id,
        email: this.email,
        firstname: this.firstname,
        lastname: this.lastname,
    };
};

/**
 * Return Admin json
 * @returns {{_id: *, email: *, firstname: *, lastname: *, squads: *, roles: *, createdAt: *, slug: *}}
 */
UsersSchema.methods.toAdminJSON = function() {
    return { ...this.toJSON(),
        squads: this.squads,
        roles: this.roles,
        createdAt: this.createdAt,
        slug: this.slug
    };
};

mongoose.model('Users', UsersSchema);