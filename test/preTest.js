const models = require('./../models');

module.exports = {
    cleanDB: (done) => {
        return models.PasswordRequests.destroy({where: {}}).then(() => {
            return models.HowTos.destroy({where: {}});
        }).then(() => {
            return models.Tools.destroy({where: {}});
        }).then(() => {
            return models.UserGoals.destroy({where: {}});
        }).then(() => {
            return models.ToolCategories.destroy({where: {}});
        }).then(() => {
            return models.Okrs.destroy({where: {}});
        }).then(() => {
            return models.DashboardModules.destroy({where: {}});
        }).then(() => {
            return models.Dashboards.destroy({where: {}});
        }).then(() => {
            return models.Products.destroy({where: {}});
        }).then(() => {
            return models.Invites.destroy({where: {}});
        }).then(() => {
            return models.UserSquads.destroy({where: {}});
        }).then(() => {
            return models.Users.destroy({where: {}});
        }).then(() => {
            return models.Squads.destroy({where: {}});
        }).then(() => {
            return models.Periods.destroy({where: {}});
        });
    }
};