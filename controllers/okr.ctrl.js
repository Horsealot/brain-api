const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

const self = {
    postOkr: async (req, res, next) => {
        const {body: {okr}} = req;
        if (!okr || !okr.link || !okr.picture) {
            return res.status(422).json({
                errors: {
                    link: 'is required',
                    picture: 'is required'
                }
            });
        }
        let dbOkr = new models.Okrs(okr);
        let currentPeriod = await models.Periods.findOne({
            where: {
                startDate: {$lte: new Date()},
                endDate: {$gte: new Date()}
            }
        });
        if (!currentPeriod) {
            return res.sendStatus(400);
        }
        if (req.squadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: req.squadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
            dbOkr.SquadId = req.squadId;
        } else {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
            dbOkr.SquadId = null;
        }
        dbOkr.PeriodId = currentPeriod.id;

        if (await models.Okrs.findOne({where: {SquadId: dbOkr.SquadId, PeriodId: dbOkr.PeriodId}})) {
            return res.sendStatus(409);
        }

        return dbOkr.save().then((dbOkr) => {
            dbOkr = dbOkr.toJSON();
            dbOkr.period = currentPeriod.toJSON();
            res.json({okr: dbOkr});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    updateOkr: async (req, res, next) => {
        const {body: {okr}} = req;
        const {params: {id}} = req;
        let dbOkr = await models.Okrs.findOne({where: {id: id}, include: ['period']});
        if (!dbOkr) {
            return res.sendStatus(404);
        }
        if (dbOkr.SquadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: dbOkr.SquadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
        } else {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        }
        if (okr.link) dbOkr.link = okr.link;
        if (okr.picture) dbOkr.picture = okr.picture;
        if (okr.goal) dbOkr.goal = okr.goal;

        return dbOkr.save().then((dbOkr) => {
            res.json({okr: dbOkr.toJSON()});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    deleteOkr: async (req, res, next) => {
        const {params: {id}} = req;
        let dbOkr = await models.Okrs.findOne({where: {id: id}});
        if (!dbOkr) {
            return res.sendStatus(404);
        }
        if (dbOkr.SquadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: dbOkr.SquadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
        } else {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        }

        return dbOkr.destroy().then(() => {
            res.sendStatus(200);
        }).catch((err) => {
            res.sendStatus(400);
        });
    },
    getOkr: async (req, res, next) => {
        let currentPeriod = await models.Periods.findOne({
            where: {
                startDate: {$lte: new Date()},
                endDate: {$gte: new Date()}
            }
        });
        if (!currentPeriod) {
            return res.sendStatus(400);
        }
        let okrs = await models.Okrs.findAll({
            where: {
                PeriodId: currentPeriod.id,
                $or: [{SquadId: null}, {SquadId: req.squadId}]
            }, order: [['SquadId', 'DESC']]
        });
        let response = {okr: null, squadOkr: null, period: currentPeriod};
        okrs.forEach((okr) => {
            const jsonOkr = {...okr.toJSON(), period: currentPeriod.toJSON()};
            if (jsonOkr.isSquad) {
                response.squadOkr = jsonOkr;
            } else {
                response.okr = jsonOkr;
            }
        });
        return res.json(response);
    },
    getPastOkr: async (req, res, next) => {
        let okrs = await models.Okrs.findAll({
            where: {$or: [{SquadId: null}, {SquadId: req.squadId}]},
            order: [['SquadId', 'DESC']],
            include: ['period']
        });
        let response = {};
        okrs.forEach((okr) => {
            // console.log(okr);
            if (!response[okr.period.id]) {
                response[okr.period.id] = {
                    period: okr.period
                };
            }
            if (okr.SquadId) {
                response[okr.period.id].squadOkr = okr.toJSON();
            } else {
                response[okr.period.id].okr = okr.toJSON();
            }
        });
        return res.json({okrs: Object.values(response)});
    },
};

module.exports = self;