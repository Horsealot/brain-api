'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Okrs',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                PeriodId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Periods',
                        key: 'id'
                    },
                    allowNull: true
                },
                SquadId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Squads',
                        key: 'id'
                    },
                    allowNull: true
                },
                link: Sequelize.STRING,
                picture: Sequelize.STRING,
            }
        );
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Okrs')
    }
};