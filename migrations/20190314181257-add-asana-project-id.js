'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'Squads',
            'asanaProjectId',
            Sequelize.STRING
        );
    },

    down: function(queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.removeColumn(
            'Squads',
            'asanaProjectId'
        );
    }
};