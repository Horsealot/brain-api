'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'DashboardModules',
            'title',
            Sequelize.STRING
        );
    },

    down: function(queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.removeColumn(
            'DashboardModules',
            'title'
        );
    }
};