const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

const self = {
    postHowTo: async (req, res, next) => {
        const {body: {howTo}} = req;
        if (!howTo || !howTo.content) {
            return res.status(422).json({
                errors: {
                    content: 'is required'
                }
            });
        }

        let dbHowTo = new models.HowTos(howTo);
        if (howTo.squadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: howTo.squadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
            if (!(await models.Squads.findOne({where: {id: howTo.squadId}}))) {
                return res.sendStatus(404);
            }
            dbHowTo.SquadId = howTo.squadId;
        } else if (UserRole.isSuperAdmin(req.user)) {
            dbHowTo.SquadId = null;
            howTo.squadId = null;
        } else {
            return res.sendStatus(403);
        }

        const previousHowTo = await models.HowTos.findOne({
            where: {SquadId: howTo.squadId},
            order: [['version', 'DESC']]
        });
        dbHowTo.version = previousHowTo ? (previousHowTo.version + 1) : 1;
        dbHowTo.author = req.user.id;

        return dbHowTo.save().then(() => {
            res.json({howTo: dbHowTo.toJSON()});
        }).catch((err) => {
            res.sendStatus(400)
        });
    },
    deleteHowTo: async (req, res, next) => {
        const {params: {id}} = req;
        const howTo = await models.HowTos.findOne({where: {id: id}});
        if (!howTo) {
            return res.sendStatus(404);
        }
        if (howTo.SquadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: howTo.SquadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user)) {
            return res.sendStatus(403);
        }

        return howTo.destroy().then(() => {
            res.json({});
        }).catch((err) => {
            res.sendStatus(400);
        });
    },
    getHowTo: async (req, res, next) => {
        if (!req.squadId) {
            return res.sendStatus(403);
        }
        if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: req.squadId
            }
        }))) {
            return res.sendStatus(403);
        }

        const brainHowTo = await models.HowTos.findOne({where: {SquadId: null}, order: [['version', 'DESC']]});
        const squadHowTo = await models.HowTos.findOne({where: {SquadId: req.squadId}, order: [['version', 'DESC']]});

        let result = {
            howTo: brainHowTo,
            squadHowTo: squadHowTo
        };

        res.json(result);
    },
};

module.exports = self;