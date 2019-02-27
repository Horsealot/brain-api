'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn(
            'Okrs',
            'goal',
            Sequelize.STRING
        );
    },

    down: function(queryInterface, Sequelize) {
        // logic for reverting the changes
        return queryInterface.removeColumn(
            'Okrs',
            'goal'
        );
    }
};