const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");
const kpiService = require('./../services/kpi.service');
const async = require("async");
const dashboardModuleService = require("../services/dashboardModule.service");

const self = {
    postDashboard: async (req, res, next) => {
        const {body: {dashboard}} = req;
        if (!dashboard || !dashboard.name || (!dashboard.productId && !dashboard.squadId)) {
            return res.status(422).json({
                errors: {
                    name: 'is required'
                }
            });
        }
        let dbDashboard = new models.Dashboards(dashboard);
        if (dashboard.productId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
            if (!(await models.Products.findOne({where: {id: dashboard.productId}}))) {
                return res.sendStatus(404);
            }
            dbDashboard.ProductId = dashboard.productId;
            dbDashboard.SquadId = null;
        } else {
            if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
                where: {
                    UserId: req.user.id,
                    SquadId: dashboard.squadId,
                    role: 'ADMIN'
                }
            }))) {
                return res.sendStatus(403);
            }
            dbDashboard.SquadId = dashboard.squadId;
            dbDashboard.ProductId = null;
        }

        return dbDashboard.save().then(() => {
            res.json({dashboard: dbDashboard.toJSON()});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400)
        });
    },
    updateDashboard: async (req, res, next) => {
        let {body: {dashboard, modules}} = req;
        const {params: {id}} = req;
        let dbDashboard;
        try {
            dbDashboard = await models.Dashboards.findOne({where: {publicId: id}});
        } catch (err) {
            return res.sendStatus(400);
        }
        if (!dbDashboard) {
            return res.sendStatus(404);
        }
        if (dbDashboard.ProductId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: dbDashboard.SquadId,
                role: 'ADMIN'
            }
        }))) {
            return res.sendStatus(403);
        }
        dbDashboard.name = dashboard.name;

        let existingModules = await models.DashboardModules.findAll({where: {DashboardId: dbDashboard.id}});
        while (existingModules.length) {
            const existingModule = existingModules.pop();
            let moduleMustBeDeleted = true;
            for (let i = 0; i < modules.length; i++) {
                if (modules[i].id === existingModule.id) {
                    moduleMustBeDeleted = false;
                    existingModule.type = modules[i].type;
                    existingModule.properties = modules[i].properties;
                    modules[i] = existingModule;
                }
            }
            if (moduleMustBeDeleted) {
                await existingModule.destroy();
            }
        }
        let error = [];
        for (let i = 0; i < modules.length; i++) {
            let module = (modules[i] instanceof models.DashboardModules) ? modules[i] : new models.DashboardModules(modules[i]);
            if (module.validateProperties() !== null) {
                error.push(module.validateProperties().error);
            }
            module.DashboardId = dbDashboard.id;
            module.order = i;
            await module.save();
        }
        if (error.length) {
            return res.json({modules: error});
        }

        return dbDashboard.save().then(() => {
            return models.Dashboards.findOne({where: {publicId: id}, include: ['modules']});
        }).then((dbDashboard) => {
            res.json({dashboard: dbDashboard.toJSON()});
        }).catch((err) => {
            res.sendStatus(400)
        });
    },
    addModuleToDashboard: async (req, res, next) => {
        let {body: {module}} = req;
        const {params: {id}} = req;
        let dbDashboard;
        try {
            dbDashboard = await models.Dashboards.findOne({where: {publicId: id}, include: ['modules']});
        } catch (err) {
            return res.sendStatus(400);
        }
        if (!dbDashboard) {
            return res.sendStatus(404);
        }
        if (dbDashboard.ProductId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: dbDashboard.SquadId,
                role: 'ADMIN'
            }
        }))) {
            return res.sendStatus(403);
        }
        let error = [];
        module = new models.DashboardModules(module);
        if (module.validateProperties() !== null) {
            return res.json({modules: module.validateProperties().error});
        }
        module.DashboardId = dbDashboard.id;
        module.order = dbDashboard.modules.length;
        module.save().then((module) => {
            return dashboardModuleService.loadModuleStats(req.user, module);
        }).then(() => {
            res.json({module: {
                id: module.id,
                order: module.order,
                properties: module.properties,
                title: module.title,
                type: module.type,
                stats: module.stats,
                width: module.width,
            }});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    updateModule: async (req, res, next) => {
        let {body: {module}} = req;
        const {params: {moduleId}} = req;
        let dbModule;
        try {
            dbModule = await models.DashboardModules.findOne({where: {id: moduleId}, include: ['dashboard']});
        } catch (err) {
            return res.sendStatus(400);
        }
        if (!dbModule) {
            return res.sendStatus(404);
        }
        if (dbModule.dashboard.ProductId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: dbModule.dashboard.SquadId,
                role: 'ADMIN'
            }
        }))) {
            return res.sendStatus(403);
        }
        dbModule.updateFromEntity(module);
        if (dbModule.validateProperties() !== null) {
            return res.json({modules: dbModule.validateProperties().error});
        }
        dbModule.save().then((dbModule) => {
            return dashboardModuleService.loadModuleStats(req.user, dbModule);
        }).then(() => {
            res.json({module: {
                id: dbModule.id,
                order: dbModule.order,
                properties: dbModule.properties,
                title: dbModule.title,
                type: dbModule.type,
                stats: dbModule.stats,
                width: dbModule.width,
            }});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    removeModuleToDashboard: async (req, res, next) => {
        const {params: {id, moduleId}} = req;
        let dbDashboard;
        try {
            dbDashboard = await models.Dashboards.findOne({where: {publicId: id}});
        } catch (err) {
            return res.sendStatus(400);
        }
        if (!dbDashboard) {
            return res.sendStatus(404);
        }
        let dbModule = await models.DashboardModules.findOne({where: {DashboardId: dbDashboard.id, id: moduleId}});
        if (!dbModule) {
            return res.sendStatus(404);
        }
        if (dbDashboard.ProductId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: dbDashboard.SquadId,
                role: 'ADMIN'
            }
        }))) {
            return res.sendStatus(403);
        }
        dbModule.destroy().then(() => {
            res.json({});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
    deleteDashboard: async (req, res, next) => {
        const {params: {id}} = req;
        let dashboard;
        try {
            dashboard = await models.Dashboards.findOne({where: {publicId: id}});
        } catch (err) {
            return res.sendStatus(400);
        }
        if (!dashboard) {
            return res.sendStatus(404);
        }
        if (dashboard.ProductId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: dashboard.SquadId,
                role: 'ADMIN'
            }
        }))) {
            return res.sendStatus(403);
        }

        return dashboard.destroy().then(() => {
            res.json();
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400)
        });
    },
    getDashboard: async (req, res, next) => {
        const {params: {id}} = req;
        let dashboard;
        try {
            dashboard = await models.Dashboards.findOne({
                where: {publicId: id},
                include: ['modules'],
                order: [['modules', 'order', 'ASC']]
            });
        } catch (err) {
            return res.sendStatus(400);
        }
        if (!dashboard) {
            return res.sendStatus(404);
        }
        if (dashboard.ProductId) {
            if (!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(403);
            }
        } else if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({
            where: {
                UserId: req.user.id,
                SquadId: dashboard.SquadId,
                role: 'ADMIN'
            }
        }))) {
            return res.sendStatus(403);
        }

        if (!dashboard.modules) {
            dashboard.modules = [];
        }
        let moduleLoaders = [];
        dashboard = dashboard.toJSON();
        dashboard.id = dashboard.publicId;
        dashboard.modules.forEach((module) => {
            moduleLoaders.push((callback) => {
                dashboardModuleService.loadModuleStats(req.user, module).then(() => {
                    callback();
                }).catch((err) => {
                    console.log(err);
                    callback();
                })
            })
        });

        async.parallel(moduleLoaders, () => {
            return res.json({dashboard});
        });
    },
    getMyDashboard: async (req, res, next) => {
        const {params: {id}} = req;
        let dashboard = await models.Dashboards.findOne({
            where: {SquadId: req.squadId},
            include: ['modules'],
            order: [['modules', 'order', 'ASC']]
        });
        if (!dashboard) {
            return res.sendStatus(404);
        }
        if (!dashboard.modules) {
            dashboard.modules = [];
        }
        let moduleLoaders = [];
        dashboard = dashboard.toJSON();
        dashboard.id = dashboard.publicId;
        dashboard.modules.forEach((module) => {
            moduleLoaders.push((callback) => {
                dashboardModuleService.loadModuleStats(req.user, module).then((module) => {
                    callback();
                })
            })
        });

        async.parallel(moduleLoaders, () => {
            console.log(dashboard.modules);
            return res.json({dashboard});
        });
    },
    getDashboards: (req, res, next) => {
        if (!req.squadId) {
            return res.sendStatus(403);
        }
        let categories = [];
        models.ToolCategories.findAll({
            where: {SquadId: req.squadId},
            include: ['tools'],
            order: [['order', 'ASC'], ['tools', 'order', 'ASC']]
        }).then((squadCategories) => {
            if (squadCategories) {
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
            return models.ToolCategories.findAll({
                where: {UserId: req.user.id},
                include: ['tools'],
                order: [['order', 'ASC'], ['tools', 'order', 'ASC']]
            })
        }).then((userCategories) => {
            if (userCategories) {
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
    getKpis: (req, res, next) => {
        kpiService.getKpis(req.user).then((kpis) => {
            return res.json({kpis});
        }).catch((err) => {
            console.log(err);
            return res.sendStatus(501);
        });
    },
    postKpis: (req, res, next) => {
        kpiService.postKpis(req.user, req.params.id, req.body).then((data) => {
            return res.json({data});
        }).catch((err) => {
            console.log(err);
            return res.sendStatus(501);
        });
    },
    updateKpis: (req, res, next) => {
        kpiService.updateKpis(req.user, req.params.id, req.body).then((data) => {
            return res.json({data});
        }).catch((err) => {
            console.log(err);
            return res.sendStatus(501);
        });
    },
    deleteKpis: (req, res, next) => {
        kpiService.deleteKpis(req.user, req.params.id).then((data) => {
            return res.json({data});
        }).catch((err) => {
            console.log(err);
            return res.sendStatus(501);
        });
    }
};

module.exports = self;