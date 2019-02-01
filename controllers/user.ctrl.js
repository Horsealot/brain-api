/**
 * Don't know why but this is the only place were I can require them
 */

const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

module.exports = {
    getUsers: (req, res, next) => {
        const page = (req.query.page ? req.query.page : 1) - 1;
        models.Users.findAll({ offset: page*20, limit: 20 }).then((users)=> {
            // if (err) {
            //     res.send(err)
            // } else {
                users = users.map((user) => user.toAdminJSON());
                res.send({users})
            // }
        }).catch((err) => {
            res.sendStatus(500);
        });
    },
    getUser: (req, res, next) => {
        if(req.user.publicId === req.params.id) {
            res.send({user: req.user.toAdminJSON()});
        } else {
            models.Users.findOne({where: {publicId: req.params.id}}).then((user)=> {
                if(!user) {
                    return res.sendStatus(404)
                } else {
                    if(UserRole.isSuperAdmin(req.user)) {
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
    postUser: (req, res, next) => {
        models.Users.findOne({where: {publicId: req.params.id}, include: ['squads']}).then(async (dbUser) => {
            const {body: {user}} = req;
            if (!user) {
                return res.sendStatus(422);
            }
            if (!dbUser) {
                return res.sendStatus(404);
            }
            if (dbUser.id === req.user.id || UserRole.isSuperAdmin(req.user)) {
                const updateStatus = dbUser.updateFromEntity(user, dbUser.id === req.user.id, UserRole.isSuperAdmin(req.user));

                if (UserRole.isSuperAdmin(req.user) && user.squads) {
                    dbUser.squads.forEach((actualUserSquad) => {
                        let indexOfExisitingSquad = -1;
                        user.squads.forEach(async (squad, index) => {
                            if (squad.name === actualUserSquad.slug) {
                                actualUserSquad.UserSquads.role = squad.role;
                                await actualUserSquad.UserSquads.save();
                                indexOfExisitingSquad = index;
                            }
                        });
                        if(indexOfExisitingSquad >= 0) {
                            user.squads.splice(indexOfExisitingSquad, 1);
                        } else {
                            dbUser.removeSquad(actualUserSquad);
                        }
                    });
                    const newSquads = await models.Squads.findAll({where: {slug: {in: user.squads.map((squad) => squad.name)}}});
                    newSquads.forEach((squad) => {
                        user.squads.forEach((userSquad) => {
                            if(squad.slug === userSquad.name) {
                                dbUser.addSquad(squad, {through: {role: userSquad.role}});
                            }
                        })
                    });
                    updateStatus.squads = 'updated';
                }

                dbUser.save().then(() => {
                    return res.send({user: updateStatus});
                })
            } else {
                return res.sendStatus(410);
            }
        }).catch((err) => {
            res.sendStatus(400);
        });
    },
    getSquads: (req, res, next) => {
        models.Users.findAll({include: ['squads']}).then((users) => {
            const squads = {};
            users.forEach((user) => {
                user.parseSquads().forEach((squad) => {
                    if(!Array.isArray(squads[squad.name])) {
                        squads[squad.name] = new Array();
                    }
                    squads[squad.name].push(user.toJSON());
                })
            });

            return res.send({squads});
        })
    }
};