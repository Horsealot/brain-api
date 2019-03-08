//Note: I am oversimplifying this model For the sake of brevity
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('HowTos',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                SquadId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Squads',
                        key: 'id'
                    },
                    allowNull: true
                },
                content: Sequelize.TEXT,
                version: Sequelize.INTEGER,
                author: Sequelize.INTEGER,
                createdAt: Sequelize.DATE,
                updatedAt: Sequelize.DATE,
            }
        )},
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('HowTos')
    }
};