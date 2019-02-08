const jwt = require('express-jwt');
const mongoose = require('mongoose');
const user = require('./../../models/user');
// const UserRole = require('./../../models/UserRole');
// const UsersModel = mongoose.model('Users');

const models = require('./../../models');
const UserRole = require("../../old_models/mongoose/UserRole");

const userRightsNomenclature = require('./userRightsNomenclature.json');

const getTokenFromHeaders = (req) => {
    const { headers: { authorization } } = req;

    if(authorization && authorization.split(' ')[0] === 'Bearer') {
        return authorization.split(' ')[1];
    }
    return null;
};

const getSquadFromHeaders = (req) => {
    return req.headers['brain-squad'];
};

const auth = {
    required: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
    }),
    optional: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        credentialsRequired: false,
    }),
    loadUser: (req, res, next) => {
        const { payload: { id } } = req;
        models.Users.findOne({where: {publicId: id}, include: ['squads']}).then((user) => {
            if(!user) {
                return res.sendStatus(400);
            }
            req.user = user;
            next();
        }).catch(() => {
            return res.sendStatus(400);
        });
    },
    loadSquad: (req, res, next) => {
        const squadId = getSquadFromHeaders(req);
        models.Squads.findOne({where: {id: squadId}}).then((squad) => {
            if(!squad) {
                return res.sendStatus(400);
            }
            req.squad = squad;
            next();
        }).catch(() => {
            return res.sendStatus(400);
        });
    },
    loadSquadId: (req, res, next) => {
        req.squadId = getSquadFromHeaders(req);
        next();
    },
    admin: (req, res, next) => {
        if(!req.user) {
            const { payload: { id } } = req;
            models.Users.findOne({where: {publicId: id}, include: ['squads']}).then((user) => {
                if(!user) {
                    return res.sendStatus(400);
                }
                req.user = user;
                if(!UserRole.isSuperAdmin(req.user)) {
                    return res.sendStatus(403);
                }
                next();
            }).catch(() => {
                return res.sendStatus(400);
            });
        } else {
            if(!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
            next();
        }
    },
    squadAdmin: async (req, res, next) => {
        if (!req.user) {
            const { payload: { id } } = req;
            try {
                req.user = await models.Users.findOne({where: {publicId: id}, include: ['squads']});
            } catch (e) {
                return res.sendStatus(400);
            }
        }
        if (!req.user) {
            return res.sendStatus(400);
        }
        const squadId = getSquadFromHeaders(req);
        req.squadId = squadId;
        if (!UserRole.isSuperAdmin(req.user)) {
            const userRoleInSquad = await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: squadId}});
            if(!userRoleInSquad || userRoleInSquad.role !== 'ADMIN') {
                return res.sendStatus(403);
            }
        }
        next();
    },
    squadAdminOrSuperadmin: async (req, res, next) => {
        if (!req.user) {
            const { payload: { id } } = req;
            req.user = await models.Users.findOne({where: {publicId: id}, include: ['squads']});
        }
        if (!req.user) {
            return res.sendStatus(400);
        }
        const squadId = getSquadFromHeaders(req);
        if(squadId) {
            req.squadId = squadId;
            if (!UserRole.isSuperAdmin(req.user)) {
                const userRoleInSquad = await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: squadId}});
                if(!userRoleInSquad || userRoleInSquad.role !== 'ADMIN') {
                    return res.sendStatus(403);
                }
            }
        } else if(!UserRole.isSuperAdmin(req.user)) {
            return res.sendStatus(403);
        }
        next();
    },
    hasRightsOnUser: async (req, res, next) => {
        if (!req.user) {
            const { payload: { id } } = req;
            try {
                req.user = await models.Users.findOne({where: {publicId: id}, include: ['squads']});
            } catch (e) {
                return res.sendStatus(400);
            }
        }
        if (!req.user) {
            return res.sendStatus(400);
        }

        try {
            req.targetUser = await models.Users.findOne({where: {publicId: req.params.id}, include: ['squads']});
        } catch (e) {
            return res.sendStatus(400);
        }
        if(!req.targetUser) {
            return res.sendStatus(404);
        }
        const squadId = getSquadFromHeaders(req);
        req.userRights = [];
        if(squadId) {
            req.squadId = squadId;
            if (!UserRole.isSuperAdmin(req.user)) {
                const userRoleInSquad = await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: squadId, role: 'ADMIN'}});
                if(!userRoleInSquad) {
                    return res.sendStatus(403);
                }
                req.userRights.push(userRightsNomenclature.SQUAD_ADMIN);
            }
        } else if(!UserRole.isSuperAdmin(req.user) && req.user.id !== req.targetUser.id) {
            return res.sendStatus(403);
        }

        if(req.user.id === req.targetUser.id) {
            req.userRights.push(userRightsNomenclature.OWNER);
        }
        if(UserRole.isSuperAdmin(req.user)) {
            req.userRights.push(userRightsNomenclature.SUPER_ADMIN);
        }
        next();
    }
};

module.exports = auth;