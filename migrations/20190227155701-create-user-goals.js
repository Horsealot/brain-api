'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('UserGoals',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                UserId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Users',
                        key: 'id'
                    },
                    allowNull: false
                },
                PeriodId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Periods',
                        key: 'id'
                    },
                    allowNull: false
                },
                value: Sequelize.STRING,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
            }
        )},
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('UserGoals')
    }
};