'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('DashboardModules',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                DashboardId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Dashboards',
                        key: 'id'
                    },
                    allowNull: true
                },
                type: {
                    type: Sequelize.ENUM,
                    values: ['chart', 'goal', 'period'],
                },
                order: Sequelize.STRING,
                properties: Sequelize.JSON,
                width: Sequelize.STRING,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
            }
        );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('DashboardModules')
    }
};