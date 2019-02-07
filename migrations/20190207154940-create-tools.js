//Note: I am oversimplifying this model For the sake of brevity
module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('Tools',
            {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                CategoryId: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'ToolCategories',
                        key: 'id'
                    },
                    allowNull: false
                },
                name: Sequelize.STRING,
                link: Sequelize.STRING,
                icon: Sequelize.STRING,
                order: Sequelize.INTEGER,
                createdAt: Sequelize.DATE,
            }
        )},
    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable('Tools')
    }
};