const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

var self = {
    postGoals: async (req, res, next) => {
        const {body: {goal}} = req;
        if (!goal || !goal.length) {
            return res.status(422).json({
                errors: {
                    goal: 'is required',
                }
            });
        }
        let dbGoal = new models.UserGoals({value: goal});
        let currentPeriod = await models.Periods.findOne({where: {startDate: {$lte: new Date()}, endDate: {$gte: new Date()}}});
        if(!currentPeriod) {
            return res.sendStatus(400);
        }
        dbGoal.PeriodId = currentPeriod.id;
        dbGoal.UserId = req.user.id;

        return dbGoal.save().then((dbGoal) => {
            res.json({goal: dbGoal.toJSON()});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    updateGoals: async (req, res, next) => {
        const {body: {goal}} = req;
        if (!goal || !goal.length) {
            return res.status(422).json({
                errors: {
                    goal: 'is required',
                }
            });
        }
        const {params: {id}} = req;
        let dbGoal = await models.UserGoals.findOne({where: {id: id}});
        if(!dbGoal) {
            return res.sendStatus(404);
        }
        if(dbGoal.UserId !== req.user.id && !UserRole.isSuperAdmin(req.user)) {
            return res.sendStatus(403);
        }
        let currentPeriod = await models.Periods.findOne({where: {startDate: {$lte: new Date()}, endDate: {$gte: new Date()}}});
        if(!currentPeriod || currentPeriod.id !== dbGoal.PeriodId) {
            return res.sendStatus(400);
        }
        dbGoal.value = goal;

        return dbGoal.save().then((dbGoal) => {
            res.json({goal: dbGoal.toJSON()});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    deleteGoals: async (req, res, next) => {
        const {params: {id}} = req;
        let goal = await models.UserGoals.findOne({where: {id: id}});
        if(!goal) {
            return res.sendStatus(404);
        }
        if(goal.UserId !== req.user.id && !UserRole.isSuperAdmin(req.user)) {
            return res.sendStatus(403);
        }
        let currentPeriod = await models.Periods.findOne({where: {startDate: {$lte: new Date()}, endDate: {$gte: new Date()}}});
        if(!currentPeriod || currentPeriod.id !== goal.PeriodId) {
            return res.sendStatus(400);
        }

        return goal.destroy().then(() => {
            res.sendStatus(200);
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    getGoals: async (req, res, next) => {
        let currentPeriod = await models.Periods.findOne({
            where: {
                startDate: {$lte: new Date()},
                endDate: {$gte: new Date()}
            }
        });
        if(!currentPeriod) {
            return res.sendStatus(400);
        }
        let goals = await models.UserGoals.findAll({where: {PeriodId: currentPeriod.id, UserId: req.user.id}});
        return res.json({goals});
    },
    getUserGoals: async (req, res, next) => {
        const {params: {id}} = req;
        let currentPeriod = await models.Periods.findOne({
            where: {
                startDate: {$lte: new Date()},
                endDate: {$gte: new Date()}
            }
        });
        if(!currentPeriod) {
            return res.sendStatus(400);
        }
        let goals = await models.UserGoals.findAll({where: {PeriodId: currentPeriod.id, UserId: id}});
        return res.json({goals});
    },
};

module.exports = self;