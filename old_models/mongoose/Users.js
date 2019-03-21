const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserRole = require('./UserRole');

const { Schema } = mongoose;

const { SocialMedias, validateSocialMedia } = require('./SocialMedias');

const UsersSchema = new Schema({
    email: String,
    hash: String,
    salt: String,
    createdAt: Date,
    lastUpdatedAt: Date,
    lastLoginAt: Date,
    lastPasswordUpdateAt: Date,
    phoneNumber: String,

    roles: [String],
    squads: [String],

    birthdate: Date,
    firstname: String,
    lastname: String,
    picture: String,
    description: String,
    scorecard: String,
    jobTitle: String,
    jobHistory: [String],
    socialMedias: [SocialMedias],
    administrativeLink: String
});

const MODIFIABLE = [
    "firstname", "lastname", "picture", "description", "phoneNumber", "socialMedias", 'birthdate'
];
const MODIFIABLE_BY_ADMIN = [
    "jobTitle", "scorecard", "roles", "squads", "phoneNumber", "administrativeLink"
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

UsersSchema.methods.setSocialMedias = function(socialMedias) {
    if(Array.isArray(socialMedias)) {
        this.socialMedias = [];
        for(let i = 0; i < socialMedias.length; i++) {
            if(validateSocialMedia(socialMedias[i])) {
                this.socialMedias.push(socialMedias[i]);
            }
        }
    } else {
        if(validateSocialMedia(socialMedias)) {
            this.socialMedias = [socialMedias];
        }
    }
};
UsersSchema.methods.addSocialMedias = function(socialMedia) {
    if(!Array.isArray(this.socialMedias)) {
        this.socialMedias = [];
    }
    if(validateSocialMedia(socialMedia)) {
        this.socialMedias.push(socialMedia);
    }
};
UsersSchema.methods.rmSocialMedias = function(socialMedia) {
    if(!Array.isArray(this.socialMedias)) {
        this.socialMedias = [];
    }
    this.socialMedias.unshift(socialMedia);
};

UsersSchema.methods.setJobTitle = function(jobTitle) {
    if(!Array.isArray(this.jobHistory)) {
        this.jobHistory = [];
    }
    this.jobHistory.push(this.jobTitle);
    this.jobTitle = jobTitle;
};

UsersSchema.methods.updateFromEntity = function(newUser, fromUser, fromAdmin = false) {
    const updateStatus = Object.assign({}, newUser);
    for(let key in newUser) {
        const upperCaseKey = key.replace(/^\w/, c => c.toUpperCase());
        if(MODIFIABLE.indexOf(key) >= 0 && fromUser) {
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
    this.lastPasswordUpdateAt = new Date();
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
        roles: this.roles
    };
};

/**
 * Return json
 * @returns {{_id: *, email: *, firstname: *, lastname: *}}
 */
UsersSchema.methods.toJSON = function() {
    return {
        _id: this._id,
        createdAt: this.createdAt,
        firstname: this.firstname,
        lastname: this.lastname,
        picture: this.picture,
        description: this.description,
        scorecard: this.scorecard,
        birthdate: this.birthdate,
        jobTitle: this.jobTitle,
        phoneNumber: this.phoneNumber,
        socialMedias: this.socialMedias,
        squads: this.squads
    };
};

/**
 * Return Admin json
 * @returns {{_id: *, email: *, firstname: *, lastname: *, squads: *, roles: *, createdAt: *}}
 */
UsersSchema.methods.toAdminJSON = function() {
    return { ...this.toJSON(),
        email: this.email,
        roles: this.roles,
        administrativeLink: this.administrativeLink
    };
};

mongoose.model('Users', UsersSchema);