const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserRole = require('./UserRole');

const { Schema } = mongoose;

const UsersSchema = new Schema({
    email: String,
    hash: String,
    salt: String,
    createdAt: Date,
    lastUpdatedAt: Date,
    lastLoginAt: Date,

    roles: [String],
    squads: [String],

    birthdate: Date,
    firstname: String,
    lastname: String,
    picture: String,
    description: String,
    scorecard: String,
    jobTitle: String,
    jobHistory: [String]
});

const MODIFIABLE = [
    "firstname", "lastname", "picture", "description"
];
const MODIFIABLE_BY_ADMIN = [
    "jobTitle", "scorecard", "roles", "squads"
];

UsersSchema.methods.setRoles = function(role) {
    if(Array.isArray(role)) {
        this.roles = [...new Set(role.map((dirtyRole) => {
            return UserRole.cleanRole(dirtyRole);
        }))];
    } else {
        this.roles = [UserRole.cleanRole(role)];
    }
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

UsersSchema.methods.setJobTitle = function(jobTitle) {
    if(!Array.isArray(this.jobHistory)) {
        this.jobHistory = [];
    }
    this.jobHistory.push(this.jobTitle);
    this.jobTitle = jobTitle;
};

UsersSchema.methods.updateFromEntity = function(newUser, fromAdmin = false) {
    const updateStatus = Object.assign({}, newUser);
    for(let key in newUser) {
        const upperCaseKey = key.replace(/^\w/, c => c.toUpperCase());
        if(MODIFIABLE.indexOf(key) >= 0 && !fromAdmin) {
            if(typeof this["set" + upperCaseKey] === 'function') {
                this["set" + upperCaseKey](newUser[key]);
            } else {
                this[key] = newUser[key];
            }
            updateStatus[key] = "updated";
        } else if(MODIFIABLE_BY_ADMIN.indexOf(key) >= 0 && fromAdmin) {
            if(typeof this["set" + upperCaseKey] === 'function') {
                this["set" + upperCaseKey](newUser[key]);
            } else {
                this[key] = newUser[key];
            }
            updateStatus[key] = "updated";
        } else {
            updateStatus[key] = "not allowed";
        }
    }
    return updateStatus;
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
        createdAt: this.createdAt,
        token: this.generateJWT(),
        squads: this.squads,
        roles: this.roles,
    };
};

/**
 * Return json
 * @returns {{_id: *, email: *, firstname: *, lastname: *}}
 */
UsersSchema.methods.toJSON = function() {
    return {
        _id: this._id,
        firstname: this.firstname,
        lastname: this.lastname,
    };
};

/**
 * Return Admin json
 * @returns {{_id: *, email: *, firstname: *, lastname: *, squads: *, roles: *, createdAt: *}}
 */
UsersSchema.methods.toAdminJSON = function() {
    return { ...this.toJSON(),
        email: this.email,
        squads: this.squads,
        roles: this.roles,
        createdAt: this.createdAt
    };
};

mongoose.model('Users', UsersSchema);