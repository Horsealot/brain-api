//Note: I am oversimplifying this model For the sake of brevity
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('UserSquads',
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
                SquadId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Squads',
                        key: 'id'
                    },
                    allowNull: false
                },
                role: Sequelize.STRING,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
            }
        )},
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('UserSquads')
    }
};