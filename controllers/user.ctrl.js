const mongoose = require('mongoose');
/**
 * Don't know why but this is the only place were I can require them
 */
const Users = require('./../models/Users');
const Invites = require('./../models/Invites');
const PasswordRequests = require('./../models/PasswordRequests');
const UserRole = require("../models/UserRole");
const UsersModel = mongoose.model('Users');

module.exports = {
    getUsers: (req, res, next) => {
        const page = (req.query.page ? req.query.page : 1) - 1;
        UsersModel.find({}).limit(20).skip(page).exec((err, users)=> {
            if (err) {
                res.send(err)
            } else {
                users = users.map((user) => user.toAdminJSON());
                res.send({users})
            }
        })
    },
    getUser: (req, res, next) => {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.sendStatus(400)
        }
        UsersModel.findById(req.params.id).exec((err, user)=> {
            if (err) {
                return res.send(err)
            } else if(!user) {
                return res.sendStatus(404)
            } else {
                if(UserRole.isSuperAdmin(req.user)) {
                    res.send({user: user.toAdminJSON()});
                } else {
                    res.send({user: user.toJSON()});
                }
            }
        })
    },
    postUser: (req, res, next) => {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.sendStatus(400);
        }
        const { body: { user } } = req;
        if(!user) {
            return res.sendStatus(422);
        }
        UsersModel.findById(req.params.id).exec((err, dbUser) => {
            if (err) {
                return res.send(err);
            } else if (!dbUser) {
                return res.sendStatus(404);
            }

            if(dbUser._id.toString() === req.user._id.toString() || UserRole.isSuperAdmin(req.user)) {
                const updateStatus = dbUser.updateFromEntity(user, dbUser._id.toString() === req.user._id.toString(), UserRole.isSuperAdmin(req.user));
                dbUser.save().then(() => {
                    return res.send({user: updateStatus});
                })
            } else {
                return res.sendStatus(410);
            }
        })
    },
    getSquads: (req, res, next) => {
        UsersModel.find({}).exec((err, users) => {
            if (err) {
                return res.send(err);
            }

            const squads = {};
            users.forEach((user) => {
                user.squads.forEach((squad) => {
                    if(!Array.isArray(squads[squad])) {
                        squads[squad] = new Array();
                    }
                    squads[squad].push(user.toJSON());
                })
            });

            return res.send({squads});
        })
    }
};