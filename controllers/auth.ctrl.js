/** */
const passport = require('passport');
const mongoose = require('mongoose');
const notificationProducer = require('./../producers/notifications');
// const Users = mongoose.model('Users');
// const Invites = mongoose.model('Invites');
// const PasswordRequests = mongoose.model('PasswordRequests');

const models = require('./../models');

module.exports = {
    postInvite: async (req, res, next) => {
        const {body: {email}} = req;
        if (!email) {
            return res.status(422).json({
                errors: {
                    email: 'is required'
                }
            });
        }
        let existingUser = await models.Users.findOne({where: {email: email}});
        if(existingUser) {
            return res.status(409).json({
                errors: "User is already existing"
            });
        }
        const invite = new models.Invites({
            email: email
        });

        return invite.save()
            .then(() => {
                notificationProducer.signup('http://localhost:3000/signup/', invite);
                res.json({});
            });
    },
    postSignup: async (req, res, next) => {
        const {body: {user}} = req;

        let errors = {};
        if (!user.token) errors.token = 'is required';
        if (!user.password) errors.password = 'is required';
        if (!user.firstname) errors.firstname = 'is required';
        if (!user.lastname) errors.lastname = 'is required';
        if (!user.token || !user.password || !user.firstname || !user.lastname) {
            return res.status(422).json({
                errors: errors
            });
        }

        let invite = await models.Invites.findOne({where: {'token': user.token}});
        if(!invite) {
            return res.status(404).json({
                errors: "Token not found"
            });
        } else if(invite.isExpired()) {
            invite.destroy().then(() => res.status(410).json({
                errors: "Token expired"
            }));
        }

        let existingUser = await models.Users.findOne({where: {email: invite.email}});
        if(existingUser) {
            invite.destroy().then(() => {
                return res.status(401).json({
                    errors: "User already existing"
                });
            });
        } else {
            const finalUser = new models.Users({
                email: invite.email,
                password: user.password,
                firstname: user.firstname,
                lastname: user.lastname
            });
            finalUser.setPassword(user.password);
            finalUser.setRoles();
            return finalUser.save().then(() => {
                return invite.destroy();
            }).then(() => res.json({ user: finalUser.toAuthJSON() }));
        }
    },
    postLogin: (req, res, next) => {
        const { body: { user } } = req;

        let errors = {};
        if (!user.email) {
            errors.email = 'is required';
        }
        if (!user.password) {
            errors.password = 'is required';
        }
        if (!user.email || !user.password) {
            return res.status(422).json({
                errors: errors
            });
        }

        return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
            if(err) {
                return next(err);
            }

            if(passportUser) {
                const user = passportUser;
                user.token = passportUser.generateJWT();

                return res.json({ user: user.toAuthJSON() });
            }

            return res.status(401).json();
        })(req, res, next);
    },
    postPasswordReset: async (req, res, next) => {
        const {body: {password, token}} = req;
        if(!password) {
            return res.status(422).json({
                errors: {
                    newPassword: 'is required'
                }
            });
        }
        let passwordRequest = await models.PasswordRequests.findOne({where: {token: token}, include: ['user']});
        if(!passwordRequest) {
            return res.status(404).json({
                errors: "not existing"
            });
        }
        if(passwordRequest.expiredAt < new Date()) {
            passwordRequest.destroy().then(() => {
                return res.status(410).json({
                    errors: "expired"
                });
            });
        } else {
            passwordRequest.user.setPassword(password);
            passwordRequest.user.save().then(() => {
                return passwordRequest.destroy();
            }).then(() => {
                return res.status(200).json();
            })
        }

    },
    postRequestPasswordReset: async (req, res, next) => {
        const {body: {email}} = req;

        if (!email) {
            return res.status(422).json({
                errors: {
                    email: 'is required'
                }
            });
        }

        let user = await models.Users.findOne({where: {email: email}});
        if(!user) {
            return res.status(404).json({
                errors: "not existing"
            });
        }

        let existingPasswordRequest = await models.PasswordRequests.findOne({where: {UserId: user.id}, include: ['user']});
        if(existingPasswordRequest && !existingPasswordRequest.isExpired()) {
            return res.status(409).json({
                errors: "request already made"
            });
        } else if(existingPasswordRequest && existingPasswordRequest.isExpired()) {
            // delete and create a new one
            await existingPasswordRequest.destroy();
        }

        return models.PasswordRequests.create({
            UserId: user.id
        }).then((passwordRequest) => {
                notificationProducer.passwordResetRequest('http://localhost:3000/reset/', user, passwordRequest);
                res.json({});
            });
    },
};
