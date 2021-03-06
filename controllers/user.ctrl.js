/**
 * Don't know why but this is the only place were I can require them
 */

const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

const userRightsNomenclature = require('./../routes/tools/userRightsNomenclature.json');

const self = {
    // getUsers: (req, res, next) => {
    //     const page = (req.query.page ? req.query.page : 1) - 1;
    //     models.Users.findAll({ offset: page*20, limit: 20 }).then((users)=> {
    //             users = users.map((user) => user.toAdminJSON());
    //             res.send({users})
    //         // }
    //     }).catch((err) => {
    //         res.sendStatus(500);
    //     });
    // },
    getSquad: (req, res, next) => {
        models.Squads.findOne({where: {id: req.squadId}, include: ['users']}).then((squad) => {
            if (!squad) {
                return res.sendStatus(404);
            }
            let response = squad.toJSON();
            response.users = squad.users.map((user) => {
                const jsonUser = user.toAdminJSON();
                jsonUser.role = user.UserSquads.role;
                return jsonUser;
            });

            return res.send({squad: response});
        }).catch((err) => {
            res.sendStatus(500);
        });
    },
    getUsers: (req, res, next) => {
        const squadId = req.squadId;
        if (squadId) {
            return self.getSquad(req, res, next);
        } else {
            models.Squads.findAll({include: ['users']}).then((squads) => {
                let response = [];
                squads.forEach((squad) => {
                    let jsonSquad = squad.toJSON();
                    jsonSquad.users = squad.users.map((user) => {
                        const jsonUser = user.toAdminJSON();
                        jsonUser.role = user.UserSquads.role;
                        return jsonUser;
                    });
                    response.push(jsonSquad);
                });
                res.send({squads: response});
            }).catch((err) => {
                res.sendStatus(500);
            });
        }
    },
    getUser: (req, res, next) => {
        if (req.user.publicId === req.params.id) {
            res.send({user: req.user.toAdminJSON()});
        } else {
            models.Users.findOne({where: {publicId: req.params.id}, include: ['squads']}).then((user) => {
                if (!user) {
                    return res.sendStatus(404)
                } else {
                    if (UserRole.isSuperAdmin(req.user)) {
                        res.send({user: user.toAdminJSON()});
                    } else {
                        res.send({user: user.toJSON()});
                    }
                }
            }).catch((err) => {
                res.sendStatus(400);
            });
        }
    },
    getMe: (req, res, next) => {
        res.send({user: req.user.toAdminJSON()});
    },
    postUser: async (req, res, next) => {
        const {body: {user}} = req;
        let updateStatus = {...user};
        for (var k in updateStatus) {
            updateStatus[k] = 'not allowed';
        }

        updateStatus = {...updateStatus, ...req.targetUser.updateFromEntity(user, req.userRights)};
        req.targetUser.save().then(() => {
            return res.send({user: updateStatus});
        }).catch(() => res.sendStatus(400));
    },
    getSquads: (req, res, next) => {
        models.Users.findAll({include: ['squads']}).then((users) => {
            const squads = {};
            users.forEach((user) => {
                user.parseSquads().forEach((squad) => {
                    if (!Array.isArray(squads[squad.name])) {
                        squads[squad.name] = [];
                    }
                    squads[squad.name].push(user.toJSON());
                })
            });

            return res.send({squads});
        })
    },
    postUserSquads: (req, res, next) => {
        if (!req.body.squad || !req.body.squad.role) {
            return res.status(422).json({
                errors: {
                    squad: 'is required',
                    role: 'is required'
                }
            });
        }
        if (!req.squadId) {
            return res.sendStatus(400);
        }
        const {body: {squad: {role}}} = req;
        models.Users.findOne({where: {publicId: req.params.id}}).then((user) => {
            if (!user) {
                return res.sendStatus(404)
            }
            models.UserSquads.findOne({where: {UserId: user.id, SquadId: req.squadId}}).then((existingUserSquad) => {
                if (!existingUserSquad) {
                    existingUserSquad = new models.UserSquads({UserId: user.id, SquadId: req.squadId});
                }
                existingUserSquad.role = role;
                return existingUserSquad.save();
            }).then(() => {
                res.json({});
            })
        }).catch((err) => {
            res.sendStatus(400);
        });
    },
    deleteUserSquads: (req, res, next) => {
        if (!req.squadId) {
            return res.sendStatus(400);
        }
        models.Users.findOne({where: {publicId: req.params.id}}).then((user) => {
            if (!user) {
                return res.sendStatus(404)
            }
            models.UserSquads.findOne({where: {UserId: user.id, SquadId: req.squadId}}).then((existingUserSquad) => {
                if (existingUserSquad) {
                    return existingUserSquad.destroy();
                }
            }).then(() => {
                res.json({});
            })
        }).catch((err) => {
            res.sendStatus(400);
        });
    }
};

module.exports = self;