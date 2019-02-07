const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

var self = {
    postCategory: async (req, res, next) => {
        const {body: {category}} = req;
        if (!category.name) {
            return res.status(422).json({
                errors: {
                    name: 'is required'
                }
            });
        }
        let dbCategory = new models.ToolCategories(category);
        if (category.squadId) {
            if(!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: category.squadId, role: 'ADMIN'}}))) {
                return res.sendStatus(403);
            }
            if(!(await models.Squads.findOne({where: {id: category.squadId}}))) {
                return res.sendStatus(404);
            }
            dbCategory.SquadId = category.squadId;
            dbCategory.UserId = null;
        } else {
            if(dbCategory.UserId && dbCategory.UserId !== req.user.id) {
                return res.sendStatus(403);
            }
            dbCategory.UserId = req.user.id;
            dbCategory.SquadId = null;
        }

        return dbCategory.save().then(() => {
            res.json({category: dbCategory.toJSON()});
        }).catch((err) => {
            res.sendStatus(400)
        });
    },
    updateCategory: async (req, res, next) => {
        const {body: {category}} = req;
        const {params: {id}} = req;
        let dbCategory = await models.ToolCategories.findOne({where: {id: id}});
        if(!dbCategory) {
            return res.sendStatus(404);
        }
        if (dbCategory.SquadId) {
            if(!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: dbCategory.SquadId, role: 'ADMIN'}}))) {
                return res.sendStatus(403);
            }
            if(!(await models.Squads.findOne({where: {id: dbCategory.SquadId}}))) {
                return res.sendStatus(404);
            }
            if(category.squadId && (await models.Squads.findOne({where: {id: category.SquadId}}))) {
                dbCategory.SquadId = category.squadId;
            }
            dbCategory.UserId = null;
        } else {
            if(dbCategory.UserId && dbCategory.UserId !== req.user.id) {
                return res.sendStatus(403);
            }
            dbCategory.UserId = req.user.id;
            dbCategory.SquadId = null;
        }
        dbCategory.name = category.name;
        dbCategory.order = category.order;

        return dbCategory.save().then(() => {
            res.json({category: dbCategory.toJSON()});
        }).catch((err) => {
            res.sendStatus(400)
        });
    },
    deleteCategory: async (req, res, next) => {
        const {params: {id}} = req;
        let dbCategory = await models.ToolCategories.findOne({where: {id: id}, include: ['tools']});
        if(!dbCategory) {
            return res.sendStatus(404);
        }
        if (dbCategory.SquadId) {
            if(!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: dbCategory.SquadId, role: 'ADMIN'}}))) {
                return res.sendStatus(403);
            }
            if(!(await models.Squads.findOne({where: {id: dbCategory.SquadId}}))) {
                return res.sendStatus(404);
            }
        } else {
            if(dbCategory.UserId && dbCategory.UserId !== req.user.id) {
                return res.sendStatus(403);
            }
        }

        return dbCategory.destroy().then(() => {
            res.json();
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400)
        });
    },
    getTools: (req, res, next) => {
        models.Squads.findOne({where: {id: req.squadId}, include: ['users']}).then((squad) => {
            return res.sendStatus(404);
            return res.send({squad: response});
        }).catch((err) => {
            res.sendStatus(500);
        });
    },
    postTools: async (req, res, next) => {
        const {body: {tool}} = req;
        if (!tool.categoryId) {
            return res.status(422).json({
                errors: {
                    category: 'is required'
                }
            });
        }

        let category = await models.ToolCategories.findOne({where: {id: tool.categoryId}});
        if (!category) {
            return res.sendStatus(404);
        }
        if (category.SquadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: category.SquadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
            if (!(await models.Squads.findOne({where: {id: category.SquadId}}))) {
                return res.sendStatus(404);
            }
        } else if (category.UserId && category.UserId !== req.user.id) {
            return res.sendStatus(403);
        }
        let dbTool = new models.Tools(tool);
        dbTool.CategoryId = tool.categoryId;
        return dbTool.save().then(() => res.json({tool: dbTool.toJSON()}))
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    },
    updateTools: async (req, res, next) => {
        const {body: {tool}} = req;
        const {params: {id}} = req;
        let dbTool = await models.Tools.findOne({where: {id: id}, include: ['category']});
        if(!dbTool) {
            return res.sendStatus(404);
        }

        if (!dbTool.category) {
            return res.sendStatus(404);
        }
        if (dbTool.category.SquadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: dbTool.category.SquadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
            if (!(await models.Squads.findOne({where: {id: dbTool.category.SquadId}}))) {
                return res.sendStatus(404);
            }
        } else if (dbTool.category.UserId && dbTool.category.UserId !== req.user.id) {
            return res.sendStatus(403);
        }
        dbTool.order = tool.order;
        dbTool.name = tool.name;
        dbTool.icon = tool.icon;
        dbTool.link = tool.link;
        return dbTool.save().then(() => res.json({tool: dbTool.toJSON()}))
            .catch((err) => {
                res.sendStatus(500);
            });
    },
    deleteTool: async (req, res, next) => {
        const {params: {id}} = req;
        let dbTool = await models.Tools.findOne({where: {id: id}, include: ['category']});
        if(!dbTool) {
            return res.sendStatus(404);
        }

        if (!dbTool.category) {
            return res.sendStatus(404);
        }
        if (dbTool.category.SquadId) {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: dbTool.category.SquadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
            if (!(await models.Squads.findOne({where: {id: dbTool.category.SquadId}}))) {
                return res.sendStatus(404);
            }
        } else if (dbTool.category.UserId && dbTool.category.UserId !== req.user.id) {
            return res.sendStatus(403);
        }
        return dbTool.destroy().then(() => res.json({}))
            .catch((err) => {
                res.sendStatus(500);
            });
    },
};

module.exports = self;