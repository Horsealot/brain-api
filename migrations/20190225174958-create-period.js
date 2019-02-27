'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Periods',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                name: Sequelize.STRING,
                startDate: Sequelize.DATE,
                endDate: Sequelize.DATE,
            }
        );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Periods')
    }
};