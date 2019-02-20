'use strict';

const SocialMedias = "../old_models/mongoose/SocialMedias";

const crypto = require('crypto');
const UserRole = require("../old_models/mongoose/UserRole");
const jwt = require('jsonwebtoken');
const userRightsNomenclature = require('./../routes/tools/userRightsNomenclature.json');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('Users', {
        publicId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        email: {
            type: DataTypes.STRING,
            unique: true
        },
        hash: DataTypes.TEXT,
        salt: DataTypes.STRING,
        createdAt: DataTypes.DATE,
        lastUpdatedAt: DataTypes.DATE,
        lastPasswordUpdateAt: DataTypes.DATE,

        birthdate: DataTypes.DATEONLY,
        phoneNumber: DataTypes.STRING,
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        picture: DataTypes.STRING,
        description: DataTypes.STRING,
        scorecard: DataTypes.STRING,
        jobTitle: DataTypes.STRING,
        administrativeLink: DataTypes.STRING,
        roles: DataTypes.ARRAY(DataTypes.STRING)
    }, {});

    User.associate = function(models) {
    };



    const MODIFIABLE = [
        "firstname", "lastname", "picture", "description", "phoneNumber", "socialMedias", 'birthdate'
    ];
    const MODIFIABLE_BY_ADMIN = [
        "jobTitle", "scorecard", "phoneNumber", "administrativeLink"
    ];
    const MODIFIABLE_BY_SUPER_ADMIN = [
        "roles"
    ];

    User.prototype.setRoles = function(role) {
        if(Array.isArray(role)) {
            this.roles = [...new Set(role.map((dirtyRole) => {
                return UserRole.cleanRole(dirtyRole);
            }))];
        } else {
            this.roles = [UserRole.cleanRole(role)];
        }
    };
    User.prototype.addRole = function(role) {
        if(!Array.isArray(this.roles)) {
            this.roles = [];
        }
        this.roles.push(UserRole.cleanRole(role));
    };
    User.prototype.rmRole = function(role) {
        if(!Array.isArray(this.roles)) {
            this.roles = [];
        }
        this.roles.unshift(UserRole.cleanRole(role));
    };

    User.prototype.setSocialMedias = function(socialMedias) {
        if(Array.isArray(socialMedias)) {
            this.socialMedias = [];
            for(var i = 0; i < socialMedias.length; i++) {
                if(SocialMedias.validateSocialMedia(socialMedias[i])) {
                    this.socialMedias.push(socialMedias[i]);
                }
            }
        } else {
            if(SocialMedias.validateSocialMedia(socialMedias)) {
                this.socialMedias = [socialMedias];
            }
        }
    };
    User.prototype.addSocialMedias = function(socialMedia) {
        if(!Array.isArray(this.socialMedias)) {
            this.socialMedias = [];
        }
        if(SocialMedias.validateSocialMedia(socialMedia)) {
            this.socialMedias.push(socialMedia);
        }
    };
    User.prototype.rmSocialMedias = function(socialMedia) {
        if(!Array.isArray(this.socialMedias)) {
            this.socialMedias = [];
        }
        this.socialMedias.unshift(socialMedia);
    };

    User.prototype.setJobTitle = function(jobTitle) {
        if(!Array.isArray(this.jobHistory)) {
            this.jobHistory = [];
        }
        this.jobHistory.push(this.jobTitle);
        this.jobTitle = jobTitle;
    };

    User.prototype.updateFromEntity = function(newUser, userRights) {
        const updateStatus = Object.assign({}, newUser);
        for(let key in newUser) {
            const upperCaseKey = key.replace(/^\w/, c => c.toUpperCase());
            if(MODIFIABLE.indexOf(key) >= 0 && (userRights.indexOf(userRightsNomenclature.OWNER) >= 0 || userRights.indexOf(userRightsNomenclature.SUPER_ADMIN) >= 0)) {
                if(typeof this["set" + upperCaseKey] === 'function') {
                    this["set" + upperCaseKey](newUser[key]);
                } else {
                    this[key] = newUser[key];
                }
                updateStatus[key] = "updated";
            } else if(MODIFIABLE_BY_ADMIN.indexOf(key) >= 0 && (userRights.indexOf(userRightsNomenclature.SQUAD_ADMIN) >= 0 || userRights.indexOf(userRightsNomenclature.SUPER_ADMIN) >= 0)) {
                if(typeof this["set" + upperCaseKey] === 'function') {
                    this["set" + upperCaseKey](newUser[key]);
                } else {
                    this[key] = newUser[key];
                }
                updateStatus[key] = "updated";
            } else if(MODIFIABLE_BY_SUPER_ADMIN.indexOf(key) >= 0 && userRights.indexOf(userRightsNomenclature.SUPER_ADMIN) >= 0) {
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


    User.beforeUpdate(function(user, options) {
        if(!user.createdAt) {
            user.createdAt = new Date();
        }
        if(!user.lastUpdatedAt) {
            user.lastUpdatedAt = new Date();
        }
    });

    /**
     * AUTH PART
     */

    /**
     * Set user password
     * @param password
     */
    User.prototype.setPassword = function(password) {
        this.salt = crypto.randomBytes(16).toString('hex');
        this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
        this.lastPasswordUpdateAt = new Date();
    };

    /**
     * Validate user password
     * @param password
     * @returns {boolean}
     */
    User.prototype.validatePassword = function(password) {
        const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
        return this.hash === hash;
    };

    /**
     * Generate user JWT
     * @returns {*}
     */
    User.prototype.generateJWT = function() {
        const today = new Date();
        const expirationDate = new Date(today);
        expirationDate.setDate(today.getDate() + 60);

        return jwt.sign({
            id: this.publicId,
            exp: parseInt(expirationDate.getTime() / 1000, 10),
        }, 'secret');
    };

    /**
     * Return auth json
     * @returns {{_id: *, token: *, firstname: *, lastname: *}}
     */
    User.prototype.toAuthJSON = function() {
        return { ...this.toAdminJSON(),
            token: this.generateJWT(),
        };
    };

    /**
     * Return json
     * @returns {{_id: *, email: *, firstname: *, lastname: *}}
     */
    User.prototype.toJSON = function() {
        let jsonUser = {
            id: this.publicId,
            createdAt: this.createdAt,
            firstname: this.firstname,
            lastname: this.lastname,
            picture: this.picture,
            description: this.description,
            scorecard: this.scorecard,
            birthdate: this.birthdate,
            jobTitle: this.jobTitle,
            phoneNumber: this.phoneNumber,
            socialMedias: this.socialMedias
        };
        if(this.squads) {
            jsonUser.squads = this.parseSquads();
        }
        return jsonUser;
    };

    User.prototype.parseSquads = function() {
        let parsedSquad = [];
        if(this.squads) {
            for(var i = 0; i<this.squads.length; i++) {
                parsedSquad.push({
                    id: this.squads[i].id,
                    name: this.squads[i].name,
                    role: this.squads[i].UserSquads.role,
                })
            }
        }
        return parsedSquad;
    };

    /**
     * Return Admin json
     * @returns {{_id: *, email: *, firstname: *, lastname: *, squads: *, roles: *, createdAt: *}}
     */
    User.prototype.toAdminJSON = function() {
        return { ...this.toJSON(),
            email: this.email,
            roles: this.roles,
            administrativeLink: this.administrativeLink
        };
    };


  return User;
};