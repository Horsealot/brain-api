//Note: I am oversimplifying this model For the sake of brevity
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('ToolCategories',
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
                name: Sequelize.STRING,
                order: Sequelize.INTEGER,
                createdAt: Sequelize.DATE,
            }
        )},
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('ToolCategories')
    }
};