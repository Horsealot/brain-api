const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

var self = {
    postCategory: async (req, res, next) => {
        const {body: {category}} = req;
        if (!category || !category.name) {
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
        if(!req.squadId) {
            return res.sendStatus(403);
        }
        let categories = [];
        models.ToolCategories.findAll({where: {SquadId: req.squadId}, include: ['tools'], order: [['order', 'ASC'], ['tools', 'order', 'ASC']]}).then((squadCategories) => {
            if(squadCategories) {
                squadCategories.forEach((squadCategory) => {
                    categories.push({
                        id: squadCategory.id,
                        name: squadCategory.name,
                        isSquad: true,
                        tools: squadCategory.tools.map((tool) => {
                            return {
                                id: tool.id,
                                name: tool.name,
                                link: tool.link,
                                icon: tool.icon
                            }
                        })
                    });
                })
            }
            return models.ToolCategories.findAll({where: {UserId: req.user.id}, include: ['tools'], order: [['order', 'ASC'], ['tools', 'order', 'ASC']]})
        }).then((userCategories) => {
            if(userCategories) {
                userCategories.forEach((userCategory) => {
                    categories.push({
                        id: userCategory.id,
                        name: userCategory.name,
                        isSquad: false,
                        tools: userCategory.tools.map((tool) => {
                            return {
                                id: tool.id,
                                name: tool.name,
                                link: tool.link,
                                icon: tool.icon
                            }
                        })
                    });
                })
            }
            return res.json({categories});
        })
    },
    postTools: async (req, res, next) => {
        const {body: {tool}} = req;
        if (!tool || !tool.categoryId) {
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